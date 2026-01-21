@echo off
REM ============================================================================
REM AMEP - Troubleshooting Script
REM ============================================================================

color 0E

echo.
echo ================================================================================
echo                    AMEP Troubleshooting Tool
echo ================================================================================
echo.

:MENU
echo.
echo What issue are you experiencing?
echo.
echo 1. Services won't start
echo 2. Port conflicts (already in use)
echo 3. Database connection errors
echo 4. Missing dependencies
echo 5. Reset everything (clean install)
echo 6. View logs
echo 7. Exit
echo.
choice /C 1234567 /N /M "Select option (1-7): "

if errorlevel 7 goto :EXIT
if errorlevel 6 goto :LOGS
if errorlevel 5 goto :RESET
if errorlevel 4 goto :DEPS
if errorlevel 3 goto :DATABASE
if errorlevel 2 goto :PORTS
if errorlevel 1 goto :SERVICES

:SERVICES
echo.
echo ================================================================================
echo Checking Services
echo ================================================================================
echo.

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo [ERROR] Python not found
    echo Install from: https://www.python.org/downloads/
) else (
    echo [OK] Python installed
)

echo.
echo Checking Node.js installation...
node --version
if errorlevel 1 (
    echo [ERROR] Node.js not found
    echo Install from: https://nodejs.org/
) else (
    echo [OK] Node.js installed
)

echo.
echo Checking MongoDB installation...
mongod --version
if errorlevel 1 (
    echo [ERROR] MongoDB not found
    echo Install from: https://www.mongodb.com/try/download/community
) else (
    echo [OK] MongoDB installed
)

echo.
echo Checking virtual environment...
if exist "backend\venv" (
    echo [OK] Virtual environment exists
) else (
    echo [ERROR] Virtual environment not found
    echo Creating virtual environment...
    cd backend
    python -m venv venv
    cd ..
)

pause
goto :MENU

:PORTS
echo.
echo ================================================================================
echo Checking Port Usage
echo ================================================================================
echo.

echo Checking port 5173 (Frontend)...
netstat -ano | findstr :5173
if errorlevel 1 (
    echo [OK] Port 5173 is available
) else (
    echo [WARNING] Port 5173 is in use
    netstat -ano | findstr :5173
    echo.
    echo To kill process: taskkill /F /PID [PID_NUMBER]
)

echo.
echo Checking port 5000 (Backend)...
netstat -ano | findstr :5000
if errorlevel 1 (
    echo [OK] Port 5000 is available
) else (
    echo [WARNING] Port 5000 is in use
    netstat -ano | findstr :5000
    echo.
    echo To kill process: taskkill /F /PID [PID_NUMBER]
)

echo.
echo Checking port 27017 (MongoDB)...
netstat -ano | findstr :27017
if errorlevel 1 (
    echo [OK] Port 27017 is available
) else (
    echo [WARNING] Port 27017 is in use
    netstat -ano | findstr :27017
)

echo.
echo Checking port 6379 (Redis)...
netstat -ano | findstr :6379
if errorlevel 1 (
    echo [OK] Port 6379 is available
) else (
    echo [WARNING] Port 6379 is in use
    netstat -ano | findstr :6379
)

pause
goto :MENU

:DATABASE
echo.
echo ================================================================================
echo Database Troubleshooting
echo ================================================================================
echo.

echo Testing MongoDB connection...
mongosh --eval "db.adminCommand('ping')"
if errorlevel 1 (
    echo [ERROR] Cannot connect to MongoDB
    echo.
    echo Solutions:
    echo 1. Start MongoDB: net start MongoDB
    echo 2. Or manually: mongod --dbpath=%USERPROFILE%\mongodb\data
    echo 3. Or use Docker: docker run -d -p 27017:27017 mongo:7.0
) else (
    echo [OK] MongoDB connection successful
    echo.
    echo Checking database contents...
    mongosh --quiet amep_db --eval "print('Collections:', db.getCollectionNames().length); print('Students:', db.students.countDocuments({})); print('Concepts:', db.concepts.countDocuments({}))"
)

pause
goto :MENU

:DEPS
echo.
echo ================================================================================
echo Reinstalling Dependencies
echo ================================================================================
echo.

echo [1/2] Reinstalling Python dependencies...
cd backend
if exist "venv" (
    call venv\Scripts\activate.bat
    pip install --upgrade pip
    pip install -r requirements.txt --force-reinstall
    echo [OK] Python dependencies reinstalled
) else (
    echo [ERROR] Virtual environment not found
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install --upgrade pip
    pip install -r requirements.txt
)
cd ..

echo.
echo [2/2] Reinstalling Node.js dependencies...
cd frontend
if exist "node_modules" (
    echo Removing old node_modules...
    rmdir /S /Q node_modules
)
call npm install
echo [OK] Node.js dependencies reinstalled
cd ..

pause
goto :MENU

:RESET
echo.
echo ================================================================================
echo RESET - Clean Install
echo ================================================================================
echo.
echo WARNING: This will delete all virtual environments, node_modules, and logs
echo Press Ctrl+C to cancel, or
pause

echo.
echo Stopping all services...
call stop-amep.bat

echo.
echo Cleaning backend...
cd backend
if exist "venv" rmdir /S /Q venv
if exist "logs" rmdir /S /Q logs
if exist "uploads" rmdir /S /Q uploads
if exist "__pycache__" rmdir /S /Q __pycache__
if exist ".env" del /F .env
cd ..

echo.
echo Cleaning frontend...
cd frontend
if exist "node_modules" rmdir /S /Q node_modules
if exist "dist" rmdir /S /Q dist
if exist ".env" del /F .env
cd ..

echo.
echo Cleaning database (optional)...
choice /C YN /N /M "Delete database data? (Y/N): "
if errorlevel 2 goto :SKIP_DB_CLEAN
echo Dropping database...
mongosh --quiet amep_db --eval "db.dropDatabase()"
:SKIP_DB_CLEAN

echo.
echo ================================================================================
echo Clean complete! Run start-amep.bat to reinstall and start
echo ================================================================================
echo.
pause
goto :MENU

:LOGS
echo.
echo ================================================================================
echo Viewing Logs
echo ================================================================================
echo.

if exist "backend\logs\amep.log" (
    echo Backend logs (last 20 lines):
    echo ------------------------------
    powershell -Command "Get-Content backend\logs\amep.log -Tail 20"
) else (
    echo [INFO] No backend logs found
)

echo.
echo MongoDB logs:
echo ------------------------------
docker logs amep-mongodb --tail 20 2>nul
if errorlevel 1 (
    echo [INFO] MongoDB not running in Docker or no logs available
)

pause
goto :MENU

:EXIT
echo.
echo Exiting troubleshooter...
exit /b 0
