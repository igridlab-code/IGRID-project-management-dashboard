@echo off
title IGRID Lab Dashboard - Disable Auto-Start
echo ======================================================================
echo   IGRID Innovation Lab - Disabling Automatic Boot Startup
echo ======================================================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_VBS=%STARTUP_FOLDER%\IGRID_Lab_AutoStart.vbs"

if exist "%TARGET_VBS%" (
    del /f /q "%TARGET_VBS%"
    echo Auto-start launcher removed from Windows Startup folder.
    echo The system will no longer start automatically on computer boot.
) else (
    echo Auto-start launcher was not found in Startup folder.
)

pause
