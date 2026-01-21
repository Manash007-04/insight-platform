@echo off
REM ============================================================================
REM AMEP - Stop All Services
REM ============================================================================

color 0C

echo.
echo ================================================================================
echo                    Stopping AMEP Services
echo ================================================================================
echo.

echo [1/5] Stopping Frontend (React/Vite)...
taskkill /FI "WindowTitle eq AMEP Frontend*" /F >nul 2>&1
taskkill /FI "WindowTitle eq *vite*" /F >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo [OK] Frontend stopped

echo.
echo [2/5] Stopping Backend (Flask)...
taskkill /FI "WindowTitle eq AMEP Backend*" /F >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
echo [OK] Backend stopped

echo.
echo [3/5] Stopping MongoDB...
REM Try Docker first
docker stop amep-mongodb >nul 2>&1
docker rm amep-mongodb >nul 2>&1

REM Try Windows service
net stop MongoDB >nul 2>&1

REM Try process
taskkill /F /IM mongod.exe >nul 2>&1
echo [OK] MongoDB stopped

echo.
echo [4/5] Stopping Redis...
REM Try Docker first
docker stop amep-redis >nul 2>&1
docker rm amep-redis >nul 2>&1

REM Try process
taskkill /F /IM redis-server.exe >nul 2>&1
echo [OK] Redis stopped

echo.
echo [5/5] Stopping Celery workers...
taskkill /F /IM celery.exe >nul 2>&1
echo [OK] Celery stopped

echo.
echo ================================================================================
echo                    All AMEP Services Stopped
echo ================================================================================
echo.
echo Services stopped:
echo   [X] Frontend (React/Vite)
echo   [X] Backend (Flask)
echo   [X] MongoDB
echo   [X] Redis
echo   [X] Celery Workers
echo.
echo You can now safely close this window or restart AMEP.
echo.
pause
