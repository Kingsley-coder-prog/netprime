# NetPrime Backend - Detailed Implementation Checklist

## 🎯 Your Architecture Questions Answered

### Q1: Where to store movie files?
**Answer:** AWS S3 + CloudFlare/CloudFront CDN
- Primary storage: AWS S3 (origin)
- Distributed delivery: Global CDN (200+ edge servers)
- Streaming formats: HLS (primary) + DASH (alternative)
- Cost: ~$0.008 per GB transferred (with CDN optimization)
- **Why:** Users in Tokyo get Tokyo edge server (50ms), not US server (300ms+)

### Q2: How to handle heavy load?
**Answer:** Multi-layer distributed architecture
- Layer 1: Load balancer (Nginx) distributing to 100+ API servers
- Layer 2: Redis cache (80% cache hit rate, bypasses database)
- Layer 3: MongoDB sharding (10+ shards, each handles 1/10th of load)
- Layer 4: Message queue (async processing, no user blocking)
- Layer 5: Auto-scaling (Kubernetes, add/remove servers dynamically)
- **Why:** Each layer can independently scale to 10x capacity

### Q3: How to implement rate limiting?
**Answer:** Redis token bucket algorithm
- Per-user: 100 req/min
- Per-IP: 1000 req/min
- Per-endpoint: Custom limits
- Distributed: Works across multiple API servers
- **Why:** Prevents DDoS, ensures fair resource sharing

---

## 📋 PHASE 1: FOUNDATION SETUP (Weeks 1-2)

### Infrastructure Setup

```javascript
// ✅ DELIVERABLES BY END OF WEEK 1

// 1. Kubernetes Cluster (Using Docker Desktop or Minikube for dev)
//    Production: AWS EKS, GCP GKE, or DigitalOcean K8s
kubectl cluster-info
// Result: Cluster ready for deploying services

// 2. MongoDB Replica Set
//    Dev: Local 3-node replica set
//    Prod: MongoDB Atlas or self-hosted on K8s
const mongoose = require('mongoose');
mongoose.connect('mongodb://mongo1:27017,mongo2:27017,mongo3:27017/netprime?replicaSet=rs0', {
  w: 'majority',  // Write concern: majority
  j: true,        // Journal writes
  retryWrites: true,
});
// Result: 3-node replica set running

// 3. Redis Cluster
//    Dev: Single Redis instance
//    Prod: 3+ node cluster with Sentinel
const redis = require('redis');
const client = redis.createClient({
  host: 'redis-cluster.internal',
  port: 6379,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});
// Result: Redis cluster ready

// 4. RabbitMQ Setup
//    Dev: Single RabbitMQ container
//    Prod: HA cluster with Quorum queues
const amqp = require('amqplib');
const connection = await amqp.connect('amqp://rabbitmq-cluster:5672');
// Result: Message broker ready
```

### Base Express Server

```javascript
// ✅ server.js (Your foundation)

const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const winston = require('winston');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// MIDDLEWARE SETUP
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// LOGGING
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// DATABASE CONNECTIONS
(async () => {
  // MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
      w: 'majority',
      j: true,
      retryWrites: true,
    });
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }

  // Redis
  const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retry_strategy: (options) => {
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error('Redis retry time exhausted');
      }
      return Math.min(options.attempt * 100, 3000);
    },
  });

  redisClient.on('error', (err) => logger.error('Redis error:', err));
  redisClient.on('connect', () => logger.info('Redis connected'));

  // RATE LIMITING MIDDLEWARE
  const limiter = rateLimit({
    store: new (require('rate-limit-redis'))({
      client: redisClient,
      prefix: 'rl:',
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  });

  app.use('/api/', limiter);

  // HEALTH CHECK ENDPOINT
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient.connected ? 'connected' : 'disconnected',
    });
  });

  // ERROR HANDLING MIDDLEWARE
  app.use((err, req, res, next) => {
    logger.error('Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    res.status(err.status || 500).json({
      error: {
        message: err.message,
        status: err.status || 500,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // ROUTES (Will add in Phase 2)
  // app.use('/api/auth', require('./routes/authRoutes'));
  // app.use('/api/movies', require('./routes/movieRoutes'));
  // app.use('/api/users', require('./routes/userRoutes'));

  // START SERVER
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
})();

module.exports = app;
```

### Environment Configuration

