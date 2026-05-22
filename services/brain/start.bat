@echo off
cd /d "%~dp0"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8765" ^| findstr LISTENING') do (
  echo.
  echo  [!] Le port 8765 est deja utilise ^(PID %%a^).
  echo      Une ancienne instance MrXBrain tourne peut-etre encore.
  echo.
  choice /C KO /M "Arreter ce processus et relancer"
  if errorlevel 2 exit /b 1
  taskkill /PID %%a /F >nul 2>&1
  timeout /t 2 /nobreak >nul
  goto :run
)

:run
python start.py
pause
