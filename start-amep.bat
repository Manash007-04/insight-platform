@echo off
REM ============================================================================
REM AMEP - Adaptive Mastery & Engagement Platform
REM One-Click Startup Script for Windows
REM ============================================================================

setlocal enabledelayedexpansion

REM Set console colors
color 0A

echo.
echo ================================================================================
echo                  AMEP - Adaptive Mastery ^& Engagement Platform
echo                         One-Click Startup for Windows
echo ================================================================================
echo.

REM ============================================================================
REM CHECK PREREQUISITES
REM ============================================================================

echo [1/8] Checking prerequisites...
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.11+ from https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python installed

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js installed

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)
echo [OK] npm installed

REM Check MongoDB
echo Checking for MongoDB...
mongod --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] MongoDB not found in PATH
    echo.
    echo Please choose installation method:
    echo 1. I have MongoDB installed (will start manually)
    echo 2. Use Docker for MongoDB (recommended)
    echo 3. Exit and install MongoDB
    echo.
    choice /C 123 /N /M "Select option (1, 2, or 3): "

    if errorlevel 3 (
        echo.
        echo Please install MongoDB from: https://www.mongodb.com/try/download/community
        pause
        exit /b 1
    )
    if errorlevel 2 (
        set USE_DOCKER=1
        echo [INFO] Will use Docker for MongoDB
    )
    if errorlevel 1 (
        set MONGODB_MANUAL=1
        echo [INFO] Assuming MongoDB is running manually
    )
) else (
    echo [OK] MongoDB installed
)

REM Check Redis
echo Checking for Redis...
redis-server --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Redis not found
    echo Redis is optional but recommended for caching and async tasks
    set SKIP_REDIS=1
) else (
    echo [OK] Redis installed
)

echo.
echo ================================================================================
echo Prerequisites check complete!
echo ================================================================================
echo.
timeout /t 2 >nul

REM ============================================================================
REM SETUP BACKEND
REM ============================================================================

echo [2/8] Setting up Backend (Python/Flask)...
echo.

cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment already exists
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip --quiet

REM Install dependencies
echo Installing Python dependencies (this may take a few minutes)...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [ERROR] Failed to install Python dependencies
    echo Trying again with verbose output...
    pip install -r requirements.txt
    pause
    exit /b 1
)
echo [OK] Python dependencies installed

REM Create .env if it doesn't exist
if not exist ".env" (
    echo Creating .env configuration file...
    copy .env.example .env >nul 2>&1
    if not exist ".env" (
        echo # AMEP Backend Configuration > .env
        echo FLASK_ENV=development >> .env
        echo FLASK_DEBUG=True >> .env
        echo MONGODB_URI=mongodb://localhost:27017/ >> .env
        echo MONGODB_DB_NAME=amep_db >> .env
        echo REDIS_URL=redis://localhost:6379/0 >> .env
        echo SECRET_KEY=dev-secret-key-change-in-production >> .env
        echo JWT_SECRET_KEY=jwt-secret-key-change-in-production >> .env
    )
    echo [OK] .env file created
) else (
    echo [OK] .env file already exists
)

REM Create necessary directories
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "models" mkdir models

cd ..
echo.
echo ================================================================================
echo Backend setup complete!
echo ================================================================================
echo.
timeout /t 2 >nul

REM ============================================================================
REM SETUP FRONTEND
REM ============================================================================

echo [3/8] Setting up Frontend (React/Vite)...
echo.

cd frontend

REM Install dependencies
if not exist "node_modules" (
    echo Installing Node.js dependencies (this may take a few minutes)...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install Node.js dependencies
        pause
        exit /b 1
    )
    echo [OK] Node.js dependencies installed
) else (
    echo [OK] Node.js dependencies already installed
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo Creating frontend .env file...
    copy .env.example .env >nul 2>&1
    if not exist ".env" (
        echo VITE_API_URL=http://localhost:5000 > .env
        echo VITE_ENV=development >> .env
    )
    echo [OK] Frontend .env file created
) else (
    echo [OK] Frontend .env file already exists
)

cd ..
echo.
echo ================================================================================
echo Frontend setup complete!
echo ================================================================================
echo.
timeout /t 2 >nul

REM ============================================================================
REM START MONGODB
REM ============================================================================

echo [4/8] Starting MongoDB...
echo.

if defined USE_DOCKER (
    echo Starting MongoDB with Docker...
    docker run -d --name amep-mongodb -p 27017:27017 -e MONGO_INITDB_DATABASE=amep_db mongo:7.0
    if errorlevel 1 (
        echo [ERROR] Failed to start MongoDB container
        echo Make sure Docker Desktop is running
        pause
        exit /b 1
    )
    echo [OK] MongoDB container started
) else if defined MONGODB_MANUAL (
    echo [INFO] Please ensure MongoDB is running on localhost:27017
    echo Press any key to continue...
    pause >nul
) else (
    REM Start MongoDB as Windows service or process
    echo Starting MongoDB service...
    net start MongoDB >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] Could not start MongoDB service
        echo Attempting to start MongoDB manually...
        start "MongoDB" mongod --dbpath=%USERPROFILE%\mongodb\data
        timeout /t 3 >nul
    )
    echo [OK] MongoDB started
)