```bash
# ✅ .env.example

# SERVER
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# DATABASE
MONGODB_URI=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/netprime?replicaSet=rs0

# CACHE
REDIS_HOST=redis-cluster.internal
REDIS_PORT=6379

# MESSAGE QUEUE
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET=netprime-videos

# CDN
CDN_URL=https://cdn.netprime.com

# JWT
JWT_SECRET=your_super_secret_key_min_32_characters
JWT_EXPIRY=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,https://netprime.com

# RATE LIMITING
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📋 PHASE 2: CORE SERVICES (Weeks 3-4)

### Service 1: Authentication Service

```javascript
// ✅ routes/authRoutes.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { asyncHandler, ValidationError } = require('../utils/errors');

// REGISTER
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  // Validation
  if (!email || !password || !username) {
    throw new ValidationError('Missing required fields');
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ValidationError('Email already registered');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = new User({
    email,
    username,
    password: hashedPassword,
    createdAt: new Date(),
  });

  await user.save();

  // Generate JWT
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY }
  );

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
    },
  });
}));

// LOGIN
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password required');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ValidationError('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ValidationError('Invalid credentials');
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
    },
  });
}));

module.exports = router;

// ✅ middleware/auth.js

const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
};

module.exports = authMiddleware;
```

### Service 2: Movie Service

```javascript
// ✅ models/Movie.js

const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    description: String,
    genre: {
      type: String,
      index: true,
    },
    releaseYear: {
      type: Number,
      index: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      index: true,
    },
    duration: Number, // in seconds
    viewCount: {
      type: Number,
      default: 0,
      index: true,
    },
    posterUrl: String,
    thumbnailUrl: String,
    s3Path: String,
    hlsManifestPath: String,
    dashManifestPath: String,
    uploadedBy: mongoose.Schema.Types.ObjectId,
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'],
      default: 'uploading',
    },
    subtitles: [
      {
        language: String,
        s3Path: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for performance
movieSchema.index({ title: 'text', description: 'text' }); // Full-text search
movieSchema.index({ genre: 1, releaseYear: 1, rating: -1 }); // Compound index

module.exports = mongoose.model('Movie', movieSchema);

// ✅ services/movieService.js

const Movie = require('../models/Movie');
const redis = require('redis');
const logger = require('./logger');

const redisClient = redis.createClient();

class MovieService {
  async getMovieById(movieId) {
    // Check cache first
    const cachedMovie = await redisClient.get(`movie:${movieId}`);
    if (cachedMovie) {
      logger.debug(`Cache hit for movie ${movieId}`);
      return JSON.parse(cachedMovie);
    }

    // Query database
    const movie = await Movie.findById(movieId).lean();
    if (!movie) {
      throw new Error('Movie not found');
    }

    // Cache for 1 hour
    await redisClient.setex(
      `movie:${movieId}`,
      3600,
      JSON.stringify(movie)
    );

    return movie;
  }

  async getMoviesByGenre(genre, page = 1, limit = 20) {
    const cacheKey = `movies:genre:${genre}:page:${page}`;
    const cachedResults = await redisClient.get(cacheKey);

    if (cachedResults) {
      logger.debug(`Cache hit for genre ${genre} page ${page}`);
      return JSON.parse(cachedResults);
    }

    const skip = (page - 1) * limit;
    const [movies, total] = await Promise.all([
      Movie.find({ genre, status: 'ready' })
        .select('title posterUrl rating genre')
        .skip(skip)
        .limit(limit)
        .lean(),
      Movie.countDocuments({ genre, status: 'ready' }),
    ]);

    const results = {
      movies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache for 1 hour
    await redisClient.setex(
      cacheKey,
      3600,
      JSON.stringify(results)
    );

    return results;
  }

  async searchMovies(query, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const movies = await Movie.find(
      { $text: { $search: query }, status: 'ready' },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Movie.countDocuments({
      $text: { $search: query },
      status: 'ready',
    });

    return {
      movies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async createMovie(movieData) {
    const movie = new Movie(movieData);
    await movie.save();
    return movie;
  }

  async updateMovieStatus(movieId, status) {
    const movie = await Movie.findByIdAndUpdate(
      movieId,
      { status },
      { new: true }
    );

    // Invalidate cache
    await redisClient.del(`movie:${movieId}`);

    return movie;
  }

  async incrementViewCount(movieId) {
    // Update database
    await Movie.findByIdAndUpdate(
      movieId,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    // Invalidate cache
    await redisClient.del(`movie:${movieId}`);
  }
}

module.exports = new MovieService();

// ✅ routes/movieRoutes.js

const express = require('express');
const router = express.Router();
const movieService = require('../services/movieService');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/errors');

// GET movie by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const movie = await movieService.getMovieById(req.params.id);
  res.json(movie);
}));

// GET movies by genre
router.get('/genre/:genre', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await movieService.getMoviesByGenre(
    req.params.genre,
    parseInt(page),
    parseInt(limit)
  );
  res.json(result);
}));

// SEARCH movies
router.get('/search/query/:query', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await movieService.searchMovies(
    req.params.query,
    parseInt(page),
    parseInt(limit)
  );
  res.json(result);
}));

