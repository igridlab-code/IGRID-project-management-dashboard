@echo off
title IGRID Lab Dashboard - Install Auto-Start on Boot
echo ======================================================================
echo   IGRID Innovation Lab - Enabling Automatic Boot Startup
echo ======================================================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_VBS=%STARTUP_FOLDER%\IGRID_Lab_AutoStart.vbs"
set "PROJECT_DIR=%~dp0"
:: Remove trailing backslash if present
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

echo Configuring automatic startup in Windows Startup folder:
echo %STARTUP_FOLDER%
echo.

:: Create startup VBScript
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.CurrentDirectory = "%PROJECT_DIR%"
echo WshShell.Run "node start-master.js", 0, False
) > "%TARGET_VBS%"

if exist "%TARGET_VBS%" (
    echo ======================================================================
    echo  SUCCESS! IGRID Lab PM Dashboard is configured to auto-start on boot!
    echo.
    echo  Whenever this computer turns on or logs in, Windows will automatically:
    echo  1. Start the PM Dashboard server in the background.
    echo  2. Start the secure Cloudflare public tunnel.
    echo  3. Update PUBLIC_ACCESS_LINK.txt with the active public link.
    echo ======================================================================
    echo.
    echo Starting the background service now...
    wscript "%TARGET_VBS%"
    timeout /t 3 /nobreak >nul
    start http://localhost:3000
) else (
    echo [ERROR] Failed to write to Startup folder.
)

pause
