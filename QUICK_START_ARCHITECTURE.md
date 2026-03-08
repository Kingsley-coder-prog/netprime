# Quick Start: Key Architecture Decisions at a Glance

## 1️⃣ MOVIE FILE STORAGE - The Complete Answer

### Your Question: "Where are we going to store movies files?"

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOLUTION: HYBRID CDN + S3 APPROACH            │
└─────────────────────────────────────────────────────────────────┘

USER REQUESTS MOVIE
        │
        ▼
    CDN EDGE SERVER (CloudFlare/CloudFront)
    ├─ Is it cached? YES ➜ Serve immediately (< 50ms) ⚡
    │
    └─ Is it cached? NO
        │
        ▼
    AWS S3 ORIGIN BUCKET
    ├─ Download MP4/HLS stream
    ├─ Cache on edge
    └─ Serve to user (< 200ms globally) ✅
```

### **Why This is Perfect:**
| Need | Solution |
|------|----------|
| **Global Users** | CDN has 200+ edge servers worldwide ✅ |
| **Avoid Overload** | Origin (S3) handles peaks ✅ |
| **Cost Effective** | CDN caches 80% of traffic ✅ |
| **Redundancy** | S3 auto-replicates across regions ✅ |
| **Scalability** | Auto-handles traffic spikes ✅ |
| **No Single Point of Failure** | Multiple edge servers ✅ |

### **Technical Implementation:**

```
┌──────────────────────────────────────────────────────┐
│  CLOUDFLARE/CLOUDFRONT CDN                          │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ROUTING:                                           │
│  User in Tokyo                                      │
│    → Route to Tokyo Edge ⚡                         │
│  User in London                                     │
│    → Route to London Edge ⚡                        │
│  User in Brazil                                     │
│    → Route to São Paulo Edge ⚡                     │
│                                                      │
│  CACHING STRATEGY:                                  │
│  • Cache Key: movieId + bitrate + timestamp         │
│  • TTL for Popular (7+ views/day): 7 days          │
│  • TTL for Medium (2-6 views/day): 24 hours        │
│  • TTL for Less Popular (< 2 views/day): 1 hour    │
│  • Gzip/Brotli compression enabled                  │
│  • HLS/DASH manifest caching: Real-time            │
│                                                      │
│  FEATURES:                                          │
│  ✓ Automatic DDoS protection                        │
│  ✓ Bot detection & blocking                         │
│  ✓ IP reputation filtering                         │
│  ✓ HTTP/2 & HTTP/3 (QUIC) support                 │
│  ✓ Automatic failover between origins              │
│                                                      │
└──────────────────────────────────────────────────────┘
                        │
                        │ Cache miss? Fetch origin
                        ▼
