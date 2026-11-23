@echo off
chcp 65001 >nul
title Lobster Assistant
setlocal
cd /d "%~dp0"

echo  ============================================
echo    Lobster Assistant
echo  ============================================
echo.

if not exist "apps\server\dist\index.js" (
    echo  [X] Todavia no esta compilado.
    echo      Ejecuta primero: instalar.bat
    echo.
    pause
    exit /b 1
)

rem ── 1) Panel + API en un solo proceso (puerto 3000) ──
netstat -ano | find "LISTENING" | find ":3000" >nul 2>&1
if errorlevel 1 (
    echo  [1/2] Iniciando Lobster en http://localhost:3000 ...
    start "Lobster" /min cmd /c "cd /d ""%~dp0"" && set NODE_ENV=production && node apps\server\dist\index.js"
) else (
    echo  [1/2] Ya estaba corriendo en el puerto 3000.
)

rem ── 2) Bot de Telegram (solo si hay token) ──
if exist "apps\bot\.env" (
    findstr /R /C:"TELEGRAM_TOKEN=[0-9]" "apps\bot\.env" >nul 2>&1
    if not errorlevel 1 (
        netstat -ano | find "LISTENING" >nul 2>&1
        echo  [2/2] Iniciando bot de Telegram...
        start "Lobster Bot" /min cmd /c "cd /d ""%~dp0apps\bot"" && node index.js"
    ) else (
        echo  [2/2] Bot sin token configurado (opcional).
    )
) else (
    echo  [2/2] Bot no configurado (opcional).
)

echo.
echo  Esperando que levante...
timeout /t 6 /nobreak >nul
start "" http://localhost:3000

echo.
echo  Listo. El panel esta en http://localhost:3000
echo  Para apagarlo: cerra las ventanas minimizadas "Lobster" (y "Lobster Bot").
echo.
pause
