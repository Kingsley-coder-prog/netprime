#!/bin/bash
# NetPrime Full Stack Setup Script
# Run this to set up both frontend and backend

echo "🎬 NetPrime Full Stack Setup"
echo "=============================="
echo ""

# Check Node version
echo "✓ Checking Node.js..."
NODE_VERSION=$(node --version)
echo "  Node version: $NODE_VERSION"
echo ""

# Backend Setup
echo "🔧 Setting up Backend..."
cd backend

echo "  Installing dependencies..."
npm install > /dev/null 2>&1

if [ ! -f .env ]; then
  echo "  Creating .env from .env.example..."
  cp .env.example .env
fi

echo "  ✅ Backend dependencies installed"
echo ""

# Frontend Setup
cd ..
echo "🎨 Setting up Frontend..."

if [ ! -f .env.local ]; then
  echo "  Creating .env.local..."
  cp .env.example .env.local
fi

echo "  Installing frontend dependencies..."
npm install > /dev/null 2>&1
echo "  ✅ Frontend dependencies installed"
echo ""

# Summary
echo "=============================="
echo "✅ Setup Complete!"
echo "=============================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. START BACKEND:"
echo "   cd backend"
echo "   npm run dev"
echo "   (Backend will run on http://localhost:5000)"
echo ""
echo "2. IN A NEW TERMINAL, START FRONTEND:"
echo "   npm run dev"
echo "   (Frontend will run on http://localhost:5173)"
echo ""
echo "3. LOAD SAMPLE DATA:"
echo "   cd backend"
echo "   npm run seed"
echo ""
echo "4. OPEN BROWSER:"
echo "   http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "  - Backend Setup: BACKEND_SETUP.md"
echo "  - Integration Guide: INTEGRATION_GUIDE.md"
echo "  - API Reference: API_REFERENCE.md"
echo "  - Deployment Guide: DEPLOYMENT_GUIDE.md"
echo ""
echo "💡 Using the API in Vue:"
echo "  import { useMovies, useAuth } from '@/composables/useApi.js'"
echo ""
echo "Happy coding! 🚀"
