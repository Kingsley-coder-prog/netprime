# NetPrime Architecture - Visual Summary

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Users)                                   │
│  ┌─────────────────┬──────────────────────┬─────────────────────────────────┐  │
│  │  Web (Vue.js)   │  Mobile (React Native)│  Desktop (Electron)            │  │
│  └─────────────────┴──────────────────────┴─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
    ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────────┐
    │   CDN Network   │   │  Load Balancer   │   │  (Movie Streaming)   │
    │  (CloudFlare)   │   │   (Nginx/HAProxy)│   │  Get HLS/DASH Stream │
    │                 │   │                  │   │  From CDN URLs       │
    │ • 200+ Edges    │   │  Distributes to: │   │                      │
    │ • Cached Movies │   │  • 100+ Servers  │   └──────────────────────┘
    │ • Geo-routing   │   │  • Health checks │
    │ • DDoS prot.    │   │  • SSL/TLS       │
    └─────────────────┘   └──────────────────┘
              │                       │
              │                       │
              │           ┌───────────┴──────────────────┐
              │           │                              │
              │           ▼                              ▼
              │     ┌────────────────────────────────────────────────┐
              │     │   API SERVERS (Express.js - Node.js)           │
              │     │   ┌──────┬──────┬──────┬──────┬──────┐         │
              │     │   │Server│Server│Server│Server│....N│         │
              │     │   └──────┴──────┴──────┴──────┴──────┘         │
              │     │                                                 │
              │     │   Microservices:                              │
              │     │   • Auth Service (JWT, OAuth2, MFA)           │
              │     │   • Movie Service (CRUD, Search, Cache)       │
              │     │   • Streaming Service (Playback, Progress)    │
              │     │   • User Service (Profile, Watchlist)         │
              │     │   • Upload Service (Validation, Queue)        │
              │     │   • Notification Service (Email, Push)        │
              │     └────────────────────────────────────────────────┘
              │                       │
              └───────────────────────┼───────────────────────┐
                                      │                       │
                    ┌─────────────────┼─────────────────────┐ │
                    │                 │                     │ │
                    ▼                 ▼                     ▼ ▼
        ┌────────────────────┐  ┌──────────────────┐  ┌──────────────┐
        │  Redis Cluster     │  │  RabbitMQ Queue  │  │  AWS S3      │
        │                    │  │                  │  │              │
        │ • Sessions         │  │  Jobs:          │  │ • Movies     │
        │ • Cache (80% hits) │  │  • Transcode    │  │ • Thumbs     │
        │ • Rate limits      │  │  • Thumbnails   │  │ • Subtitles  │
        │ • Pub/Sub Events   │  │  • Emails       │  │ • Backups    │
        │ • 3+ Nodes (HA)    │  │  • Analytics    │  │              │
        │                    │  │                  │  │ Replication: │
        │ Workers consume:   │  │  Processed by:  │  │ Cross-region │
        │ 50K msgs/sec ✓     │  │  • 5-20 workers │  │ 99.99% avail │
        │                    │  │  • 3-8 workers  │  │              │
        └────────────────────┘  │  • 2-5 workers  │  └──────────────┘
                                │                  │
                                │ 10K+ jobs/sec ✓ │
                                └──────────────────┘
                                      │
                                      ▼
                    ┌──────────────────────────────────┐
                    │  WORKER POOL (BullMQ)            │
                    │  ┌──────────┬──────────────────┐ │
                    │  │Video Work│Media Workers,    │ │
                    │  │ers (FFmpe│Notif Workers,    │ │
                    │  │g)        │Analytics Workers │ │
                    │  └──────────┴──────────────────┘ │
                    │  Transcoding, optimization,      │
                    │  notifications, analytics        │
                    └──────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
        ┌────────────────────┐  ┌──────────────────┐  ┌──────────────┐
        │ MongoDB Sharded    │  │  Elasticsearch   │  │  Third-party │
        │ Cluster            │  │                  │  │  Services    │
        │                    │  │ • Full-text      │  │              │
        │ • 10+ Shards       │  │   search         │  │ • Email APIs │
        │ • 3 Replicas/shard │  │ • Movie index    │  │ • Push notif │
        │ • Shard key: userId│  │ • User search    │  │ • CDN APIs   │
        │                    │  │ • Auto-complete  │  │ • S3 APIs    │
        │ Collections:       │  │ • Fuzzy search   │  │              │
        │ • users            │  └──────────────────┘  └──────────────┘
        │ • movies           │
        │ • subscriptions    │
        │ • watch_history    │
        │ • ratings_reviews  │
        │ • watchlists       │
        │ • sessions         │
        │                    │
        │ Indexes: TTL,      │
        │ compound, text     │
        │ 100K ops/sec ✓     │
        └────────────────────┘
