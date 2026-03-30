NETPRIME — SYSTEM DESIGN BREAKDOWN
===================================

1. ARCHITECTURE PATTERN: API GATEWAY + MICROSERVICES
-----------------------------------------------------
Every client request hits the gateway first (port 3000). The gateway handles:
- CORS validation
- JWT verification (injects x-user-id, x-user-role headers)
- Rate limiting (Redis-backed, per-user when authenticated, per-IP when guest)
- Request routing to the correct downstream service
- Cookie forwarding for cross-domain auth

Services are separated by domain (auth, user, movie, stream, upload, notification).
Each owns its own data and business logic. No service calls another's database directly.

WHAT CHANGED FROM INITIAL DESIGN:
The initial design had all services on separate ports with independent deployments.
In production we run a monolith-mode server.js that spawns all services as child processes
on the same Render instance. The architecture code is unchanged — only the deployment 
strategy adapted to free tier constraints. On paid infrastructure, split them back instantly 
by pointing service URLs to individual server instances.


2. AUTHENTICATION: JWT + REFRESH TOKEN ROTATION
-----------------------------------------------
Access Token: 15-minute expiry, stored in localStorage
Refresh Token: 7-day expiry, stored as httpOnly cookie (sameSite: none, secure: true)

Flow:
  Login → server issues both tokens
  Every API request → access token in Authorization header
  Access token expires → frontend silently calls /api/auth/refresh
  Refresh → server validates cookie, issues new pair, invalidates old refresh token
  Token reuse detected → ALL refresh tokens invalidated (security response)

Why httpOnly cookie for refresh token:
  JavaScript cannot read it → XSS attacks cannot steal it
  Browser sends it automatically on refresh requests
  sameSite: none required for cross-domain (Vercel → Render)

Why localStorage for access token:
  JavaScript needs to read it to set Authorization header
  15-minute expiry limits damage window if stolen


3. VIDEO PIPELINE: UPLOAD → TRANSCODE → STREAM
-----------------------------------------------
Upload Flow:
  Admin selects file → frontend requests presigned URL from upload-service
  Browser uploads directly to Cloudflare R2 (raw bucket) — server never touches the video bytes
  Upload-service creates BullMQ job in Redis queue
  Returns upload record with pending status

Transcoding Flow:
  Transcoder worker (Railway) polls Redis queue
  Picks up job → downloads raw video from R2 to local /tmp
  FFmpeg transcodes to HLS at applicable quality levels (determined by source resolution)
  Each quality: .m3u8 manifest + .ts segment files (6-second chunks)
  Segments uploaded to R2 (HLS processed bucket, public CDN)
  Worker writes results directly to MongoDB (bypasses HTTP to avoid timeout failures)
  Job marked complete in Redis

Streaming Flow:
  User plays movie → stream-service returns HLS manifest URL
  hls.js in browser loads master manifest from Cloudflare R2 CDN
  hls.js automatically selects quality based on bandwidth
  User can manually override quality selection
  Browser fetches segments directly from CDN — gateway/services not involved in video delivery

CDN Architecture:
  Raw uploads bucket: private (only worker can access)
  HLS processed bucket: public CDN URL (anyone with URL can stream)
  No egress fees on R2 (unlike S3) → cost-effective for video delivery


4. CACHING: CACHE-ASIDE PATTERN
--------------------------------
When a request hits movie-service for featured/trending movies:
  1. Check Redis for cached result
  2. Cache hit → return immediately (< 5ms)
  3. Cache miss → query MongoDB, store in Redis with TTL, return result

TTLs:
  Featured movies: 10 minutes (changes rarely)
  Trending: 5 minutes (updates with view counts)
  Individual movie: 30 minutes

Invalidation: When admin publishes/updates a movie, cache key is deleted
Cache key format: movie:featured, movie:trending, movie:{id}

Fallback: If Redis is unavailable, requests go directly to MongoDB
  Rate limiter falls back to in-memory (per-process, not global — acceptable degradation)


5. RATE LIMITING: REDIS-BACKED PER-USER
-----------------------------------------
Global limiter: 100 requests per 15 minutes
Auth limiter: 10 requests per 15 minutes (stricter for login/register)
Upload limiter: 20 requests per hour

