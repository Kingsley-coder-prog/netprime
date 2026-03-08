# NetPrime Backend - Implementation Roadmap & Technical Specifications

## Quick Reference: Architecture Overview

```
CLIENTS
   ↓
CDN (Movies/Static Assets) + API Gateway (Load Balancer)
   ↓
API Servers (Express.js - CommonJS)
   ↓
Microservices (Auth, Movie, Streaming, User, Upload, Notifications)
   ↓
┌─────────┬──────────────┬─────────────┐
│ Redis   │ Message Queue│ S3 Storage  │
│ Cache   │ (RabbitMQ)   │ (Movies)    │
│ Rates   │ Workers      │ Backups     │
└─────────┴──────────────┴─────────────┘
   ↓
MongoDB Sharded Cluster (Database)
   ↓
Monitoring Stack (ELK, Prometheus, Jaeger)
```

---

## Part 1: Architecture Decisions Explained

### 1. **Where to Store Movie Files?**

#### ❌ **What NOT to do:**
```javascript
// DON'T: Store in local filesystem
app.post('/upload', (req, res) => {
  fs.writeFileSync('./uploads/movie.mp4', data); // ❌ Bad!
  // Problems:
  // - Single server failure = data loss
  // - No global distribution
  // - High bandwidth costs
  // - Can't scale horizontally
  // - Users in Asia wait for US server
});
```

#### ✅ **What TO do: Hybrid CDN + S3 approach**

```
┌─────────────────────────────────────────────────────┐
│ FILE STORAGE STRATEGY                               │
├─────────────────────────────────────────────────────┤
│
│ STREAMING REQUEST FLOW:
│
│ User in Tokyo
│   ↓
│ Request movie.mp4
│   ↓
│ Route to nearest CDN edge (Tokyo)
│   ├─ Cache HIT (Last 7 days)? Serve instantly ⚡
│   │
│   └─ Cache MISS? Fetch from origin (AWS S3)
│       ├─ Download from S3
│       ├─ Serve to user
│       ├─ Cache on edge
│       └─ Background: optimize bitrate
│
│ STORAGE ARCHITECTURE:
│
│ AWS S3 Buckets:
│ ├─ netprime-videos-production
│ │  └─ 2026/03/movie-title/
│ │     ├─ 480p.mp4 (adaptive bitrate)
│ │     ├─ 720p.mp4
│ │     ├─ 1080p.mp4
│ │     ├─ 4k.mp4
│ │     ├─ hls_manifest.m3u8 (adaptive streaming)
│ │     ├─ dash_manifest.mpd
│ │     ├─ poster.webp
│ │     ├─ thumbnail.jpg
│ │     └─ subtitles/
│ │        ├─ en.vtt
│ │        ├─ es.vtt
│ │        └─ fr.vtt
│ │
│ ├─ netprime-videos-staging
│ │  └─ For testing uploads
│ │
│ └─ netprime-videos-archive
│    └─ For inactive movies (Glacier)
│
│ CloudFlare/CloudFront CDN:
│ ├─ Global edge servers (200+)
│ ├─ S3 as origin
│ ├─ Cache TTL: 7 days (popular) → 1 hour (less popular)
│ ├─ Compression: GZIP, Brotli
│ ├─ DDoS protection built-in
│ └─ Cost: ~$0.08 per GB transferred
│
└─────────────────────────────────────────────────────┘
```

#### **Why This Approach?**

| Aspect | Local Storage | S3 Only | S3 + CDN ✅ |
|--------|---|---|---|
| Global latency | High ❌ | Medium ⚠️ | Low ✅ |
| Cost | Medium | Medium | Low ✅ |
| Availability | Poor | Good ⚠️ | Excellent ✅ |
| Scalability | None | Good | Excellent ✅ |
| Redundancy | None | Multiple regions | Best ✅ |

---

### 2. **Handling Heavy Load**

#### **Load Distribution Strategy**

```javascript
// Example: Load Balancer Configuration (Nginx)
upstream api_servers {
    least_conn;  // Route to least busy server
    
    server api1.internal:3000 weight=100;
    server api2.internal:3000 weight=100;
    server api3.internal:3000 weight=100;
    // Auto-scale to 100+ during peak
}

server {
    listen 443 ssl;
    server_name api.netprime.com;
    
    location /api/ {
        # Buffering for slow clients
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Keep-alive connections
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # Connection pooling
        upstream_keepalive 32;
        
        proxy_pass http://api_servers;
    }
}
```

#### **Database Load Reduction**

```javascript
// Example: Read Replica Distribution
const mongoClient = require('mongodb').MongoClient;

const mongoConfig = {
  // Primary - for writes
  primary: 'mongodb://primary.internal:27017',
  
  // Replica set - for reads (load distributed)
  readReplicas: [
    'mongodb://secondary1.internal:27017',
    'mongodb://secondary2.internal:27017',
    'mongodb://secondary3.internal:27017',
  ],
  
  // Read preference strategy
  readPreference: 'secondaryPreferred', // Use secondary if available
};

// 80% of traffic goes to replicas, 20% to primary
const readConnection = mongoClient.connect(
  mongoConfig.readReplicas[randomIndex],
  { retryWrites: false }
);
```