```

---

## Data Flow Examples

### Flow 1: User Watches a Movie

```
User clicks "Play"
    │
    ▼
[API Server] Validates JWT + Rate Limit
    │
    ├─ ✓ Cached? Return HLS manifest from Redis
    │
    └─ ✗ Not cached?
        ├─ Query MongoDB for movie details
        ├─ Cache in Redis (TTL: 1 hour)
        ├─ Return HLS manifest:
        │  {
        │    "type": "HLS",
        │    "url": "https://cdn.netprime.com/movies/123/hls/master.m3u8",
        │    "subtitles": [
        │      { "lang": "en", "url": "..." },
        │      { "lang": "es", "url": "..." }
        │    ]
        │  }
        └─ Browser receives manifest
           
Browser receives manifest
    │
    ├─ Parses master.m3u8
    │  #EXTM3U
    │  #EXT-X-STREAM-INF:BANDWIDTH=1200000
    │  480p.m3u8
    │  #EXT-X-STREAM-INF:BANDWIDTH=2800000
    │  720p.m3u8
    │  #EXT-X-STREAM-INF:BANDWIDTH=5000000
    │  1080p.m3u8
    │
    └─ Selects quality based on bandwidth
        │
        └─ Downloads segments from CDN
           (10-second chunks)
           
            ┌─────────────────────────────┐
            │ CDN EDGE SERVER (Tokyo)     │
            ├─────────────────────────────┤
            │ Cache HIT?                  │
            │ ├─ YES: Serve instantly (50ms)
            │ └─ NO: Fetch from S3, cache it
            └─────────────────────────────┘

Simultaneously (in background):
    │
    └─ [API Server] Tracks watch progress
       ├─ Every 30 sec, update MongoDB
       │  db.watch_history.updateOne(
       │    { userId, movieId },
       │    { $set: { progress: 523 seconds } }
       │  )
       │
       └─ Also track in Redis (faster)
          redis.set('progress:user123:movie456', 523)
          redis.expire(key, 86400) // 24 hours
```

### Flow 2: User Uploads a Movie

```
User selects movie file
    │
    ▼
[API Server] Validates file
    ├─ Check file size (< 10GB)
    ├─ Check format (MP4, MOV, MKV)
    ├─ Check duration
    └─ Check codec compatibility
       │
       ├─ ✓ Valid? Continue
       └─ ✗ Invalid? Return 400 error

Create upload session
    │
    ├─ Generate unique uploadId
    ├─ Store in MongoDB
    ├─ Store in Redis (TTL: 24 hours)
    └─ Return signed S3 URL for upload
       (User uploads directly to S3, not via API)

Client uploads directly to S3
    │
    └─ Multipart upload (chunk by chunk)
       (Avoids overloading API server)

S3 Upload Complete
    │
    ├─ Trigger Lambda/SNS event
    └─ Send message to RabbitMQ
       {
         "type": "video.uploaded",
         "movieId": "123",
         "uploadId": "abc123",
         "s3Path": "s3://netprime/movies/123/uploaded.mp4"
       }

RabbitMQ Routes to Video Processing Queue
    │
    └─ Worker 1 picks up job
       ├─ Download from S3
       ├─ Run FFmpeg (30+ minutes)
       │  ├─ Generate 480p.mp4
       │  ├─ Generate 720p.mp4
       │  ├─ Generate 1080p.mp4
       │  ├─ Generate 4k.mp4
       │  ├─ Generate HLS manifest
       │  ├─ Generate DASH manifest
       │  └─ Extract subtitles
       │
       └─ Upload to S3
          └─ Update MongoDB status: "ready"

Worker 2 picks up job (parallel)
    │
    ├─ Generate thumbnail (2 minutes)
    ├─ Generate preview GIF (1 minute)
    ├─ Generate poster images (1 minute)
    └─ Upload to S3 + CDN purge

Notification Service processes queue
    │
    └─ Send email to uploader
       "Your movie is now streaming! 🎬"

