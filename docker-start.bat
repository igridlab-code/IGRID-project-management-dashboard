@echo off
title IGRID Lab Dashboard - Docker Launch
echo ===================================================
echo   IGRID Innovation Lab - Starting Docker Container
echo ===================================================
echo.

set "DOCKER_BIN=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin"
if exist "%DOCKER_BIN%\docker.exe" (
    set "PATH=%DOCKER_BIN%;%PATH%"
)

echo Building and starting IGRID PM Dashboard in Docker...
docker compose up -d --build

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===================================================
    echo  SUCCESS! IGRID Lab PM Dashboard is running in Docker.
    echo  - Local URL:   http://localhost:3000
    echo  - Network URL: http://192.168.0.164:3000
    echo ===================================================
    start http://localhost:3000
) else (
    echo.
    echo [NOTE] If Docker Desktop gave an error, please ensure:
    echo 1. Docker Desktop is running and WSL2 is enabled (run: wsl --install)
    echo 2. Or run 'start-server.bat' to start directly without Docker!
)

pause
