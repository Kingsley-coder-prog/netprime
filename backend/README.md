# NetPrime Backend API

A complete backend API for the NetPrime movie streaming application built with Node.js, Express, and MongoDB.

## Features

- 🔐 User Authentication (Register, Login, JWT)
- 🎬 Movie Management (CRUD operations)
- 🎭 Genre Management
- 📋 Watchlist Management
- ⏱️ Watch History Tracking
- 👤 User Profiles
- 🔍 Search and Filter Movies

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Create `.env` file:**
```bash
cp .env.example .env
```

3. **Configure environment variables in `.env`:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/netprime
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Running the Server

### Development Mode (with hot reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

### Seed Database with Sample Data:
```bash
npm run seed
```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### Authentication Routes `/api/auth`
- `POST /register` - Register a new user
- `POST /login` - Login user
- `GET /logout` - Logout user
- `GET /me` - Get current user (protected)

### Movie Routes `/api/movies`
- `GET /` - Get all movies (supports search, filtering, sorting)
- `GET /:id` - Get movie by ID
- `GET /featured` - Get featured movies
- `GET /trending` - Get trending movies
- `GET /popular` - Get popular movies
- `POST /` - Create new movie
- `PUT /:id` - Update movie
- `DELETE /:id` - Delete movie

### Genre Routes `/api/genres`
- `GET /` - Get all genres
- `GET /:id` - Get genre by ID
- `POST /` - Create new genre
- `PUT /:id` - Update genre
- `DELETE /:id` - Delete genre
- `GET /search/:genreName` - Get movies by genre name

### User Routes `/api/users`
- `GET /profile` - Get user profile (protected)
- `PUT /profile` - Update user profile (protected)
- `POST /watchlist` - Add movie to watchlist (protected)
- `DELETE /watchlist/:movieId` - Remove from watchlist (protected)
- `GET /watchlist` - Get watchlist (protected)
- `POST /watch-history` - Add to watch history (protected)
- `GET /watch-history` - Get watch history (protected)
- `PUT /favorite-genres` - Set favorite genres (protected)

## Query Parameters

### Movies Endpoint Supports:
- `search` - Search movies by title
- `genre` - Filter by genre
- `trending` - Get trending movies (true/false)
- `popular` - Get popular movies (true/false)
- `featured` - Get featured movies (true/false)
- `sortBy` - Sort by: `rating`, `latest`, `popular`

**Example:**
```
GET /api/movies?search=Avatar&genre=Sci-Fi&sortBy=rating
```

## Authentication

Protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  profileImage: String,
  watchlist: [MovieId],
  watchHistory: [{movieId, watchedAt, progress}],
  favoriteGenres: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Movie
```javascript
{
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
  contentRating: String,
  featured: Boolean,
  trending: Boolean,
  popular: Boolean,
  videoUrl: String,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Genre
```javascript
{
  name: String (unique),
  description: String,
  imageUrl: String,
  movies: [MovieId],
  createdAt: Date
}
```

## Response Format

All responses follow a consistent format:

### Success Response:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error message"
}
```

## Example Usage

### Register User:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get All Movies:
```bash
curl http://localhost:5000/api/movies
```

### Add to Watchlist:
```bash
curl -X POST http://localhost:5000/api/users/watchlist \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"movieId": "movie_id_here"}'
```

## Error Handling

The API includes comprehensive error handling for:
- Validation errors
- Authentication errors
- Database errors
- Not found errors
- Server errors

## CORS Configuration

The backend is configured to accept requests from:
- Frontend URL specified in `.env` (default: `http://localhost:5173`)
- Credentials are allowed for cross-origin requests

## Future Enhancements

- [ ] Email verification
- [ ] Password reset functionality
- [ ] Admin dashboard
- [ ] Payment integration
- [ ] Streaming video upload
- [ ] Comments and ratings
- [ ] Recommendations engine
- [ ] Social features (sharing, following)

## License

MIT License

## Support

For issues or questions, please create an issue in the repository.