[API Server] Monitors job progress
    │
    ├─ Redis: progress:movieId
    └─ User can see real-time status
       {
         "status": "transcoding",
         "progress": 45,  // 45%
         "eta": "15 minutes"
       }

Movie is Live! 🎉
    │
    └─ CDN caches files
    └─ Users can now watch
```

### Flow 3: Search for Movies (High Load Scenario)

```
User types in search box: "action movies"
    │
    └─ API receives request
       ├─ Check rate limit (user 45/100) ✓
       ├─ Check cache in Redis
       │  key = "search:action movies:page:1"
       │  ├─ ✓ Cache HIT? Return in 5ms ⚡
       │  └─ ✗ Cache MISS? Query database
       │
       └─ Query Elasticsearch
          ├─ Full-text search for "action"
          ├─ Filter by genre "movies"
          ├─ Sort by rating
          ├─ Limit to 20 results
          │
          └─ Results returned in < 100ms ⚡
             {
               "results": [
                 { "id": "123", "title": "Action Movie 1", "rating": 8.5 },
                 { "id": "456", "title": "Action Movie 2", "rating": 8.2 },
                 ...
               ],
               "total": 2459,
               "cached": false
             }

API Server caches result
    │
    └─ redis.setex(
         'search:action movies:page:1',
         300,  // 5 minute TTL
         JSON.stringify(results)
       )

Next user searches same thing
    │
    └─ Cache HIT! Return in 5ms
       (No database query needed)

Scaling with load:
    │
    ├─ 1,000 users → Same search
    ├─ Redis cache hits 999 times ✓
    ├─ Elasticsearch queried only 1 time ✓
    └─ Database completely bypassed! ✓
```

---

## Performance Metrics at Different Scales

### Small Scale (1,000 Concurrent Users)

```
Infrastructure:
├─ 2 API servers
├─ 1 MongoDB node
├─ 1 Redis instance
├─ 5 worker processes

Performance:
├─ Request Latency: p50: 20ms, p95: 80ms, p99: 150ms ✓
├─ Cache Hit Rate: 60%
├─ Database Connections: 100/500 available
├─ API Throughput: 2,000 req/sec
└─ Monthly Cost: $1,000

Status: ✅ No scaling needed yet
```

### Medium Scale (50,000 Concurrent Users)

```
Infrastructure:
├─ 10 API servers
├─ MongoDB sharded (5 shards, 3 replicas each)
├─ Redis cluster (5 nodes)
├─ 20 worker processes
├─ Elasticsearch cluster (3 nodes)

Performance:
├─ Request Latency: p50: 50ms, p95: 250ms, p99: 500ms ✓
├─ Cache Hit Rate: 80%
├─ Database Shards: ~5,000 ops/sec per shard
├─ API Throughput: 50,000 req/sec
└─ Monthly Cost: $5,000

Status: ✅ Scaling smoothly
```

### Large Scale (1,000,000 Concurrent Users)

```
Infrastructure:
├─ 100 API servers (auto-scaled)
├─ MongoDB sharded (10+ shards, 3 replicas each)
├─ Redis cluster (10+ nodes)
├─ 50+ worker processes (scaled based on queue)
├─ Elasticsearch cluster (10+ nodes)
├─ Multi-region deployment (3 regions)

Performance:
├─ Request Latency: p50: 30ms, p95: 150ms, p99: 300ms ✓
├─ Cache Hit Rate: 85%+
├─ Database Throughput: 100,000 ops/sec
├─ API Throughput: 1,000,000 req/sec
├─ Uptime: 99.99% (4.3 minutes/month downtime)
└─ Monthly Cost: $25,000

Status: ✅ Scales to millions
```

---

## Failure Scenarios & Recovery

### Scenario 1: Single API Server Dies

```
BEFORE:
┌─────────────────────────────────┐
│ Load Balancer                   │
├──────────┬──────────┬───────────┤
│ Server 1 │ Server 2 │ Server 3  │
│ DEAD ❌  │ Healthy  │ Healthy   │
└──────────┴──────────┴───────────┘

IMPACT: Minimal ✓
├─ Load Balancer detects dead server (health check fails)
├─ Routes traffic to healthy servers
├─ All requests still served
├─ Users experience: No impact
└─ Time to recover: < 1 minute (auto-restart container)
```

### Scenario 2: Redis Cache Completely Down

```
BEFORE:
└─ Redis Cluster: DOWN ❌

