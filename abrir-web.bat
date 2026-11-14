@echo off
cd /d "%~dp0"
netstat -ano | find "LISTENING" | find ":5173" >nul 2>&1
if errorlevel 1 (
  echo Iniciando panel web de Lobster...
  start "Lobster Web" /min cmd /c "cd /d %~dp0apps\web && pnpm dev"
  timeout /t 12 /nobreak >nul
) else (
  echo El panel ya esta corriendo.
)
start "" http://localhost:5173
