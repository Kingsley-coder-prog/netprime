# NetPrime Architecture & System Design

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (BROWSER)                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Vue 3 + Vite (http://localhost:5173)                     │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ Components                                            │  │  │
│  │  │ • AppHeader.vue                                      │  │  │
│  │  │ • HeroBanner.vue                                     │  │  │
│  │  │ • MovieCard.vue                                      │  │  │
│  │  │ • GenreGrid.vue                                      │  │  │
│  │  │ • MovieRow.vue                                       │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                         ↓                                     │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ API Layer (src/services/api.js)                      │  │  │
│  │  │ • authAPI                                            │  │  │
│  │  │ • movieAPI                                           │  │  │
│  │  │ • genreAPI                                           │  │  │
│  │  │ • userAPI                                            │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                         ↓                                     │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ Composables (src/composables/useApi.js)              │  │  │
│  │  │ • useAuth()                                          │  │  │
│  │  │ • useMovies()                                        │  │  │
│  │  │ • useUserWatchlist()                                 │  │  │
│  │  │ • useGenres()                                        │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST
              ┌───────────────────────────────────┐
              │   CORS Middleware                 │
              │   JWT Verification                │
              └───────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              EXPRESS SERVER (http://localhost:5000)              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Routes (/api)                                             │  │
│  │ • /auth → authRoutes.js                                   │  │
│  │ • /movies → movieRoutes.js                                │  │
│  │ • /genres → genreRoutes.js                                │  │
│  │ • /users → userRoutes.js                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                         ↓                                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Controllers (Business Logic)                              │  │
│  │ • authController.js                                       │  │
│  │ • movieController.js                                      │  │
│  │ • genreController.js                                      │  │
│  │ • userController.js                                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                         ↓                                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Models (Mongoose Schemas)                                 │  │
│  │ • User.js (authentication, watchlist)                     │  │
│  │ • Movie.js (movie metadata)                               │  │
│  │ • Genre.js (genre categorization)                         │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ MongoDB Queries
┌─────────────────────────────────────────────────────────────────┐
│           MONGODB DATABASE                                       │
│                                                                   │
│  Collections:                                                    │
│  • users (accounts, profiles, watchlist)                        │
│  • movies (content metadata)                                    │
│  • genres (categorization)                                      │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

### 1. Movie Discovery Flow
```
User Opens App
    ↓
App loads featured/trending/popular movies
    ↓
Frontend calls movieAPI.getFeaturedMovies()
    ↓
HTTP GET /api/movies/featured
    ↓
movieController.getFeaturedMovies()
    ↓
Movie.find({ featured: true }).populate('genres')
    ↓
MongoDB returns featured movies
    ↓
Response sent to frontend
    ↓
Components render movie cards
```

### 2. Authentication Flow
```
User submits login form
    ↓
Frontend calls authAPI.login(email, password)
    ↓
HTTP POST /api/auth/login
    ↓
authController.login()
    ↓
User.findOne({ email }).select('+password')
    ↓
Compare passwords with bcrypt
    ↓
Generate JWT token
    ↓
Return token to frontend
    ↓
Frontend stores token in localStorage
    ↓
Token included in all future requests
```

### 3. Watchlist Management Flow
```
User clicks "Add to Watchlist"
    ↓
Frontend calls userAPI.addToWatchlist(movieId)
    ↓
HTTP POST /api/users/watchlist (with JWT token)
    ↓
protect middleware verifies JWT
    ↓
userController.addToWatchlist()
    ↓
User.findByIdAndUpdate() - add movieId to watchlist array
    ↓
MongoDB updates user document
    ↓
Return updated watchlist
    ↓
Frontend updates UI
```

## 🔐 Authentication & Authorization

```
1. User Registration
   ├─ Password hashed with bcryptjs (10 salt rounds)
   ├─ User document created
   └─ JWT token generated

2. User Login
   ├─ Email verified
   ├─ Password verified with bcrypt.compare()
   ├─ JWT token generated with userId
   └─ Token sent to frontend

3. Protected Routes
   ├─ protect middleware checks Authorization header
   ├─ Extracts JWT token
   ├─ Verifies token signature
   ├─ Decodes userId from token
   ├─ Attaches userId to request
   └─ Route handler executes

JWT Structure:
{
  header: { typ: "JWT", alg: "HS256" },
  payload: { id: "user_id", iat: timestamp, exp: timestamp },
  signature: hash(header + payload + secret)
}
```

## 📦 API Response Structure

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* actual data */ },
  "count": 10  // optional, for list endpoints
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ /* detailed errors */ ]  // optional
}
```

## 🗄️ Database Schema Overview

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  profileImage: String,
  watchlist: [MovieId],
  watchHistory: [
    {
      movieId: MovieId,
      watchedAt: Date,
      progress: Number  // in minutes
    }
  ],
  favoriteGenres: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Movie Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  imageUrl: String,
  bannerImageUrl: String,
  genres: [GenreId],
  year: Number,
  rating: Number (0-10),
  duration: Number,
  seasons: Number,
  episodes: Number,
  director: String,
  cast: [String],
  contentRating: String (G, PG, PG-13, R, NC-17, TV-Y, TV-Y7, TV-14, TV-MA),
  featured: Boolean,
  trending: Boolean,
  popular: Boolean,
  videoUrl: String,
  maturityRating: Number,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Genre Collection
```javascript
{
  _id: ObjectId,
  name: String (unique),
  description: String,
  imageUrl: String,
  movies: [MovieId],
  createdAt: Date
}
```

## 🔄 Request/Response Cycle

### Example: Get Movies with Filter
```
1. REQUEST
   GET /api/movies?search=Avatar&genre=Sci-Fi&sortBy=rating
   
