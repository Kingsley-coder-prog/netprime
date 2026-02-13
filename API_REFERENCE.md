# NetPrime Backend API Quick Reference

## Base URL
```
http://localhost:5000/api          (Development)
https://your-backend.com/api       (Production)
```

## Authentication Header
```
Authorization: Bearer <JWT_TOKEN>
```

## Response Format
```json
{
  "success": true/false,
  "message": "Response message",
  "data": {}
}
```

---

## 🔐 Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}

Response: { token, user: {id, name, email} }
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: { token, user: {id, name, email} }
```

### Get Current User ⚠️ Protected
```
GET /auth/me
Authorization: Bearer <token>

Response: { user: {...} }
```

### Logout
```
GET /auth/logout

Response: { success: true }
```

---

## 🎬 Movie Endpoints

### Get All Movies (with filters)
```
GET /movies
GET /movies?search=Avatar
GET /movies?genre=Sci-Fi
GET /movies?trending=true
GET /movies?popular=true
GET /movies?featured=true
GET /movies?sortBy=rating          (rating|latest|popular)

Response: { count, data: [{...}] }
```

### Get Movie by ID
```
GET /movies/:id

Response: { data: {...} }
```

### Get Featured Movies
```
GET /movies/featured

Response: { count, data: [{...}] }
```

### Get Trending Movies
```
GET /movies/trending

Response: { count, data: [{...}] }
```

### Get Popular Movies
```
GET /movies/popular

Response: { count, data: [{...}] }
```

### Create Movie ⚠️ Protected
```
POST /movies
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Movie Title",
  "description": "Description",
  "imageUrl": "https://...",
  "genres": ["genre_id"],
  "year": 2024,
  "rating": 8.5,
  "duration": 150,
  "seasons": null,
  "director": "Director Name",
  "cast": ["Actor 1"],
  "contentRating": "PG-13",
  "featured": false,
  "trending": true,
  "popular": false,
  "videoUrl": "https://...",
  "tags": ["Action", "Sci-Fi"]
}

Response: { data: {...} }
```

### Update Movie ⚠️ Protected
```
PUT /movies/:id
Authorization: Bearer <token>
Content-Type: application/json

{ ...fields to update }

Response: { data: {...} }
```

### Delete Movie ⚠️ Protected
```
DELETE /movies/:id
Authorization: Bearer <token>

Response: { success: true }
```

---

## 🎭 Genre Endpoints

### Get All Genres
```
GET /genres

Response: { count, data: [{...}] }
```

### Get Genre by ID
```
GET /genres/:id

Response: { data: {...} }
```

### Get Movies by Genre
```
GET /genres/search/:genreName

Response: { count, data: [{...}] }
```

### Create Genre ⚠️ Protected
```
POST /genres
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Action",
  "description": "Action movies",
  "imageUrl": "https://..."
}

Response: { data: {...} }
```

### Update Genre ⚠️ Protected
```
PUT /genres/:id
Authorization: Bearer <token>
Content-Type: application/json

{ ...fields to update }

Response: { data: {...} }
```

### Delete Genre ⚠️ Protected
```
DELETE /genres/:id
Authorization: Bearer <token>

Response: { success: true }
```

---

## 👤 User Endpoints

### Get User Profile ⚠️ Protected
```
GET /users/profile
Authorization: Bearer <token>

Response: { data: { id, name, email, watchlist: [...], favoriteGenres: [...] } }
```

### Update Profile ⚠️ Protected
```
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name",
  "profileImage": "https://..."
}

Response: { data: {...} }
```

### Add to Watchlist ⚠️ Protected
```
POST /users/watchlist
Authorization: Bearer <token>
Content-Type: application/json

{ "movieId": "movie_id_here" }

Response: { data: [...movie_ids] }
```

### Remove from Watchlist ⚠️ Protected
```
DELETE /users/watchlist/:movieId
Authorization: Bearer <token>

Response: { data: [...movie_ids] }
```

### Get Watchlist ⚠️ Protected
```
GET /users/watchlist
Authorization: Bearer <token>

Response: { count, data: [{movie objects}] }
```

### Add to Watch History ⚠️ Protected
```
POST /users/watch-history
Authorization: Bearer <token>
Content-Type: application/json

{
  "movieId": "movie_id_here",
  "progress": 45    (optional, in minutes)
}

Response: { data: [{...}] }
```

### Get Watch History ⚠️ Protected
```
GET /users/watch-history
Authorization: Bearer <token>

Response: { count, data: [{movieId, watchedAt, progress}] }
```

### Set Favorite Genres ⚠️ Protected
```
PUT /users/favorite-genres
Authorization: Bearer <token>
Content-Type: application/json

{ "genres": ["Action", "Sci-Fi", "Drama"] }

Response: { data: {...user} }
```

---

## 🔍 Query Examples

### Search for action movies with high ratings
```
GET /movies?search=avatar&genre=Sci-Fi&sortBy=rating
```

### Get all trending movies
```
GET /movies?trending=true
```

### Get featured movies
```
GET /movies/featured
```

---

## 💡 Common Use Cases

### 1. User Registration & Login
```javascript
// Register
POST /auth/register with credentials
// Server returns JWT token
// Store token in localStorage

// Login
POST /auth/login with email & password
// Server returns JWT token
// Store token in localStorage

// Use token for protected requests
Authorization: Bearer <token>
```

### 2. Display Homepage
```javascript
// Parallel requests
GET /movies/featured
GET /movies/trending
GET /movies/popular
GET /genres
```

### 3. Search & Filter
```javascript
GET /movies?search=<query>&genre=<genre>&sortBy=rating
```

### 4. Manage Watchlist
```javascript
// Add
POST /users/watchlist { movieId }

// View
GET /users/watchlist

// Remove
DELETE /users/watchlist/:movieId
```

### 5. Track Viewing
```javascript
POST /users/watch-history { movieId, progress }
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error or missing fields"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 🧪 Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "pass123",
    "confirmPassword": "pass123"
  }'
```

### Get Movies
```bash
curl http://localhost:5000/api/movies
```

### Get Movie by ID
```bash
curl http://localhost:5000/api/movies/MOVIE_ID
```

### With Authorization
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/users/profile
```

---

## 📊 Data Models

### Movie Object
```javascript
{
  _id: String,
  title: String,
  description: String,
  imageUrl: String,
  bannerImageUrl: String,
  genres: [Genre],
  year: Number,
  rating: Number,
  duration: Number,
  seasons: Number,
  episodes: Number,
  director: String,
  cast: [String],
  contentRating: String,
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

### User Object
```javascript
{
  _id: String,
  name: String,
  email: String,
  profileImage: String,
  watchlist: [MovieId],
  watchHistory: [{movieId, watchedAt, progress}],
  favoriteGenres: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Genre Object
```javascript
{
  _id: String,
  name: String,
  description: String,
  imageUrl: String,
  movies: [MovieId],
  createdAt: Date
}
```

---

## 🚀 Rate Limits

Currently: No rate limiting (add express-rate-limit for production)

---

## 🆘 Support

- Backend README: [backend/README.md](./backend/README.md)
- API Composables: [src/composables/useApi.js](./src/composables/useApi.js)
- Integration Guide: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
