@echo off
chcp 65001 >nul
setlocal
title Lobster - Produccion (un solo proceso)
cd /d "%~dp0"
set NODE_ENV=production

echo =====================================================
echo   LOBSTER - Modo produccion
echo   API + panel en un solo proceso (sin Vite ni watcher)
echo =====================================================
echo.

if not exist "apps\server\dist\index.js" goto :build
if not exist "apps\server\dist\public\index.html" goto :build
goto :run

:build
echo [1/2] Compilando (shared + panel + API)...
call pnpm --filter @lobster/shared build || goto :error
call pnpm --filter @lobster/web build || goto :error
call pnpm --filter @lobster/server build || goto :error
node scripts\preparar-produccion.mjs || goto :error
echo.

:run
echo [2/2] Arrancando en http://localhost:3000 ...
start "" http://localhost:3000
node "apps\server\dist\index.js"
goto :eof

:error
echo.
echo [X] Fallo la compilacion. Revisa el mensaje de arriba.
pause
exit /b 1
