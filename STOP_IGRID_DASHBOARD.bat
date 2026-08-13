@echo off
title IGRID Lab Dashboard - Stop Services
echo ======================================================================
echo   IGRID Innovation Lab - Stopping All PM Dashboard Services
echo ======================================================================
echo.

echo Stopping ngrok, cloudflared, and node processes...
taskkill /F /IM "ngrok.exe" 2>nul
taskkill /F /IM "cloudflared.exe" 2>nul
taskkill /F /IM "node.exe" /FI "WINDOWTITLE ne Antigravity*" 2>nul

echo All IGRID PM services have been stopped.
timeout /t 2 /nobreak >nul
