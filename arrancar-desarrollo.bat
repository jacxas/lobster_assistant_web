@echo off
chcp 65001 >nul
title Lobster - modo desarrollo
setlocal
cd /d "%~dp0"

echo  ============================================
echo    Lobster - modo desarrollo
echo    API :3000 (con recarga) + panel Vite :5173
echo  ============================================
echo.

netstat -ano | find "LISTENING" | find ":3000" >nul 2>&1
if errorlevel 1 (
    echo  [1/3] API en :3000 ...
    start "Lobster API" /min cmd /c "cd /d ""%~dp0apps\server"" && pnpm dev"
) else (
    echo  [1/3] API ya corriendo.
)

netstat -ano | find "LISTENING" | find ":5173" >nul 2>&1
if errorlevel 1 (
    echo  [2/3] Panel Vite en :5173 ...
    start "Lobster Web" /min cmd /c "cd /d ""%~dp0apps\web"" && pnpm dev"
) else (
    echo  [2/3] Panel ya corriendo.
)

if exist "apps\bot\.env" (
    echo  [3/3] Bot (si tiene token) ...
    start "Lobster Bot" /min cmd /c "cd /d ""%~dp0apps\bot"" && node index.js"
) else (
    echo  [3/3] Bot no configurado.
)

echo.
timeout /t 20 /nobreak >nul
start "" http://localhost:5173
pause
