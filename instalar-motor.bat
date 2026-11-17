@echo off
chcp 65001 >nul
setlocal
title Lobster - Motor local (llama.cpp)
cd /d "%~dp0"

echo =====================================================
echo   LOBSTER - Instalador del motor local
echo   (llama.cpp, sin Ollama ni servicios externos)
echo =====================================================
echo.

set ENGINE_DIR=%~dp0apps\engine

if exist "%ENGINE_DIR%\llama-server.exe" (
  echo [OK] El motor ya esta instalado.
  goto :verify
)

echo [1/4] Verificando runtime de Visual C++...
if not exist "%SystemRoot%\System32\vcruntime140.dll" (
  echo       Falta VC++ 2015-2022. Instalando con winget...
  winget install --id Microsoft.VCRedist.2015+.x64 -e --silent --accept-package-agreements --accept-source-agreements
)

echo [2/4] Resolviendo la ultima version de llama.cpp...
for /f "delims=" %%t in ('curl -s -L --max-time 30 "https://github.com/ggml-org/llama.cpp/releases/download/v1.0.0/nightly-tag.txt"') do set TAG=%%t
if "%TAG%"=="" (
  echo [X] No pude resolver el tag. Revisa la conexion y reintenta.
  pause
  exit /b 1
)
echo       Tag: %TAG%

echo [3/4] Descargando binarios (win-cpu-x64)...
if not exist "%ENGINE_DIR%" mkdir "%ENGINE_DIR%"
set ZIP=%ENGINE_DIR%\engine.zip
set URL=https://github.com/ggml-org/llama.cpp/releases/download/%TAG%/llama-%TAG%-bin-win-cpu-x64.zip
curl -s -L --max-time 600 -o "%ZIP%" "%URL%"
if not exist "%ZIP%" (
  echo [X] Fallo la descarga.
  pause
  exit /b 1
)

echo [4/4] Extrayendo...
tar -xf "%ZIP%" -C "%ENGINE_DIR%"
del /q "%ZIP%"

:verify
echo.
echo Verificando que el motor arranque...
"%ENGINE_DIR%\llama-server.exe" --version
if errorlevel 1 (
  echo.
  echo [X] El motor no arranca. Puede faltar el runtime VC++ o tu CPU no soporta esta build.
  pause
  exit /b 1
)

echo.
echo =====================================================
echo   MOTOR LISTO
echo =====================================================
echo   Motor:   %ENGINE_DIR%\llama-server.exe
echo   Modelos: apps\.data\models  (descargalos desde el panel web)
echo   API:     http://127.0.0.1:8080/v1
echo.
pause
