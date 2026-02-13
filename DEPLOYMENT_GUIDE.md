# NetPrime Full Stack Deployment Guide

## Quick Start

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)
- Git

### Local Development Setup

#### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run seed      # Load sample data
npm run dev       # Start backend on port 5000
```

#### 2. Frontend Setup
```bash
npm install
npm run dev       # Start frontend on port 5173
```

Visit `http://localhost:5173` in your browser.

## Production Deployment

### Backend Deployment (Render.com example)

1. **Prepare Repository:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Create Render Service:**
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect your GitHub repo
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && node server.js`

3. **Set Environment Variables in Render:**
```
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/netprime
JWT_SECRET=your-secret-key-change-this
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

4. **Get Backend URL:**
   - Render will provide: `https://your-backend.onrender.com`

### Frontend Deployment (Vercel example)

1. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Connect GitHub repo
   - Select root directory: `/`
   - Vercel automatically detects Vite

2. **Set Environment Variables:**
   - In Vercel dashboard, add:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```

3. **Custom Domain:**
   - Add custom domain in Vercel settings

### Alternative: Deploy Both to Heroku

#### Backend:
```bash
# Create Procfile in backend/
echo "web: node server.js" > backend/Procfile

# Deploy
heroku create your-app-name
heroku addons:create mongolab:sandbox
git push heroku main
```

#### Frontend:
```bash
# Build frontend
npm run build

# Deploy to Heroku
heroku create your-frontend-name
git push heroku main
```

## Database Setup

### MongoDB Atlas (Cloud)

1. **Create Account:**
   - Go to [mongodb.com/cloud](https://www.mongodb.com/cloud)
   - Sign up free account

2. **Create Cluster:**
   - Click "Create a Deployment"
   - Choose M0 (Free tier)
   - Select region close to you
   - Create

3. **Get Connection String:**
   - Click "Connect"
   - Choose "Drivers"
   - Copy connection string
   - Replace `<username>` and `<password>`
   - Replace `<database>` with `netprime`

4. **Update .env:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/netprime
```

5. **Seed Database:**
```bash
npm run seed
```

## API Endpoints (Production)

Once deployed, your API will be available at:
```
https://your-backend.onrender.com/api
```

Example endpoints:
```
GET  https://your-backend.onrender.com/api/movies
GET  https://your-backend.onrender.com/api/genres
POST https://your-backend.onrender.com/api/auth/login
```

## SSL/HTTPS

- Render: Automatic SSL
- Vercel: Automatic SSL
- Heroku: Automatic SSL

## Monitoring

### Logs
```bash
# Render
# View in Dashboard > Logs

# Heroku
heroku logs --tail

# Local
npm run dev # Check console
```

### Error Tracking (Optional)
- Add Sentry for error tracking
- Add LogRocket for session replay

## Scaling

### Horizontal Scaling
- Render: Auto-scaling available (paid)
- Heroku: Dynos (paid)
- AWS: Auto-scaling groups

### Database Optimization
- Add indexes to frequently queried fields
- Use MongoDB Atlas M2+ tier for better performance
- Enable compression

## Security Checklist

- [ ] Change JWT_SECRET to strong value
- [ ] Enable HTTPS (automatic on Render/Vercel/Heroku)
- [ ] Set secure CORS origins
- [ ] Hash passwords (already done with bcryptjs)
- [ ] Validate all inputs
- [ ] Rate limiting (add express-rate-limit)
- [ ] HTTPS only (set in production)
- [ ] Secure headers (add helmet.js)

## Backup Strategy

### MongoDB Atlas Backups
- Enable automatic backups (M2+ tier required)
- Or: Manual exports
```bash
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/netprime"
```

## Performance Optimization

1. **Backend:**
   - Add caching (Redis)
   - Implement pagination
   - Add database indexes
   - Use compression middleware

2. **Frontend:**
   - Lazy load images
   - Code splitting
   - Service workers for offline
   - CDN for static assets

## Cost Estimation (Free Tier)

- **Backend (Render):** Free tier (pauses after 15 min inactivity)
- **Frontend (Vercel):** Free tier (unlimited builds, deployments)
- **Database (MongoDB Atlas):** Free M0 tier (512 MB storage)
- **Total:** $0/month for hobby projects

**Upgraded estimate:**
- Backend (Render Standard): $7/month
- Database (MongoDB M2): $9/month  
- **Total:** ~$16/month for small production

## Troubleshooting

### API Connection Issues
```bash
# Test backend health
curl https://your-backend.onrender.com/api/health

# Check logs for errors
# Render: Dashboard > Logs
```

### CORS Issues
- Verify `FRONTEND_URL` in backend `.env`
- Check frontend `VITE_API_URL` points to correct backend

### Database Connection
- Verify connection string in `.env`
- Check IP whitelist in MongoDB Atlas
- Ensure database name is `netprime`

### Build Failures
- Check Node version compatibility
- Verify all dependencies in package.json
- Check for hardcoded paths

## Rollback Plan

```bash
# Render: Auto-reverts on health check failure
# Vercel: Revert to previous deployment in dashboard
# Heroku: heroku releases:rollback
```

## Next Steps

1. Deploy backend
2. Update frontend VITE_API_URL
3. Deploy frontend
4. Test all endpoints
5. Monitor logs
6. Set up alerts for errors

## Support Resources

- Backend README: [backend/README.md](./backend/README.md)
- Integration Guide: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- Render Docs: [render.com/docs](https://render.com/docs)
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- MongoDB Docs: [docs.mongodb.com](https://docs.mongodb.com)
