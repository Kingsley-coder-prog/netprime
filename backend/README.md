# 🎬 Netprime Backend

A production-grade, scalable Node.js backend for the Cinemax movie streaming platform.

## Architecture Overview

```
Clients (Web / Mobile / TV)
        │
        ├──── CDN (Cloudflare/CloudFront) ──── S3/R2 HLS Video
        │
        └──── NGINX Load Balancer
                      │
               API Gateway :3000
               (JWT verify, rate limit)
                      │
        ┌─────────────┼──────────────┐
        │             │              │
  Auth :3001    Movie :3003   Upload :3005
  User :3002   Stream :3004   Notif :3006
        │             │              │
        └─────────────┼──────────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
       MongoDB      Redis       BullMQ
     Replica Set   Cluster    + Workers
```

## Stack

| Layer         | Technology                              |
| ------------- | --------------------------------------- |
| Runtime       | Node.js 20, CommonJS                    |
| Framework     | Express.js                              |
| Database      | MongoDB + Mongoose (Replica Set)        |
| Cache / RL    | Redis (ioredis + rate-limiter-flexible) |
| Queue         | BullMQ (Redis Streams)                  |
| Object Store  | AWS S3 / Cloudflare R2                  |
| CDN           | CloudFront / Cloudflare                 |
| Video         | FFmpeg (HLS transcoding)                |
| Auth          | JWT (access + refresh rotation)         |
| Containers    | Docker + Docker Compose                 |
| Reverse Proxy | NGINX                                   |

## Services

| Service              | Port | Responsibility                        |
| -------------------- | ---- | ------------------------------------- |
| API Gateway          | 3000 | Routing, JWT verification, rate limit |
| Auth Service         | 3001 | Register, login, tokens, sessions     |
| User Service         | 3002 | Profiles, watchlists, subscriptions   |
| Movie Service        | 3003 | Metadata, search, genres, ratings     |
| Stream Service       | 3004 | Signed CDN URLs, DRM, playback        |
| Upload Service       | 3005 | Multipart upload to S3, job dispatch  |
| Notification Service | 3006 | Email, push notifications             |

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- Redis

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start all services (development)
```bash
npm run dev
```

### 4. Or use Docker Compose
```bash
docker-compose -f infra/docker/docker-compose.yml up --build
```

## API Endpoints

### Auth
| Method | Path                          | Auth | Description        |
| ------ | ----------------------------- | ---- | ------------------ |
| POST   | /api/auth/register            | ✗    | Register new user  |
| POST   | /api/auth/login               | ✗    | Login              |
| POST   | /api/auth/refresh             | ✗    | Refresh tokens     |
| POST   | /api/auth/logout              | ✓    | Logout             |
| POST   | /api/auth/logout-all          | ✓    | Logout all devices |
| GET    | /api/auth/me                  | ✓    | Get profile        |
| POST   | /api/auth/forgot-password     | ✗    | Request reset link |
| POST   | /api/auth/reset-password      | ✗    | Reset password     |
| GET    | /api/auth/verify-email/:token | ✗    | Verify email       |

## Connecting to the Frontend

Set your frontend API base URL to:
```
http://localhost:3000/api   (development)
https://yourdomain.com/api  (production)
```

All responses follow this shape:
```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Human-readable message",
  "details": [ { "field": "email", "message": "..." } ]
}
```

## Running Tests
```bash
npm test
```