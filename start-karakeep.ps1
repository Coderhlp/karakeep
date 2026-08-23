$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$workspace = Split-Path -Parent $root
$nodeVersion = "v22.23.2"
$nodeDir = Join-Path $workspace ".tools\node-$nodeVersion-win-x64"
$nodeZip = "$nodeDir.zip"
$nodeExe = Join-Path $nodeDir "node.exe"

if (!(Test-Path $nodeExe)) {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $nodeDir) | Out-Null
  if (!(Test-Path $nodeZip)) {
    Write-Host "Downloading Node.js $nodeVersion..."
    Invoke-WebRequest "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-win-x64.zip" -OutFile $nodeZip
  }
  Write-Host "Extracting Node.js..."
  Expand-Archive -Force $nodeZip (Split-Path -Parent $nodeDir)
}

$env:PATH = "$nodeDir;$env:PATH"
$env:DATA_DIR = if ($env:DATA_DIR) { $env:DATA_DIR } else { Join-Path $workspace "karakeep-data" }
$env:NEXTAUTH_URL = if ($env:NEXTAUTH_URL) { $env:NEXTAUTH_URL } else { "http://localhost:3000" }
$env:NEXTAUTH_SECRET = if ($env:NEXTAUTH_SECRET) { $env:NEXTAUTH_SECRET } else { "local-dev-secret-karakeep" }
$env:NO_COLOR = "false"
$env:SEMANTIC_SEARCH_ENABLED = "false"
$env:INFERENCE_ENABLE_AUTO_TAGGING = "false"
$env:CRAWLER_DOWNLOAD_BANNER_IMAGE = "false"
$env:CRAWLER_STORE_SCREENSHOT = "false"

New-Item -ItemType Directory -Force -Path $env:DATA_DIR | Out-Null

Write-Host "Using Node: $(& node -v)"
corepack enable
corepack prepare pnpm@11.2.1 --activate

Write-Host "Installing dependencies..."
pnpm install --frozen-lockfile --ignore-scripts

$betterSqliteNative = Join-Path $root "node_modules\better-sqlite3\build\Release\better_sqlite3.node"
if (Test-Path $betterSqliteNative) {
  Write-Host "better-sqlite3 is already prepared."
} else {
  Write-Host "Preparing better-sqlite3..."
  Push-Location (Join-Path $root "node_modules\better-sqlite3")
  npm run install
  Pop-Location
}

Write-Host "Running database migrations..."
pnpm run db:migrate

$logDir = Join-Path $root ".karakeep-runtime"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$webLog = Join-Path $logDir "web.out.log"
$webErrorLog = Join-Path $logDir "web.err.log"
$workersLog = Join-Path $logDir "workers.out.log"
$workersErrorLog = Join-Path $logDir "workers.err.log"

$commonArgs = @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-Command"
)
$powerShellExe = [System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName

$webCommand = "Set-Location '$root'; `$env:PATH='$nodeDir;' + `$env:PATH; `$env:DATA_DIR='$($env:DATA_DIR)'; `$env:NEXTAUTH_URL='$($env:NEXTAUTH_URL)'; `$env:NEXTAUTH_SECRET='$($env:NEXTAUTH_SECRET)'; `$env:NO_COLOR='false'; `$env:SEMANTIC_SEARCH_ENABLED='false'; `$env:INFERENCE_ENABLE_AUTO_TAGGING='false'; `$env:CRAWLER_DOWNLOAD_BANNER_IMAGE='false'; `$env:CRAWLER_STORE_SCREENSHOT='false'; pnpm web"
$workersCommand = "Set-Location '$root'; `$env:PATH='$nodeDir;' + `$env:PATH; `$env:DATA_DIR='$($env:DATA_DIR)'; `$env:NEXTAUTH_URL='$($env:NEXTAUTH_URL)'; `$env:NEXTAUTH_SECRET='$($env:NEXTAUTH_SECRET)'; `$env:NO_COLOR='false'; `$env:SEMANTIC_SEARCH_ENABLED='false'; `$env:INFERENCE_ENABLE_AUTO_TAGGING='false'; `$env:CRAWLER_DOWNLOAD_BANNER_IMAGE='false'; `$env:CRAWLER_STORE_SCREENSHOT='false'; pnpm workers"

Write-Host "Starting Karakeep..."
$web = Start-Process $powerShellExe -ArgumentList ($commonArgs + $webCommand) -RedirectStandardOutput $webLog -RedirectStandardError $webErrorLog -WindowStyle Hidden -PassThru
$workers = Start-Process $powerShellExe -ArgumentList ($commonArgs + $workersCommand) -RedirectStandardOutput $workersLog -RedirectStandardError $workersErrorLog -WindowStyle Hidden -PassThru

try {
  for ($i = 0; $i -lt 60; $i++) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing "http://localhost:3000" -TimeoutSec 2
      if ($response.StatusCode -lt 500) {
        Write-Host "Karakeep is running: http://localhost:3000"
        Start-Process "http://localhost:3000"
        break
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  Write-Host "Web log: $webLog"
  Write-Host "Web error log: $webErrorLog"
  Write-Host "Workers log: $workersLog"
  Write-Host "Workers error log: $workersErrorLog"
  Write-Host "Keep this window open. Press Ctrl+C to stop Karakeep."
  Wait-Process -Id $web.Id, $workers.Id
} finally {
  Stop-Process -Id $web.Id, $workers.Id -Force -ErrorAction SilentlyContinue
}