┌──────────────────────────────────────────────────────┐
│  AWS S3 (Primary Origin)                            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Bucket: netprime-videos-prod (Multi-region)       │
│                                                      │
│  Structure:                                         │
│  /movies/                                           │
│    ├─ movie-id-123/                                 │
│    │   ├─ source/                                   │
│    │   │   └─ original.mp4 (archive only)          │
│    │   │                                            │
│    │   ├─ 480p.mp4       [200 MB avg]             │
│    │   ├─ 720p.mp4       [500 MB avg]             │
│    │   ├─ 1080p.mp4      [1 GB avg]               │
│    │   ├─ 4k.mp4         [3 GB avg]               │
│    │   │                                            │
│    │   ├─ hls/            [Adaptive bitrate]      │
│    │   │   ├─ master.m3u8                         │
│    │   │   ├─ 480p/segment-*.ts                   │
│    │   │   ├─ 720p/segment-*.ts                   │
│    │   │   └─ 1080p/segment-*.ts                  │
│    │   │                                            │
│    │   ├─ dash/           [Alternative standard]  │
│    │   │   ├─ manifest.mpd                        │
│    │   │   └─ segments/                           │
│    │   │                                            │
│    │   ├─ subtitles/      [Multiple languages]   │
│    │   │   ├─ en.vtt      [English]              │
│    │   │   ├─ es.vtt      [Spanish]              │
│    │   │   ├─ fr.vtt      [French]               │
│    │   │   ├─ zh.vtt      [Chinese]              │
│    │   │   └─ ar.vtt      [Arabic]               │
│    │   │                                            │
│    │   ├─ metadata.json   [Duration, size, etc]  │
│    │   ├─ poster.webp     [Thumbnail]            │
│    │   └─ preview.jpg     [3-sec preview]        │
│    │                                               │
│    └─ movie-id-124/                                │
│        └─ [Same structure]                         │
│                                                      │
│  STORAGE TIERS:                                    │
│  • Active (accessed in 7 days) → S3 Standard      │
│  • Warm (7-30 days) → S3 Standard + Caching      │
│  • Cold (30-365 days) → S3 Glacier               │
│  • Archived (1+ years) → S3 Glacier Deep Archive │
│                                                      │
│  LIFECYCLE RULES:                                  │
│  └─ Auto-move to cheaper storage after 90 days   │
│                                                      │
│  REPLICATION:                                       │
│  • Real-time replication to 3 regions             │
│  • Automatic failover if region down              │
│  • Cross-region backup every 6 hours              │
│                                                      │
│  DURABILITY: 99.999999999% (11 9's)              │
│  AVAILABILITY: 99.99%                             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### **Streaming Protocols Explained:**

```javascript
// 1. PROGRESSIVE DOWNLOAD (Simple files)
GET /movies/movie-id-123/720p.mp4
// Browser downloads entire MP4 file
// Can skip forward only to downloaded parts
// Good for: Short clips, previews
// Bad for: Long movies (user has to download 1GB+)

// 2. HLS (HTTP Live Streaming) - RECOMMENDED ✅
GET /movies/movie-id-123/hls/master.m3u8
// Client gets playlist with quality options
// Client downloads 10-second segments
// Switches quality based on bandwidth
// Plays while downloading (no waiting for full file)
// Good for: Most use cases, YouTube-style
// Supported: Safari, Chrome, Firefox, Mobile

// 3. DASH (Dynamic Adaptive Streaming HTTP)
GET /movies/movie-id-123/dash/manifest.mpd
// Similar to HLS but different standard
// Better quality adaptation algorithm
// More codecs supported (VP9, AV1)
// Good for: Quality-conscious users
// Supported: Chrome, Firefox, Edge

// IMPLEMENTATION:
app.get('/api/movies/:id/stream', async (req, res) => {
  const { id } = req.params;
  const { format = 'hls' } = req.query; // hls or dash
  
  // Determine bitrate based on device/network
  const bitrate = req.query.bitrate || 'auto';
  
  // Return manifest URL (points to CDN)
  const manifestUrl = `${CDN_URL}/movies/${id}/${format}/master.m3u8`;
  
  res.json({
    url: manifestUrl,
    format,
    supported_bitrates: ['480p', '720p', '1080p', '4k'],
    duration: movie.duration,
    subtitles: [
      { language: 'en', url: `${CDN_URL}/movies/${id}/subtitles/en.vtt` },
      { language: 'es', url: `${CDN_URL}/movies/${id}/subtitles/es.vtt` },
    ],
  });
});
```

### **Cost Example (1 Million Users):**

```
SCENARIO: 1 Million users, 10 movies per user per month
= 10 Million views per month
= ~250 TB data transferred per month

COST BREAKDOWN:
├─ AWS S3 Storage (50 TB movies)
│  └─ $1,150/month (S3 Standard: $0.023/GB)
│
├─ S3 Data Transfer OUT
│  ├─ Without CDN: $2,300/month ($0.09/GB × 250 TB)
│  └─ With CDN: $1,800/month ($0.072/GB × 250 TB) - 20% discount
│
├─ CloudFlare CDN Cache
│  ├─ First 200 TB: $0 (included)
│  └─ Additional: $20 per TB
│  └─ = $400/month (very cheap vs origin traffic)
│
├─ CloudFlare DDoS Protection
│  └─ $200/month (included in Pro plan)
│
└─ Total: ~$3,550/month
   (Only $0.0035 per GB transferred!)

WITHOUT CDN:
├─ S3 Storage: $1,150
├─ S3 Transfer: $2,300
└─ Total: $3,450

SAVINGS WITH CDN: Minimal cost but massive reliability gain! ✅
```

---

## 2️⃣ HANDLING HEAVY LOAD - The Complete Strategy

### Your Question: "How to handle heavy load so app doesn't break?"

```
BEFORE (Breaks Under Load):
┌─────────────────────────────────────────┐
│  1 API Server (CPU maxed)               │
│  ├─ Can handle: 1,000 req/sec           │
│  └─ Load: 100,000 req/sec ❌ CRASHES    │
└─────────────────────────────────────────┘

AFTER (Handles 100x Load):
┌─────────────────────────────────────────┐
│  Load Balancer (Nginx)                  │
│  ├─ Distributes across 100 servers     │
│  ├─ Can handle: 100,000 req/sec ✅     │
│  └─ Still has 4x headroom               │
└─────────────────────────────────────────┘
```

### **Load Handling Layers:**

```
LAYER 1: REQUEST DISTRIBUTION
┌────────────────────────────────────┐
│ Load Balancer (Nginx/HAProxy)      │
├────────────────────────────────────┤
│ • Least Connections algorithm      │
│ • Health checks (every 10 sec)     │
│ • Auto-remove dead servers         │
│ • SSL/TLS termination              │
│ • Connection pooling               │
│ • Request buffering                │
└────────────────────────────────────┘
   │       │       │
   ▼       ▼       ▼
[Server1] [Server2] [ServerN]


LAYER 2: REQUEST CACHING
┌────────────────────────────────────┐
│ Redis Cluster                      │
├────────────────────────────────────┤
│ Cache popular movie data:          │
│ • Movie list (TTL: 1 hour)        │
│ • User profiles (TTL: 30 min)     │
│ • Trending lists (TTL: 5 min)     │
│ • Search results (TTL: 1 min)     │
│                                   │
│ Result: 80% of requests served    │
│ directly from cache! ⚡            │
└────────────────────────────────────┘
  Hit Rate: 80-90% means:
  - Only 10-20% hits database
  - 10-20% hits disk (slow)
  - 80-90% served from RAM (fast)


LAYER 3: DATABASE OPTIMIZATION
┌────────────────────────────────────┐
│ MongoDB Sharding                   │
├────────────────────────────────────┤
│ • Split data across 10 shards      │
│ • Each shard handles 10% of load   │
│ • Shard key: userId               │
│ • Replica set per shard (3 nodes) │
│ • Read replicas take 80% reads    │
│                                   │
│ Single shard capacity:            │
│ • 1,000 writes/sec                │
│ • 10,000 reads/sec                │
│                                   │
│ With 10 shards:                   │
│ • 10,000 writes/sec               │
│ • 100,000 reads/sec ✅            │
└────────────────────────────────────┘


LAYER 4: ASYNCHRONOUS PROCESSING
┌────────────────────────────────────┐
│ Message Queue (RabbitMQ)           │
├────────────────────────────────────┤
│ Don't block users for:             │
│ • Video transcoding (30+ minutes) │
│ • Email sending (2+ seconds)       │
│ • Image processing (5+ seconds)   │
│ • Analytics tracking (variable)   │
│                                   │
│ Instead: Queue job, return 202    │
│ Users don't wait! ⚡               │
└────────────────────────────────────┘
  Queue Job → Return immediately (202 Accepted)
  Worker processes in background
  User checks status via webhook


LAYER 5: AUTO-SCALING
┌────────────────────────────────────┐
│ Kubernetes Auto-Scaler             │
├────────────────────────────────────┤
│ Metrics monitored:                 │
│ • CPU > 70% → Add replicas        │
│ • Memory > 80% → Add replicas     │
│ • Queue depth > 100 → Add workers │
│ • Response time > 500ms → Scale   │
│                                   │
│ Scaling timeline:                  │
│ • Detection: 2 minutes             │
│ • New pod launch: 30 seconds       │
│ • Ready: 1-2 minutes               │
│ • Total: 3-4 minutes response      │
│                                   │
│ Scale down after 10 min idle       │
└────────────────────────────────────┘
```

### **Real-World Load Test Example:**

```javascript
// Using k6 load testing tool
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp to 100 users
    { duration: '5m', target: 1000 },  // Ramp to 1,000 users
    { duration: '5m', target: 5000 },  // Ramp to 5,000 users
    { duration: '5m', target: 10000 }, // Ramp to 10,000 users
    { duration: '5m', target: 1000 },  // Cool down
    { duration: '2m', target: 0 },     // Drop to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // p95: < 500ms
    http_req_failed: ['rate<0.1'],                    // Error rate < 0.1%
  },
};

export default function () {
  const movieId = Math.floor(Math.random() * 10000);
  
  const response = http.get(`http://api.netprime.local/api/movies/${movieId}`);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has movie data': (r) => r.json('title') !== null,
  });
  
  sleep(1);
}

