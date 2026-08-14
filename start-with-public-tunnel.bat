@echo off
title IGRID Innovation Lab - PM Dashboard + Permanent Domain
color 0A
cls
echo ======================================================================
echo   IGRID Innovation Lab - Server + Permanent Public Domain
echo ======================================================================
echo.
echo  🌐 Permanent Public URL: https://igrid-lab.loca.lt
echo  💻 Local PC URL:         http://localhost:3000
echo  📡 Lab Wi-Fi URL:        http://192.168.0.164:3000
echo.
echo ======================================================================
echo.

start "" "http://localhost:3000"
node start-master.js

pause
