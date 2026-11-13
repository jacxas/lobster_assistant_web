@echo off
setlocal
title Lobster Assistant
cd /d "%~dp0"
echo ============================================
echo   Lobster Assistant - arranque local
echo ============================================

rem ── 1) Ollama (IA local, puerto 11434) ──
netstat -ano | find "LISTENING" | find ":11434" >nul 2>&1
if errorlevel 1 (
  echo [1/4] Iniciando Ollama...
  start "Ollama" /min cmd /c "ollama serve"
) else (
  echo [1/4] Ollama ya esta corriendo.
)

rem ── 2) API (puerto 3000) ──
netstat -ano | find "LISTENING" | find ":3000" >nul 2>&1
if errorlevel 1 (
  echo [2/4] Iniciando API en puerto 3000...
  start "Lobster API" /min cmd /c "cd /d %~dp0apps\server && pnpm dev"
) else (
  echo [2/4] API ya esta corriendo.
)

rem ── 3) Web (puerto 5173) ──
netstat -ano | find "LISTENING" | find ":5173" >nul 2>&1
if errorlevel 1 (
  echo [3/4] Iniciando Web en puerto 5173...
  start "Lobster Web" /min cmd /c "cd /d %~dp0apps\web && pnpm dev"
) else (
  echo [3/4] Web ya esta corriendo.
)

rem ── 4) Bot (solo si esta configurado en apps\bot\.env) ──
if exist "apps\bot\.env" (
  findstr /R /C:"TELEGRAM_TOKEN=." /C:"WHATSAPP_ENABLED=true" "apps\bot\.env" >nul 2>&1
  if not errorlevel 1 (
    echo [4/4] Iniciando Bot...
    start "Lobster Bot" /min cmd /c "cd /d %~dp0apps\bot && pnpm dev"
  ) else (
    echo [4/4] Bot sin configurar: falta token o WhatsApp en apps\bot\.env
  )
) else (
  echo [4/4] Bot sin configurar: no existe apps\bot\.env
)

echo Esperando a que suban los servicios...
timeout /t 15 /nobreak >nul
start "" http://localhost:5173
echo.
echo Listo. El asistente abre en tu navegador.
echo Para pararlo, cierra las ventanas minimizadas: Ollama, Lobster API, Lobster Web y Lobster Bot (si esta configurado).
pause