Key strategy:
  Authenticated users: keyed by user ID (fair per-person regardless of IP)
  Guest users: keyed by IP address
  Blocked duration: 60 seconds after limit exceeded

Fallback: in-memory rate limiting when Redis unavailable
  Per-process not global → less accurate but prevents complete failure


6. DISTRIBUTED JOB QUEUE: BULLMQ + REDIS
-----------------------------------------
Why a queue instead of synchronous processing:
  Transcoding a 2-hour video takes 30-90 minutes
  HTTP request would timeout in seconds
  Queue decouples upload (fast) from processing (slow)

BullMQ configuration:
  Lock duration: 10 minutes (prevents other workers stealing the job)
  Lock renewal: every 4 minutes (keeps lock alive during long transcodes)
  Max stalled count: 1 (retry if worker crashes mid-transcode)
  Concurrency: 1 (one transcode at a time per worker instance — CPU bound)

Job states: waiting → active → completed/failed
  Failed jobs: retained for inspection, retry manually
  Completed jobs: retained 24 hours for debugging


7. STATELESS SERVICES + HORIZONTAL SCALABILITY
-----------------------------------------------
Each service is stateless — no in-memory session storage.
All state lives in:
  MongoDB (persistent data)
  Redis (sessions, cache, queue)
  JWTs (user identity, carried in every request)

This means you can run 10 instances of the gateway and any instance can handle any request.
The gateway just reads the JWT, verifies signature, injects user context headers, and proxies.

To scale horizontally:
  Add more gateway instances → update nginx upstream block (already configured)
  Add more worker instances → increase BullMQ concurrency or run parallel workers
  MongoDB Atlas auto-scales storage → increase compute tier for more IOPS


8. SECURITY LAYERS
------------------
Transport: HTTPS everywhere (Render, Vercel, Railway all enforce TLS)
Auth: JWT with short expiry + httpOnly refresh tokens
Rate limiting: prevents brute force and API abuse
Helmet.js: sets security headers (X-Frame-Options, X-Content-Type-Options, etc.)
CORS: allowlist only (production Vercel URL only)
Non-root Docker user: containers run as nodejs user (UID 1001), not root
Internal service auth: x-internal-secret header for service-to-service calls
MongoDB: Atlas network access restricted to Render/Railway IPs
Input validation: express-validator on all mutation endpoints


9. WHAT THE INITIAL ARCHITECTURE GOT RIGHT
-------------------------------------------
The original design document covered:
✅ Microservices separation by domain
✅ API Gateway as single entry point
✅ BullMQ for async transcoding
✅ Cloudflare R2 for video storage
✅ Redis for caching and rate limiting
✅ JWT authentication pattern
✅ HLS adaptive streaming

WHAT EVOLVED DURING BUILDING:
- Transcoder writes directly to MongoDB instead of HTTP callbacks (timeout issue)
- Lock duration increased from 30s to 10min (lock renewal bug)
- Production monolith mode (server.js) for free tier deployment
- sameSite: none for cross-domain cookies (discovered during deployment)
- Logger changed to console-only in production (Docker permissions issue)
- Cookie path changed from /api/auth/refresh to / (gateway path stripping)


10. SYSTEM DESIGN INTERVIEW TALKING POINTS
-------------------------------------------
If asked "how would you scale Netprime to 1M users?":

Immediate wins (no code changes):
  - Upgrade Render instances (more CPU/RAM)
  - Scale MongoDB Atlas tier
  - Cloudflare R2 already handles unlimited video delivery via CDN

Architecture changes:
  - Split services back to individual deployments
  - Add read replicas to MongoDB for movie queries
  - Add Redis Cluster for distributed rate limiting
  - Run 3-5 transcoder workers in parallel (increase BullMQ concurrency)
  - Add message broker (Kafka) between upload and transcoder for durability
  - Implement database sharding for user/stream data

Monitoring additions:
  - Datadog or Grafana for metrics
  - ELK stack for log aggregation
  - PagerDuty for alerting
  - k6 for load testing baselines