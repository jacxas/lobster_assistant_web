@echo off
chcp 65001 >nul
title Lobster Assistant - Instalador
color 0A

echo.
echo  =====================================================
echo   LOBSTER ASSISTANT - INSTALADOR AUTOMATICO (monorepo)
echo  =====================================================
echo.
echo  Este script verifica e instala todo lo necesario.
echo  Si algo ya esta instalado, lo saltea automaticamente.
echo.
pause

:: ─────────────────────────────────────────
:: PASO 1 - Verificar Git
:: ─────────────────────────────────────────
echo.
echo  [1/5] Verificando Git...
git --version >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VER=%%i
    echo  [OK] Git ya esta instalado: %GIT_VER%
) else (
    echo  [X] Git NO esta instalado.
    echo.
    echo  Abriendo la pagina de descarga de Git...
    start https://git-scm.com/download/win
    echo.
    echo  Descarga e instala Git, luego CIERRA y vuelve a abrir este archivo.
    echo.
    pause
    exit /b 1
)

:: ─────────────────────────────────────────
:: PASO 2 - Verificar Node.js
:: ─────────────────────────────────────────
echo.
echo  [2/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo  [OK] Node.js ya esta instalado: %NODE_VER%
) else (
    echo  [X] Node.js NO esta instalado.
    echo.
    echo  Abriendo la pagina de descarga de Node.js...
    start https://nodejs.org
    echo.
    echo  Descarga e instala Node.js LTS, luego CIERRA y vuelve a abrir este archivo.
    echo.
    pause
    exit /b 1
)

:: ─────────────────────────────────────────
:: PASO 3 - Verificar Ollama
:: ─────────────────────────────────────────
echo.
echo  [3/5] Verificando Ollama...
ollama --version >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=*" %%i in ('ollama --version') do set OLLAMA_VER=%%i
    echo  [OK] Ollama ya esta instalado: %OLLAMA_VER%
) else (
    echo  [!] Ollama NO esta instalado (opcional para la web, requerido para la IA local).
    echo.
    echo  Abriendo la pagina de descarga de Ollama...
    start https://ollama.ai/download
    echo.
    echo  Podes continuar sin Ollama y instalarlo despues.
    echo.
)

:: ─────────────────────────────────────────
:: PASO 4 - Instalar dependencias del proyecto (pnpm)
:: ─────────────────────────────────────────
echo.
echo  [4/5] Preparando pnpm e instalando dependencias...

if not exist "package.json" (
    echo  [X] No se encuentra package.json
    echo     Asegurate de ejecutar este archivo DENTRO de la carpeta del repositorio.
    echo     Ejemplo: cd lobster_assistant_web
    pause
    exit /b 1
)

corepack enable >nul 2>&1

if exist "node_modules" (
    echo  [OK] node_modules ya existe, saltando pnpm install...
) else (
    echo  Instalando modulos con pnpm...
    call pnpm install
    if %errorlevel% neq 0 (
        echo  [X] Error durante pnpm install. Revisa el mensaje de arriba.
        pause
        exit /b 1
    )
    echo  [OK] Dependencias instaladas correctamente.
)

:: ─────────────────────────────────────────
:: PASO 5 - Compilar paquetes
:: ─────────────────────────────────────────
echo.
echo  [5/5] Compilando paquetes (shared, web, server)...
call pnpm -r build
if %errorlevel% neq 0 (
    echo  [X] Error durante el build. Revisa el mensaje de arriba.
    pause
    exit /b 1
)

:: ─────────────────────────────────────────
:: LISTO
:: ─────────────────────────────────────────
echo.
echo  =====================================================
echo   TODO INSTALADO CORRECTAMENTE
echo  =====================================================
echo.
echo  Comandos utiles (desde esta carpeta):
echo.
echo     pnpm setup      (primera vez: configurar los bots)
echo     pnpm dev:web    (web en http://localhost:5173)
echo     pnpm dev:server (API en http://localhost:3000)
echo     pnpm dev:bot    (bots: Telegram/Discord/WhatsApp/Slack)
echo.
pause
