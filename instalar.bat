@echo off
chcp 65001 >nul
title Lobster Assistant - Instalador
color 0A
setlocal
cd /d "%~dp0"

echo.
echo  =====================================================
echo   LOBSTER ASSISTANT - INSTALADOR
echo  =====================================================
echo.
echo  Instala todo lo necesario. Si algo ya esta, lo saltea.
echo.
pause

rem ─────────────────────────────────────────
rem  PASO 1 - Node.js
rem ─────────────────────────────────────────
echo.
echo  [1/6] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo  [X] Falta Node.js.
    echo.
    echo  Abriendo nodejs.org ... instala la version LTS y volve a ejecutar este archivo.
    start https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER%

rem ─────────────────────────────────────────
rem  PASO 2 - pnpm
rem ─────────────────────────────────────────
echo.
echo  [2/6] Preparando pnpm...
call corepack enable >nul 2>&1
call pnpm --version >nul 2>&1
if errorlevel 1 (
    echo  Instalando pnpm con npm...
    call npm install -g pnpm
    if errorlevel 1 (
        echo  [X] No se pudo instalar pnpm.
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VER=%%i
echo  [OK] pnpm %PNPM_VER%

rem ─────────────────────────────────────────
rem  PASO 3 - Dependencias
rem ─────────────────────────────────────────
echo.
echo  [3/6] Instalando dependencias (puede tardar varios minutos)...
if exist "node_modules" (
    echo  [OK] node_modules ya existe, se saltea.
) else (
    call pnpm install
    if errorlevel 1 (
        echo  [X] Fallo pnpm install. Revisa el mensaje de arriba.
        pause
        exit /b 1
    )
)

rem ─────────────────────────────────────────
rem  PASO 4 - Compilar (modo produccion)
rem ─────────────────────────────────────────
echo.
echo  [4/6] Compilando panel + API...
call pnpm build:prod
if errorlevel 1 (
    echo  [X] Fallo la compilacion.
    pause
    exit /b 1
)
echo  [OK] Compilado: el panel y el API van en un solo proceso.

rem ─────────────────────────────────────────
rem  PASO 5 - Configuracion (.env)
rem ─────────────────────────────────────────
echo.
echo  [5/6] Creando configuracion...
if exist ".env" (
    echo  [OK] .env ya existe, no se toca.
) else (
    copy ".env.example" ".env" >nul
    echo  [OK] .env creado.
    echo.
    echo  Para que la IA responda rapido necesitas una clave GRATIS:
    echo    1^) Entra a https://aistudio.google.com y crea una API key
    echo    2^) Ejecuta en esta ventana:  setx LLM_API_KEY "tu-clave"
    echo    3^) Cerra esta ventana y volve a abrir Lobster
    echo.
    echo  Sin clave tambien funciona: usa el motor local (mas lento).
)

rem ─────────────────────────────────────────
rem  PASO 6 - Motor local (opcional)
rem ─────────────────────────────────────────
echo.
echo  [6/6] Motor local (llama.cpp)...
if exist "apps\engine\llama-server.exe" (
    echo  [OK] El motor ya esta instalado.
) else (
    echo  [!] No esta el motor local. Es OPCIONAL: solo hace falta para
    echo      usar la IA sin internet. Podes instalarlo despues con instalar-motor.bat
)

echo.
echo  =====================================================
echo   LISTO
echo  =====================================================
echo.
choice /C SN /N /M "  Arrancar Lobster ahora? (S/N) "
if errorlevel 2 goto :fin
call "%~dp0arrancar-lobster.bat"
goto :eof

:fin
echo.
echo  Cuando quieras: doble clic en arrancar-lobster.bat
echo  El panel abre en http://localhost:3000
pause
