@echo off
echo ===================================================
echo     Launching CampusAR Navigator WebAR System
echo ===================================================
echo.
echo Installing dependencies if needed...
python -m pip install -r backend/requirements.txt
echo.
echo Starting FastAPI server at http://127.0.0.1:8000 ...
echo Open your browser or mobile phone connected to Wi-Fi to test!
echo.
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pause
