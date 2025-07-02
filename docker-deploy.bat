@echo off
echo === Photobooth MERN App Docker Deployment ===

REM Check if Docker is installed
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo Docker is not installed. Please install Docker first.
    exit /b
)

echo.
echo 1. Build and start the application
echo 2. Stop the application
echo 3. View logs
echo 4. Restart the application
echo.

set /p choice=Enter your choice (1-4): 

if "%choice%"=="1" (
    echo Building and starting the application...
    docker-compose up -d --build
    echo Application is now running at http://localhost:3000
) else if "%choice%"=="2" (
    echo Stopping the application...
    docker-compose down
    echo Application has been stopped.
) else if "%choice%"=="3" (
    echo Viewing logs... (Press Ctrl+C to exit)
    docker-compose logs -f app
) else if "%choice%"=="4" (
    echo Restarting the application...
    docker-compose restart
    echo Application has been restarted.
) else (
    echo Invalid choice. Please run the script again.
)