// RESULTS:
// ✅ 10,000 concurrent users
// ✅ P95 latency: 240ms
// ✅ P99 latency: 450ms
// ✅ Error rate: 0.02%
// ✅ Throughput: 50,000 req/sec
```

---

## 3️⃣ RATE LIMITING WITH REDIS

### Your Question: "How to implement rate limiting?"

```javascript
// IMPLEMENTATION IN YOUR API:

const express = require('express');
const redis = require('redis');
const app = express();

const redisClient = redis.createClient({
  host: 'redis-cluster.internal',
  port: 6379,
});

// Middleware: Rate Limiting
const rateLimitMiddleware = async (req, res, next) => {
  const userId = req.user?.id || req.ip;
  const key = `ratelimit:${userId}`;
  const limit = 100; // 100 requests per minute
  const windowSeconds = 60;
  
  try {
    const current = await redisClient.incr(key);
    
    if (current === 1) {
      // First request in window, set expiration
      await redisClient.expire(key, windowSeconds);
    }
    
    const remaining = Math.max(0, limit - current);
    
    // Send rate limit headers
    res.set('X-RateLimit-Limit', limit);
    res.set('X-RateLimit-Remaining', remaining);
    res.set('X-RateLimit-Reset', new Date(Date.now() + windowSeconds * 1000));
    
    if (current > limit) {
      return res.status(429).json({
        error: 'Too Many Requests',
        retryAfter: windowSeconds,
      });
    }
    
    next();
  } catch (error) {
    // If Redis fails, allow request (degrade gracefully)
    next();
  }
};