2. ROUTE HANDLER
   router.get('/', getAllMovies)
   
3. CONTROLLER
   const { search, genre, sortBy } = req.query
   Build query object based on filters
   Query database
   
4. DATABASE
   Movie.find(query)
     .populate('genres')
     .sort({ rating: -1 })
   
5. RESPONSE
   {
     success: true,
     count: 5,
     data: [
       { _id, title, imageUrl, genres, rating, ... },
       ...
     ]
   }
```

## 🚀 Deployment Architecture

### Development
```
┌──────────────────────────────────────────────┐
│ Localhost                                    │
├──────────────────────────────────────────────┤
│ Frontend: http://localhost:5173 (Vite)      │
│ Backend: http://localhost:5000 (Node)       │
│ Database: mongodb://localhost:27017 (Local) │
└──────────────────────────────────────────────┘
```

### Production
```
┌─────────────────────────────────────┐
│ Internet                            │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Vercel                      │   │
│  │ your-app.vercel.app         │   │
│  │ (Frontend - Vue 3)          │   │
│  └─────────────────────────────┘   │
│                ↓ HTTPS              │
│  ┌─────────────────────────────┐   │
│  │ Render.com                  │   │
│  │ your-backend.onrender.com   │   │
│  │ (Backend - Node/Express)    │   │
│  └─────────────────────────────┘   │
│                ↓ HTTPS              │
│  ┌─────────────────────────────┐   │
│  │ MongoDB Atlas               │   │
│  │ cloud.mongodb.com           │   │
│  │ (Database)                  │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

## 📈 Performance Considerations

### Database Optimization
- Indexed queries on `email`, `title`, `genre`
- Use `.populate()` only when needed
- Pagination for large result sets

### Frontend Optimization
- Code splitting with Vite
- Lazy loading images
- CSS compression with Tailwind
- Service workers for offline

### Backend Optimization
- Compression middleware
- HTTP caching headers
- JWT token reuse
- Connection pooling

## 🔍 Monitoring & Logging

### What to Monitor
```
Backend:
- Response times
- Error rates
- Database query times
- Memory usage
- CPU usage

Frontend:
- Page load time
- API call success rate
- JavaScript errors
- User interactions
```

### Logging Strategy
```
Development:
- Console logs (verbose)
- Request/response logs

Production:
- Structured logging (JSON)
- Error tracking (Sentry)
- Performance monitoring
- User action tracking
```

## 🔄 CI/CD Pipeline (Optional)

```
┌──────────────────────────────────────┐
│ GitHub Push                          │
└────────────┬─────────────────────────┘
             ↓
┌──────────────────────────────────────┐
│ GitHub Actions / CI                  │
├──────────────────────────────────────┤
│ ✓ Install dependencies               │
│ ✓ Run tests                          │
│ ✓ Build check                        │
│ ✓ Lint check                         │
└────────────┬─────────────────────────┘
             ↓
┌──────────────────────────────────────┐
│ Deploy to Production                 │
├──────────────────────────────────────┤
│ ✓ Vercel (Frontend)                  │
│ ✓ Render (Backend)                   │
│ ✓ Run migrations                     │
│ ✓ Seed data if needed                │
└──────────────────────────────────────┘
```

## 📋 Component Interaction Map

```
Frontend Component Tree:
App.vue
├── AppHeader.vue
│   ├── Search component
│   └── Profile menu
├── HeroBanner.vue (uses movieAPI)
├── SpotlightCarousel.vue (uses movieAPI)
├── MovieRow.vue
│   └── MovieCard.vue (uses userAPI)
├── FeaturedCategory.vue
│   └── MovieCard.vue
├── GenreGrid.vue (uses genreAPI)
│   └── GenreCard.vue
└── AppFooter.vue

API Composition Map:
useAuth → authAPI
  ├── register()
  ├── login()
  ├── logout()
  └── getCurrentUser()

useMovies → movieAPI
  ├── getAllMovies()
  ├── getFeaturedMovies()
  ├── getTrendingMovies()
  ├── getPopularMovies()
  └── getMovieById()

useUserWatchlist → userAPI
  ├── addToWatchlist()
  ├── removeFromWatchlist()
  ├── getWatchlist()
  ├── addToWatchHistory()
  └── getWatchHistory()

useGenres → genreAPI
  ├── getAllGenres()
  └── getMoviesByGenre()
```

## 🎯 Scalability Path

```
Phase 1: MVP (Current)
├── Single backend server
├── Single database
└── CDN for static assets

Phase 2: Growth
├── Load balancer
├── Multiple backend servers
├── Database replication
├── Caching layer (Redis)
└── Advanced analytics

Phase 3: Enterprise
├── Microservices
├── Kubernetes orchestration
├── Message queues
├── Advanced monitoring
└── Multi-region deployment
```

---

This architecture is designed to be:
- **Scalable** - Easy to add more servers/databases
- **Maintainable** - Clear separation of concerns
- **Secure** - JWT auth, CORS, input validation
- **Performant** - Indexed queries, caching strategies
- **Developer-Friendly** - Clear API, good documentation

---

**Questions about the architecture?** Check [API_REFERENCE.md](./API_REFERENCE.md) or [backend/README.md](./backend/README.md)
