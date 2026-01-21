@echo off
REM ============================================================================
REM AMEP - Check Services Status
REM ============================================================================

color 0B

echo.
echo ================================================================================
echo                    AMEP Services Status Check
echo ================================================================================
echo.

echo [1/6] Checking Frontend (React/Vite)...
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 (
    echo [X] Frontend is NOT running on http://localhost:5173
) else (
    echo [OK] Frontend is running on http://localhost:5173
)

echo.
echo [2/6] Checking Backend (Flask)...
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo [X] Backend is NOT running on http://localhost:5000
) else (
    echo [OK] Backend is running on http://localhost:5000
)

echo.
echo [3/6] Checking MongoDB...
mongosh --quiet --eval "db.adminCommand('ping')" >nul 2>&1
if errorlevel 1 (
    echo [X] MongoDB is NOT running on mongodb://localhost:27017
) else (
    echo [OK] MongoDB is running on mongodb://localhost:27017
)

echo.
echo [4/6] Checking Redis...
redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo [X] Redis is NOT running on redis://localhost:6379
) else (
    echo [OK] Redis is running on redis://localhost:6379
)

echo.
echo [5/6] Checking Database Data...
mongosh --quiet amep_db --eval "print('Students:', db.students.countDocuments({})); print('Concepts:', db.concepts.countDocuments({})); print('Templates:', db.curriculum_templates.countDocuments({}))" 2>nul
if errorlevel 1 (
    echo [X] Could not connect to database
) else (
    echo [OK] Database is accessible
)

echo.
echo [6/6] Checking Processes...
echo.
echo Running Node processes:
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find "node.exe"
if errorlevel 1 echo   (none)

echo.
echo Running Python processes:
tasklist /FI "IMAGENAME eq python.exe" 2>nul | find "python.exe"
if errorlevel 1 echo   (none)

echo.
echo Running MongoDB processes:
tasklist /FI "IMAGENAME eq mongod.exe" 2>nul | find "mongod.exe"
if errorlevel 1 echo   (none)

echo.
echo Running Redis processes:
tasklist /FI "IMAGENAME eq redis-server.exe" 2>nul | find "redis-server.exe"
if errorlevel 1 echo   (none)

echo.
echo ================================================================================
echo                         Status Check Complete
echo ================================================================================
echo.
echo If services are not running, use: start-amep.bat
echo To stop all services, use: stop-amep.bat
echo.
pause
