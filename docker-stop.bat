@echo off
title IGRID Lab Dashboard - Stop Docker
echo Stopping IGRID Dashboard Docker container...

set "DOCKER_BIN=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin"
if exist "%DOCKER_BIN%\docker.exe" (
    set "PATH=%DOCKER_BIN%;%PATH%"
)

docker compose down
echo Docker container stopped.
pause