// CREATE movie (authenticated)
router.post('/', auth, asyncHandler(async (req, res) => {
  const movie = await movieService.createMovie({
    ...req.body,
    uploadedBy: req.user.userId,
  });
  res.status(201).json(movie);
}));

// GET stream URL
router.get('/:id/stream', auth, asyncHandler(async (req, res) => {
  const movie = await movieService.getMovieById(req.params.id);

  // Increment view count (async, don't wait)
  movieService.incrementViewCount(req.params.id).catch(err => {
    logger.error('Failed to increment view count:', err);
  });

  res.json({
    hlsUrl: `${process.env.CDN_URL}${movie.hlsManifestPath}`,
    dashUrl: `${process.env.CDN_URL}${movie.dashManifestPath}`,
    subtitles: movie.subtitles.map(sub => ({
      language: sub.language,
      url: `${process.env.CDN_URL}${sub.s3Path}`,
    })),
  });
}));

module.exports = router;
```

---

## 📋 PHASE 3: MESSAGE QUEUE & WORKERS (Weeks 5-6)

### Video Processing Queue

```javascript
// ✅ config/queue.js

const Queue = require('bull');
const redis = require('redis');

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
};

// Create queues
const videoQueue = new Queue('video-processing', redisConfig);
const thumbnailQueue = new Queue('thumbnail-generation', redisConfig);
const notificationQueue = new Queue('notifications', redisConfig);

// Log events
videoQueue.on('active', (job) => {
  console.log(`Job ${job.id} is active`);
});

videoQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

videoQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

// Export queues
module.exports = {
  videoQueue,
  thumbnailQueue,
  notificationQueue,
};

// ✅ workers/videoWorker.js

const { videoQueue } = require('../config/queue');
const ffmpeg = require('fluent-ffmpeg');
const aws = require('aws-sdk');
const Movie = require('../models/Movie');
const logger = require('../services/logger');

const s3 = new aws.S3();

// Process video transcoding jobs
videoQueue.process('transcode', 5, async (job) => {
  const { movieId, s3InputPath } = job.data;

  try {
    logger.info(`Starting transcoding for movie ${movieId}`);
    
    // Update progress
    job.progress(10);

    // Download from S3
    const inputFile = `/tmp/${movieId}-input.mp4`;
    await downloadFromS3(s3InputPath, inputFile);

    job.progress(20);

    // Transcode to multiple formats
    const formats = ['480p', '720p', '1080p', '4k'];
    const outputPaths = [];

    for (const format of formats) {
      await transcodeVideo(inputFile, format, movieId);
      job.progress(20 + (formats.indexOf(format) * 15));
      
      outputPaths.push({
        format,
        s3Path: `s3://netprime-videos/movies/${movieId}/${format}.mp4`,
      });
    }

    job.progress(80);

    // Generate HLS manifest
    await generateHLSManifest(movieId);

    job.progress(90);

    // Update movie status
    await Movie.findByIdAndUpdate(movieId, {
      status: 'ready',
      hlsManifestPath: `/movies/${movieId}/hls/master.m3u8`,
      dashManifestPath: `/movies/${movieId}/dash/manifest.mpd`,
    });

    job.progress(100);

    logger.info(`Transcoding completed for movie ${movieId}`);
    
    return { movieId, outputPaths };
  } catch (error) {
    logger.error(`Transcoding failed for movie ${movieId}:`, error);
    throw error;
  }
});

async function downloadFromS3(s3Path, localPath) {
  // Implementation
}

async function transcodeVideo(inputFile, format, movieId) {
  // Implementation using FFmpeg
}

async function generateHLSManifest(movieId) {
  // Implementation
}

module.exports = videoQueue;
```

---

## 📋 PHASE 4: MONITORING & OPERATIONS (Weeks 7-8)

### Logging Setup

```javascript
// ✅ services/logger.js