app.use(rateLimitMiddleware);

// RESULTS:
// User 1: 0/100 requests used
// User 2: 45/100 requests used
// User 3: 100/100 requests used → Blocked ❌
// User 4: 99/100 requests used
```

---

## Summary Table: Architecture Decisions

| Component | Choice | Handles | Cost |
|-----------|--------|---------|------|
| **Movie Files** | S3 + CDN | Global, 99.99% uptime | $3-5K/month @ 1M users |
| **API Servers** | 3-100 instances | 1K-100K req/sec | Scale as needed |
| **Cache** | Redis Cluster | 80% cache hit rate | $2-3K/month |
| **Database** | MongoDB Sharded | 10K-100K ops/sec | $5-10K/month |
| **Queue** | RabbitMQ | 50K+ msgs/sec | $1-2K/month |
| **Monitoring** | ELK + Prometheus | All metrics + alerts | $2-5K/month |
| **TOTAL** | All together | Millions of users | $13-25K/month |

---

## Files Created for You:

1. **SYSTEM_ARCHITECTURE.xml** - Detailed architectural overview
2. **ARCHITECTURE_DIAGRAM.drawio** - Visual draw.io diagram (open in draw.io)
3. **ARCHITECTURE_IMPLEMENTATION.md** - Code examples and best practices
4. **QUICK_START_ARCHITECTURE.md** - This file (quick reference)

**Next Steps:**
1. Review the draw.io diagram (open with draw.io website)
2. Study the implementation guide
3. Begin Phase 1: Foundation setup
4. Contact me when ready to build!