REM Wait for MongoDB to be ready
echo Waiting for MongoDB to be ready...
timeout /t 3 >nul

REM Initialize database
echo Initializing database...
cd backend
call venv\Scripts\activate.bat
python -c "from models.database import init_db; init_db()" 2>nul
if errorlevel 1 (
    echo [WARNING] Could not initialize database (may already be initialized)
) else (
    echo [OK] Database initialized
)
cd ..

echo.
echo ================================================================================
echo MongoDB ready!
echo ================================================================================
echo.
timeout /t 2 >nul

REM ============================================================================
REM START REDIS (OPTIONAL)
REM ============================================================================

echo [5/8] Starting Redis (optional)...
echo.

if not defined SKIP_REDIS (
    if defined USE_DOCKER (
        echo Starting Redis with Docker...
        docker run -d --name amep-redis -p 6379:6379 redis:7-alpine
        echo [OK] Redis container started
    ) else (
        echo Starting Redis server...
        start "Redis" redis-server
        timeout /t 2 >nul
        echo [OK] Redis started
    )
) else (
    echo [INFO] Skipping Redis (not required for basic functionality)
)

echo.
echo ================================================================================
echo Redis ready!
echo ================================================================================
echo.
timeout /t 2 >nul

REM ============================================================================
REM SEED DATABASE
REM ============================================================================

echo [6/8] Loading sample data...
echo.

REM Check if data already exists
cd backend
call venv\Scripts\activate.bat
python -c "from models.database import db, STUDENTS; count = db.students.count_documents({}); exit(0 if count > 0 else 1)" 2>nul

if errorlevel 1 (
    echo Loading sample data (5 students, 4 concepts, 2 templates)...
    python -c "from models.database import seed_sample_data; seed_sample_data()"
    if errorlevel 1 (
        echo [WARNING] Could not load sample data
    ) else (
        echo [OK] Sample data loaded
        echo.
        echo Demo Credentials:
        echo   Teacher: teacher@amep.edu / demo123
        echo   Student: student1@amep.edu / demo123
    )
) else (
    echo [OK] Database already contains data
)

cd ..
echo.
echo ================================================================================
echo Database ready!
echo ================================================================================
echo.
timeout /t 2 >nul

REM ============================================================================
REM START BACKEND SERVER
REM ============================================================================

echo [7/8] Starting Backend Server (Flask)...
echo.

cd backend
call venv\Scripts\activate.bat
start "AMEP Backend (Flask)" cmd /k "title AMEP Backend ^& color 0B ^& python app.py"
cd ..

echo [OK] Backend server starting on http://localhost:5000
echo.
timeout /t 3 >nul

REM ============================================================================
REM START FRONTEND SERVER
REM ============================================================================

echo [8/8] Starting Frontend Server (React/Vite)...
echo.

cd frontend
start "AMEP Frontend (React)" cmd /k "title AMEP Frontend ^& color 0E ^& npm run dev"
cd ..

echo [OK] Frontend server starting on http://localhost:5173
echo.
timeout /t 3 >nul

REM ============================================================================
REM COMPLETION
REM ============================================================================

echo.
echo ================================================================================
echo                           AMEP IS NOW RUNNING!
echo ================================================================================
echo.
echo Services:
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo   MongoDB:   mongodb://localhost:27017/amep_db
echo   Redis:     redis://localhost:6379 (if running)
echo.
echo Demo Login:
echo   Teacher:   teacher@amep.edu / demo123
echo   Student:   student1@amep.edu / demo123
echo.
echo Features Available:
echo   - Teacher Dashboard (Engagement, Mastery, Analytics)
echo   - Live Anonymous Polling
echo   - PBL Workspace (Projects, Teams, Milestones)
echo   - Soft Skills Assessment (4D Rubric)
echo   - Template Library (Curriculum Resources)
echo.
echo Windows:
echo   - Backend:  Check the "AMEP Backend" window
echo   - Frontend: Check the "AMEP Frontend" window
echo.
echo To stop all services:
echo   - Close all AMEP windows
echo   - Run: stop-amep.bat
echo.
echo Press Ctrl+C in this window to stop the launcher
echo.
echo ================================================================================
echo.
echo Opening browser in 5 seconds...
timeout /t 5 >nul

REM Open browser
start http://localhost:5173

echo.
echo Browser opened! The application is ready to use.
echo.
echo Keep this window open to monitor status.
echo Press any key to stop all services...
pause >nul

REM ============================================================================
REM CLEANUP
REM ============================================================================

echo.
echo Stopping services...
taskkill /FI "WindowTitle eq AMEP Backend*" /F >nul 2>&1
taskkill /FI "WindowTitle eq AMEP Frontend*" /F >nul 2>&1

if defined USE_DOCKER (
    echo Stopping Docker containers...
    docker stop amep-mongodb amep-redis >nul 2>&1
    docker rm amep-mongodb amep-redis >nul 2>&1
)

echo.
echo ================================================================================
echo AMEP has been stopped. Thank you for using AMEP!
echo ================================================================================
echo.
pause