const winston = require('winston');
const elasticsearch = require('winston-elasticsearch');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'netprime-api' },
  transports: [
    // File transport
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),

    // Elasticsearch transport (for ELK stack)
    new elasticsearch.ElasticsearchTransport({
      level: 'info',
      clientOpts: { node: process.env.ELASTICSEARCH_URL },
      index: 'netprime-logs',
    }),

    // Console transport (for development)
    ...(process.env.NODE_ENV !== 'production'
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
          }),
        ]
      : []),
  ],
});

module.exports = logger;

// ✅ middleware/requestLogging.js

const logger = require('../services/logger');

const requestLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      userId: req.user?.userId || 'anonymous',
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};

module.exports = requestLoggingMiddleware;
```

### Health Checks & Metrics

```javascript
// ✅ middleware/healthCheck.js

const mongoose = require('mongoose');
const redis = require('redis');

const healthCheckMiddleware = async (req, res, next) => {
  res.set('X-Uptime', process.uptime());
  res.set('X-Timestamp', new Date().toISOString());

  // Only check health for specific endpoints
  if (req.path === '/health' || req.path === '/ready') {
    const health = {
      status: 'ok',
      uptime: process.uptime(),
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redis.connected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };

    if (req.path === '/health') {
      // Liveness probe - quick check
      return res.json(health);
    }

    if (req.path === '/ready') {
      // Readiness probe - detailed checks
      const isReady = health.mongodb === 'connected' && health.redis === 'connected';
      return res.status(isReady ? 200 : 503).json(health);
    }
  }

  next();
};

module.exports = healthCheckMiddleware;
```

---

## 📋 PHASE 5: LOAD TESTING & OPTIMIZATION

### Load Testing Script

```javascript
// ✅ tests/loadTest.js (using k6)

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 1000 },
    { duration: '5m', target: 5000 },
    { duration: '5m', target: 1000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function () {
  // Simulate user behavior
  const movieId = Math.floor(Math.random() * 10000);

  // 1. Get movie
  let res = http.get(`http://api.netprime.local/api/movies/${movieId}`);
  check(res, { 'movie loaded': (r) => r.status === 200 });
  sleep(2);

  // 2. Get stream URL
  const token = 'your_test_token'; // Obtained from login
  res = http.get(`http://api.netprime.local/api/movies/${movieId}/stream`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(res, { 'stream url obtained': (r) => r.status === 200 });
  sleep(1);

  // 3. Search movies
  res = http.get('http://api.netprime.local/api/movies/search/query/action');
  check(res, { 'search works': (r) => r.status === 200 });
  sleep(1);
}
```

---

## ✅ FINAL CHECKLIST

### By End of Week 1-2:
- [ ] Kubernetes cluster running (local or cloud)
- [ ] MongoDB replica set (3 nodes)
- [ ] Redis cluster (dev: single instance, prod: 3+ nodes)
- [ ] RabbitMQ broker running
- [ ] Express.js base server with logging
- [ ] Authentication middleware
- [ ] Rate limiting middleware
- [ ] Health check endpoints
- [ ] Error handling setup
- [ ] Database models defined

### By End of Week 3-4:
- [ ] Authentication service (register, login)
- [ ] Movie service (CRUD, search)
- [ ] Movie database schema with indexes
- [ ] Caching layer integration
- [ ] User service (profile, preferences)
- [ ] Streaming service (get stream URL)
- [ ] Rate limiting in place
- [ ] Logging to ELK/Elasticsearch
- [ ] API routes tested and working

### By End of Week 5-6:
- [ ] RabbitMQ queues created
- [ ] Bull/BullMQ worker setup
- [ ] Video transcoding worker
- [ ] Thumbnail generation worker
- [ ] Notification worker
- [ ] Queue monitoring dashboard
- [ ] Retry logic and dead letter queue
- [ ] Job status tracking
- [ ] Error notifications

### By End of Week 7-8:
- [ ] Prometheus metrics collection
- [ ] Grafana dashboards
- [ ] ELK stack logging
- [ ] Jaeger distributed tracing
- [ ] PagerDuty alerting
- [ ] Automated backups
- [ ] Disaster recovery plan
- [ ] Security audit completed
- [ ] Load testing passed (10K+ concurrent)
- [ ] Kubernetes deployment manifests
- [ ] CI/CD pipeline

---

**Ready to build? Let's start with Phase 1! 🚀**
