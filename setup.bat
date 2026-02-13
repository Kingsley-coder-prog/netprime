@echo off
REM NetPrime Full Stack Setup Script for Windows
REM Run this to set up both frontend and backend

echo.
echo 🎬 NetPrime Full Stack Setup
echo ==============================
echo.

REM Check Node version
echo ✓ Checking Node.js...
node --version
echo.

REM Backend Setup
echo 🔧 Setting up Backend...
cd backend

echo   Installing dependencies...
call npm install >nul 2>&1

if not exist .env (
  echo   Creating .env from .env.example...
  copy .env.example .env >nul
)

echo   ✅ Backend dependencies installed
echo.

REM Frontend Setup
cd ..
echo 🎨 Setting up Frontend...

if not exist .env.local (
  echo   Creating .env.local...
  copy .env.example .env.local >nul
)

echo   Installing frontend dependencies...
call npm install >nul 2>&1
echo   ✅ Frontend dependencies installed
echo.

REM Summary
echo ==============================
echo ✅ Setup Complete!
echo ==============================
echo.
echo 📝 Next Steps:
echo.
echo 1. START BACKEND (in first terminal):
echo    cd backend
echo    npm run dev
echo    (Backend will run on http://localhost:5000)
echo.
echo 2. START FRONTEND (in second terminal):
echo    npm run dev
echo    (Frontend will run on http://localhost:5173)
echo.
echo 3. LOAD SAMPLE DATA (in third terminal):
echo    cd backend
echo    npm run seed
echo.
echo 4. OPEN BROWSER:
echo    http://localhost:5173
echo.
echo 📚 Documentation:
echo    - Backend Setup: BACKEND_SETUP.md
echo    - Integration Guide: INTEGRATION_GUIDE.md
echo    - API Reference: API_REFERENCE.md
echo    - Deployment Guide: DEPLOYMENT_GUIDE.md
echo.
echo 💡 Using the API in Vue:
echo    import { useMovies, useAuth } from '@/composables/useApi.js'
echo.
echo Happy coding! 🚀
echo.
pause