IMPACT: Medium ⚠️
├─ Cache misses all requests (hit rate: 0%)
├─ 80% more database load
├─ Response time increases 2-3x
├─ Users still can watch movies ✓
└─ Time to recover: 5-10 minutes (restart service)

APPLICATION GRACEFULLY DEGRADES:
├─ No cache? Query database directly
├─ Slower, but still works
└─ Once Redis comes back, performance restored
```

### Scenario 3: MongoDB Primary Node Dies

```
BEFORE:
┌─────────────────────────────┐
│ MongoDB Replica Set         │
├──────────┬──────────────────┤
│ PRIMARY  │ SECONDARY        │
│ DEAD ❌  │ Automatically    │
│          │ promoted to      │
│          │ PRIMARY ✓        │
└──────────┴──────────────────┘

IMPACT: None ✓ (Automatic failover)
├─ Election happens within 5 seconds
├─ New primary elected automatically
├─ Connections rerouted seamlessly
├─ Users experience: No downtime
├─ Write concern: Majority (lost data: 0)
└─ Time to recover: 5-10 seconds
```

### Scenario 4: Entire Data Center Down

```
BEFORE: Single data center in US-EAST

AFTER: Multi-region deployment

┌──────────────────────────────────────────────────────┐
│ Disaster Recovery Setup                              │
├─────────────────┬──────────────────┬────────────────┤
│ US-EAST Primary │ EU-WEST Standby  │ APAC Standby   │
│ • All writes    │ • Read replicas  │ • Read replica │
│ • Backup data   │ • CDN cache      │ • CDN cache    │
│ • DOWN ❌       │ • Can serve      │ • Can serve    │
└─────────────────┴──────────────────┴────────────────┘

IMPACT: Degraded but recoverable ⚠️
├─ DNS failover to EU-WEST (1-5 minutes)
├─ Writes buffered in queue
├─ Reads served from EU/APAC replicas
├─ API available at 80-90% capacity
├─ User experience: Slightly degraded
├─ RTO (Recovery Time): 15 minutes
├─ RPO (Data Loss): < 1 hour
└─ No data loss (cross-region replication)
```

---

## Deployment Timeline

```
MONTH 1: Foundation
├─ Week 1: Set up infrastructure
│  ├─ Kubernetes cluster
│  ├─ MongoDB replica set
│  ├─ Redis cluster
│  └─ RabbitMQ setup
│
├─ Week 2-4: Core services
│  ├─ Auth service
│  ├─ Movie service (CRUD)
│  ├─ API gateway setup
│  └─ Basic monitoring
│
└─ Status: 1,000 users can use MVP

MONTH 2: Features & Scale
├─ Streaming service
├─ Upload service
├─ Notification service
├─ Elasticsearch integration
├─ Advanced monitoring
│
└─ Status: 50,000 users can use

MONTH 3: Production Ready
├─ Load testing (100,000+ users)
├─ Security audit
├─ Disaster recovery drills
├─ CI/CD pipeline
├─ Multi-region setup
│
└─ Status: Ready for millions of users

MONTH 4+: Optimization & Scale
├─ Performance tuning
├─ Cost optimization
├─ Feature additions
├─ International expansion
│
└─ Status: Enterprise-grade system
```

---

## Quick Reference: File Locations

After you download the repository, you'll find:

```
netprime/
├─ SYSTEM_ARCHITECTURE.xml          ← Detailed architecture guide
├─ ARCHITECTURE_DIAGRAM.drawio       ← Visual diagram (open in draw.io)
├─ ARCHITECTURE_IMPLEMENTATION.md    ← Code examples
├─ QUICK_START_ARCHITECTURE.md       ← This file (summary)
├─ backend/                          ← Your backend code
│  ├─ server.js
│  ├─ models/
│  ├─ controllers/
│  ├─ services/
│  └─ middleware/
└─ src/                              ← Your frontend code
   ├─ components/
   └─ services/
```

**Next Steps:**
1. Open `ARCHITECTURE_DIAGRAM.drawio` in [draw.io website](https://app.diagrams.net)
2. Read through `ARCHITECTURE_IMPLEMENTATION.md`
3. Start building Phase 1 infrastructure
4. Let's create the scalable backend! 🚀
