# Arma Lobster portable: runtime Node + API compilada + dependencias + motor.
# Resultado: una carpeta que se abre con Lobster.exe, sin instalar Node.
#
# Uso: powershell -ExecutionPolicy Bypass -File scripts\empaquetar-portable.ps1 -Destino "C:\ruta\lobster-portable-v1.0.0.zip"
param(
  [string]$Destino = (Join-Path $PSScriptRoot "..\..\lobster-portable-v1.0.0.zip")
)

$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$stage = Join-Path $env:TEMP ("lobster-portable-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
$app = Join-Path $stage "Lobster"
$srv = Join-Path $app "apps\server"

Write-Host "[1/7] Compilando el proyecto (panel + API)..."
Push-Location $repo
& pnpm build:prod
if ($LASTEXITCODE -ne 0) { throw "falló build:prod" }
Pop-Location

Write-Host "[2/7] Estructura base"
New-Item -ItemType Directory -Force -Path $app, (Join-Path $app "runtime"), (Join-Path $app "logs"), $srv | Out-Null

Write-Host "[3/7] Dependencias de producción (planas, sin symlinks)"
$pkg = @{
  name = "lobster-server"; version = "1.0.0"; type = "module"; private = $true
  dependencies = @{
    "better-sqlite3" = "12.11.1"; "cookie-parser" = "^1.4.7"; "cors" = "^2.8.5"
    "dotenv" = "^16.4.5"; "express" = "^4.21.2"; "playwright-core" = "^1.65.1"; "zod" = "^4.1.12"
  }
} | ConvertTo-Json -Depth 4
[IO.File]::WriteAllText((Join-Path $srv "package.json"), $pkg, (New-Object Text.UTF8Encoding($false)))
Push-Location $srv
& npm install --omit=dev --no-audit --no-fund --loglevel=error
if ($LASTEXITCODE -ne 0) { throw "falló npm install" }
Pop-Location

Write-Host "[4/7] Código compilado + paquete interno @lobster/shared"
Copy-Item (Join-Path $repo "apps\server\dist") (Join-Path $srv "dist") -Recurse -Force
$sharedDst = Join-Path $srv "node_modules\@lobster\shared"
New-Item -ItemType Directory -Force -Path $sharedDst | Out-Null
Copy-Item (Join-Path $repo "packages\shared\dist") (Join-Path $sharedDst "dist") -Recurse -Force
Copy-Item (Join-Path $repo "packages\shared\package.json") (Join-Path $sharedDst "package.json") -Force

Write-Host "[5/7] Motor local (sin binarios de herramientas que no se usan)"
$engDst = Join-Path $app "apps\engine"
New-Item -ItemType Directory -Force -Path $engDst | Out-Null
Get-ChildItem (Join-Path $repo "apps\engine") -File | Where-Object {
  $_.Name -eq "llama-server.exe" -or $_.Extension -eq ".dll"
} | Copy-Item -Destination $engDst -Force
New-Item -ItemType Directory -Force -Path (Join-Path $app "apps\.data") | Out-Null

Write-Host "[6/7] Runtime Node + lanzador"
Copy-Item (Get-Command node).Source (Join-Path $app "runtime\node.exe") -Force
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) { throw "no se encontró csc.exe (necesario para compilar Lobster.exe)" }
& $csc /nologo /target:winexe /codepage:65001 /out:"$app\Lobster.exe" `
  /reference:System.Windows.Forms.dll /reference:System.Drawing.dll `
  (Join-Path $repo "portable\LobsterLauncher.cs")
if ($LASTEXITCODE -ne 0) { throw "falló la compilación del lanzador" }

Write-Host "[7/7] Extras y compresión"
Copy-Item (Join-Path $repo "portable\LEEME.txt") $app -Force -ErrorAction SilentlyContinue
if (Test-Path $Destino) { Remove-Item $Destino -Force }
Compress-Archive -Path (Join-Path $app "*") -DestinationPath $Destino -CompressionLevel Optimal
Remove-Item $stage -Recurse -Force

$mb = [math]::Round((Get-Item $Destino).Length / 1MB, 1)
Write-Host "Listo: $Destino ($mb MB)"
