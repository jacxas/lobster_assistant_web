# Empaqueta Lobster v1 en un ZIP listo para distribuir.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\empaquetar.ps1 -Destino "C:\ruta\lobster-v1.0.0.zip"
param(
  [string]$Destino = (Join-Path $PSScriptRoot "..\lobster-v1.0.0.zip"),
  [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$stage = Join-Path $env:TEMP ("lobster-stage-" + [guid]::NewGuid().ToString("N").Substring(0, 8))

# Carpetas y archivos que NO van al ZIP.
$excludeDirs = @("node_modules", ".git", ".data", "dist", ".turbo", ".vercel", ".next", "coverage")
$excludeFiles = @(".env", ".env.local", "*.gguf", "*.zip", "*.log")

Write-Host "[1/4] Copiando $repo -> $stage"
New-Item -ItemType Directory -Force -Path $stage | Out-Null

# Copia selectiva: se omiten carpetas pesadas, modelos, logs y cualquier .env.
$patronDirs = '(^|\\)(node_modules|\.git|\.data|dist|\.turbo|\.vercel|\.next|coverage)(\\|$)'
$omitidos = 0
$copiados = 0
Get-ChildItem -Path $repo -Recurse -File -Force -ErrorAction SilentlyContinue | ForEach-Object {
  $rel = $_.FullName.Substring($repo.Length).TrimStart('\')
  if ($rel -match $patronDirs) { $script:omitidos++; return }
  if ($_.Name -eq ".env" -or $_.Name -eq ".env.local") { $script:omitidos++; return }
  if ($_.Extension -in @(".gguf", ".zip", ".log")) { $script:omitidos++; return }
  $destinoArchivo = Join-Path $stage $rel
  $carpeta = Split-Path $destinoArchivo -Parent
  if (-not (Test-Path $carpeta)) { New-Item -ItemType Directory -Force -Path $carpeta | Out-Null }
  try {
    Copy-Item -Path $_.FullName -Destination $destinoArchivo -Force -ErrorAction Stop
    $script:copiados++
  } catch {
    Write-Host "   ! no se pudo copiar $rel"
  }
}
Write-Host "     $copiados archivos copiados, $omitidos omitidos"

# Verificación de seguridad: ningún .env con secretos debe quedar en el paquete.
Write-Host "[2/4] Verificando que no viajen secretos..."
$fugas = Get-ChildItem -Path $stage -Recurse -Force -Filter ".env" -ErrorAction SilentlyContinue
if ($fugas) {
  $fugas | ForEach-Object { Write-Host "  quitando $($_.FullName.Replace($stage,''))" ; Remove-Item $_.FullName -Force }
}
$tokens = Get-ChildItem -Path $stage -Recurse -File -Include "*.bat","*.json","*.md","*.ts" -ErrorAction SilentlyContinue |
  Select-String -Pattern "AAGgXgEN1m8|AAEwaThrKxSD|cblRvNdC8E|ghp_[A-Za-z0-9]{20}|github_pat_[A-Za-z0-9_]{20}|AIzaSy[A-Za-z0-9_-]{20}" -List |
  Where-Object {
    # El motor de permisos y su test CONTIENEN los patrones de deteccion de
    # secretos: no son credenciales reales.
    $_.Path -notmatch 'permissions\.test?\.ts$' -and $_.Path -notmatch 'permissions\.ts$'
  }
if ($tokens) {
  Write-Host "  [X] Se encontraron credenciales en:"
  $tokens | ForEach-Object { Write-Host "     $($_.Path.Replace($stage,''))" }
  throw "Abortado: hay credenciales en el paquete"
}

# Marca de versión dentro del paquete.
$marca = Join-Path $stage "VERSION.txt"
@"
Lobster Assistant v$Version
Empaquetado: $(Get-Date -Format "yyyy-MM-dd HH:mm")
Contenido: codigo fuente + instaladores .bat + documentacion.
Requiere Node.js 20+ (el instalador lo verifica).
Arranque: instalar.bat y despues arrancar-lobster.bat
"@ | Set-Content -Path $marca -Encoding UTF8

Write-Host "[3/4] Comprimiendo..."
if (Test-Path $Destino) { Remove-Item $Destino -Force }
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $Destino -CompressionLevel Optimal
Remove-Item $stage -Recurse -Force

$zip = Get-Item $Destino
$mb = [math]::Round($zip.Length / 1MB, 2)
Write-Host "[4/4] Listo: $($zip.FullName) ($mb MB)"
