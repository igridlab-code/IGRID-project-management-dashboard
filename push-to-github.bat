@echo off
title IGRID Lab Dashboard - Push to GitHub
color 0B
cls
echo ======================================================================
echo           IGRID LAB - PUSH PROJECT TO GITHUB REPOSITORY
echo ======================================================================
echo.
echo  Target: https://github.com/igridlab-code
echo.

git branch -M main
git add .
set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG="update: IGRID Innovation Lab project dashboard"

git commit -m "%COMMIT_MSG%"

echo.
echo Pushing to GitHub (igridlab-code)...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ======================================================================
    echo  SUCCESS! Project successfully published to GitHub!
    echo ======================================================================
) else (
    echo.
    echo [NOTE] If you haven't created the repository on GitHub yet:
    echo 1. Go to: https://github.com/new
    echo 2. Repository Name: IGRID-project-management-dashboard
    echo 3. Keep it Public and do NOT initialize with README/license
    echo 4. Click 'Create repository' and run this script again!
)

pause