#### **Cache Layer Strategy**

```javascript
// Example: Multi-level Caching
const redis = require('redis').createClient({
  host: 'redis-cluster.internal',
  port: 6379,
  retryStrategy: (options) => {
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

// Caching strategy
async function getMovieWithCache(movieId) {
  // L1: Redis cache (5-minute TTL)
  const cached = await redis.get(`movie:${movieId}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // L2: Application memory cache (1-minute TTL)
  if (movieCache.has(movieId)) {
    return movieCache.get(movieId);
  }
  
  // L3: Database query
  const movie = await Movie.findById(movieId)
    .select('title description rating poster') // Only needed fields
    .lean(); // Don't create Mongoose document
  
  // Populate all caches
  await redis.setex(
    `movie:${movieId}`,
    300, // 5 minutes
    JSON.stringify(movie)
  );
  
  movieCache.set(movieId, movie);
  
  return movie;
}
```

#### **Request Queuing During Spikes**

```javascript
// Use Bull/BullMQ for queue management
const Queue = require('bull');
const apiQueue = new Queue('api-requests', {
  redis: { host: 'redis-cluster.internal', port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Process requests with concurrency limit
apiQueue.process(10, async (job) => {
  // Process max 10 requests in parallel
  return await handleApiRequest(job.data);
});

// Add to queue on spike
app.get('/api/movies', async (req, res) => {
  const job = await apiQueue.add(
    { endpoint: '/movies', params: req.query },
    { priority: getRequestPriority(req) }
  );
  
  return res.status(202).json({ jobId: job.id });
});
```

---

### 3. **Rate Limiting Strategy (Redis)**

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const client = redis.createClient({
  host: 'redis-cluster.internal',
  port: 6379,
});

// Strategy 1: Per-user rate limit
const userLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'rl:user:', // rate limit: user
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this user',
  statusCode: 429,
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Strategy 2: Per-IP rate limit
const ipLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'rl:ip:',
  }),
  windowMs: 60 * 1000,
  max: 1000, // 1000 requests per minute
  skip: (req) => isWhitelisted(req.ip),
});

// Strategy 3: Per-endpoint rate limit
const loginLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'rl:login:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts
  message: 'Too many login attempts',
});

// Strategy 4: Sliding window with burst allowance
const advancedLimiter = (req, res, next) => {
  const key = `rate:${req.user?.id}`;
  const limit = 100;
  const window = 60; // 1 minute
  const burst = 20; // Allow 20 burst requests
  
  client.get(key, (err, current) => {
    const count = parseInt(current) || 0;
    
    if (count > limit) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    client.multi()
      .incr(key)
      .expire(key, window)
      .exec();
    
    res.set('X-RateLimit-Limit', limit);
    res.set('X-RateLimit-Remaining', Math.max(0, limit - count - 1));
    
    next();
  });
};

// Apply limiters to routes
app.post('/api/auth/login', loginLimiter, authController.login);
app.use('/api/', userLimiter);
app.use('/', ipLimiter);
```

---

## Part 2: MongoDB Optimization for Scale

### **Sharding Strategy**

```javascript
// Sharding Configuration
const shardKey = 'userId'; // Shard by user

const mongoURL = 'mongodb+srv://user:pass@cluster.mongodb.net/netprime?retryWrites=true&w=majority';

// Connection with sharding options
const mongoose = require('mongoose');
await mongoose.connect(mongoURL, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  useShardVersion: true,
  readPreference: 'secondaryPreferred',
  w: 'majority', // Write concern: wait for majority
  j: true, // Journal writes
});

// Define collections with shard keys
const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  userId: { type: String, required: true, index: true }, // Shard key
  email: { type: String, unique: true, index: true },
  subscriptionTier: { type: String, index: true },
  createdAt: { type: Date, index: true },
});

const watchHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, // Shard key
  movieId: { type: String, index: true },
  watchedAt: { type: Date, index: true, expires: 31536000 }, // TTL: 1 year
  progress: { duration: Number, position: Number },
  // Compound index for efficient queries
  index: { userId: 1, movieId: 1 },
  index: { userId: 1, watchedAt: -1 }, // For sorting watch history
});

const movieSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: { type: String, required: true },
  description: String,
  genre: { type: String, index: true },
  releaseYear: { type: Number, index: true },
  rating: { type: Number, index: true },
  viewCount: { type: Number, default: 0, index: true },
  // Text index for full-text search
  index: { title: 'text', description: 'text' },
  // Compound index for filtering
  index: { genre: 1, releaseYear: 1, rating: -1 },
});

// Indexes on watch_history
watchHistorySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 31536000 } // Auto-delete after 1 year
);
```

### **Query Optimization**

```javascript
// BAD: N+1 Query Problem
async function getMoviesWithReviewsBad(genreId) {
  const movies = await Movie.find({ genre: genreId }); // Query 1
  
  for (let movie of movies) {
    movie.reviews = await Review.find({ movieId: movie._id }); // Query N
  }
  
  return movies; // N+1 queries!
}

// GOOD: Single query with aggregation
async function getMoviesWithReviewsGood(genreId) {
  const movies = await Movie.aggregate([
    { $match: { genre: genreId } },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'movieId',
        as: 'reviews',
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        genre: 1,
        reviews: { $slice: ['$reviews', 10] }, // Limit reviews
      },
    },
    { $limit: 20 }, // Limit movies
  ]);
  
  return movies; // 1 query!
}

// GOOD: Select only needed fields (Lean queries)
async function getMoviesFast(genreId) {
  return await Movie.find({ genre: genreId })
    .select('title poster rating genre') // Only needed fields
    .lean() // Don't create Mongoose documents
    .limit(20)
    .exec();
}

// GOOD: Use batch operations
async function updateMultipleMovies(movieIds, updateData) {
  return await Movie.bulkWrite(
    movieIds.map(id => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: updateData },
      },
    }))
  );
}
```

---

## Part 3: CommonJS Best Practices

### **Consistent CommonJS Module Structure**

```javascript
// ✅ CORRECT: CommonJS everywhere

// models/Movie.js
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: String,
  genre: String,
});

module.exports = mongoose.model('Movie', movieSchema);

// services/movieService.js
const Movie = require('../models/Movie');
const logger = require('./logger');

class MovieService {
  async getMovieById(id) {
    try {
      const movie = await Movie.findById(id).lean();
      if (!movie) {
        throw new Error('Movie not found');
      }
      return movie;
    } catch (error) {
      logger.error('Error fetching movie:', error);
      throw error;
    }
  }
}

module.exports = new MovieService();

// routes/movieRoutes.js
const express = require('express');
const router = express.Router();
const movieService = require('../services/movieService');
const auth = require('../middleware/auth');

router.get('/:id', auth, async (req, res, next) => {
  try {
    const movie = await movieService.getMovieById(req.params.id);
    res.json(movie);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

// server.js (Main entry point)
const express = require('express');
const mongoose = require('mongoose');
const movieRoutes = require('./routes/movieRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use('/api/movies', movieRoutes);
app.use(errorHandler);

mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(3000, () => console.log('Server running on port 3000'));
});

module.exports = app;
```

### **Avoid ES6 Modules (import/export)**

```javascript
// ❌ DON'T: Use ES6 modules (inconsistent with Node.js CommonJS standard)
import Movie from './models/Movie.js';
import movieService from './services/movieService.js';
export default router;

// ✅ DO: Use CommonJS exclusively
const Movie = require('./models/Movie');
const movieService = require('./services/movieService');
module.exports = router;
```

---

## Part 4: Implementation Checklist

### **Phase 1: Foundation (Week 1-2)**
- [ ] Set up Express.js server with CommonJS
- [ ] Configure MongoDB with replica set
- [ ] Set up Redis cluster
- [ ] Implement basic authentication (JWT)
- [ ] Set up error handling middleware
- [ ] Configure logging (Winston)

### **Phase 2: Core Services (Week 3-4)**
- [ ] Movie service (CRUD + search)
- [ ] User service (profile, preferences)
- [ ] Streaming service (playback, progress tracking)
- [ ] Upload service (file validation, queue)
- [ ] Rate limiting middleware

### **Phase 3: Advanced Features (Week 5-6)**
- [ ] Message queue (RabbitMQ)
- [ ] Worker pool (BullMQ for async jobs)
- [ ] Notification service (email, push)
- [ ] Analytics tracking
- [ ] Search indexing (Elasticsearch)

### **Phase 4: Operations (Week 7-8)**
- [ ] Monitoring & logging (ELK)
- [ ] Metrics collection (Prometheus)
- [ ] Distributed tracing (Jaeger)
- [ ] Alerting & on-call setup
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Kubernetes deployment

### **Phase 5: Optimization (Week 9+)**
- [ ] Performance testing & optimization
- [ ] Load testing (k6, Apache JMeter)
- [ ] Security audit & penetration testing
- [ ] Cost optimization
- [ ] Disaster recovery drills

---

## Summary: Key Architecture Decisions

| Decision | What | Why |
|----------|------|-----|
| **Movie Storage** | S3 + CDN | Low latency, global, scalable, cost-effective |
| **Cache** | Redis Cluster | Fast, scalable, supports pub/sub |
| **Database** | MongoDB Sharded | Flexible schema, horizontal scaling |
| **Message Queue** | RabbitMQ | Reliable, advanced routing, DLQ |
| **Rate Limiting** | Redis Token Bucket | Distributed, accurate, no race conditions |
| **Framework** | Express.js | Lightweight, mature, extensive ecosystem |
| **Module System** | CommonJS | Node.js standard, consistent, no transpilation |
| **Deployment** | Kubernetes | Auto-scaling, HA, industry standard |
| **Monitoring** | ELK + Prometheus | Open-source, comprehensive, cost-effective |

---

This architecture will scale from 1K to millions of concurrent users while maintaining sub-second response times and 99.99% uptime. 🚀
