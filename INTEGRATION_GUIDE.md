# Frontend-Backend Integration Guide

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file by copying `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB URI:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/netprime
```

5. Seed the database with sample data:
```bash
npm run seed
```

6. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

The frontend is already configured to work with the backend. Make sure your backend API is running on `http://localhost:5000`.

## Configuration Files Created

### Backend Structure
```
backend/
├── config/
│   └── database.js           # MongoDB connection
├── controllers/
│   ├── authController.js     # Auth logic
│   ├── movieController.js    # Movie operations
│   ├── genreController.js    # Genre operations
│   └── userController.js     # User operations
├── middleware/
│   ├── auth.js               # JWT verification
│   └── errorHandler.js       # Error handling
├── models/
│   ├── User.js               # User schema
│   ├── Movie.js              # Movie schema
│   └── Genre.js              # Genre schema
├── routes/
│   ├── authRoutes.js         # Auth endpoints
│   ├── movieRoutes.js        # Movie endpoints
│   ├── genreRoutes.js        # Genre endpoints
│   └── userRoutes.js         # User endpoints
├── scripts/
│   └── seedDatabase.js       # Sample data
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies
├── README.md                 # API documentation
└── server.js                 # Entry point
```

## API Endpoints Ready to Use

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login to account
- `GET /api/auth/me` - Get current user info

### Movies
- `GET /api/movies` - List all movies
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/featured` - Featured movies
- `GET /api/movies/trending` - Trending movies
- `GET /api/movies/popular` - Popular movies

### Genres
- `GET /api/genres` - List all genres
- `GET /api/genres/:id` - Get genre details

### User Features
- `GET /api/users/profile` - User profile
- `POST /api/users/watchlist` - Add to watchlist
- `GET /api/users/watchlist` - Get watchlist
- `POST /api/users/watch-history` - Track watch history

## Next Steps to Integrate Frontend

1. Create API service layer in frontend (suggested location: `src/services/api.js`)
2. Add axios or fetch wrapper for API calls
3. Implement authentication state management
4. Connect components to backend endpoints
5. Add user registration/login pages
6. Implement watchlist functionality
7. Add watch history tracking

## Database Models Ready

- ✅ User (Authentication, Watchlist, History)
- ✅ Movie (Complete metadata)
- ✅ Genre (Movie categorization)

## Sample Data Included

The database seed script includes:
- 6 Movie Genres (Action, Comedy, Drama, Sci-Fi, Horror, Documentary, Adventure, Romance)
- 18 Sample Movies with full details
- Ready-to-use test data

## Environment Variables

All configuration is in `.env`:
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing key
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS

## Testing the API

### Using cURL:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"User","email":"user@test.com","password":"pass123","confirmPassword":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123"}'

# Get Movies
curl http://localhost:5000/api/movies
```

### Using Postman:
1. Import the collection (create requests for each endpoint)
2. Set up environment variables for `BASE_URL` and `TOKEN`
3. Test each endpoint

## Production Deployment

For production deployment:

1. Update `.env` with production values
2. Set `NODE_ENV=production`
3. Use MongoDB Atlas or similar cloud database
4. Deploy backend to Heroku, Render, or similar platform
5. Update `FRONTEND_URL` in backend `.env`
6. Update frontend API base URL to production backend

## Common Issues & Solutions

### CORS Error
- Check `FRONTEND_URL` in `.env` matches your frontend URL
- Ensure backend is running on correct port

### MongoDB Connection Error
- Verify `MONGODB_URI` is correct
- Check MongoDB service is running
- For MongoDB Atlas, whitelist your IP

### JWT Token Errors
- Ensure `JWT_SECRET` is set
- Clear browser localStorage and login again

## Support

For issues or questions about the backend, check the [README.md](./backend/README.md) file.
