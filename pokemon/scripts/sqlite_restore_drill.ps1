param(
  [string]$BackupRoot = "data/backups",
  [string]$BackupDir = "",
  [string]$ImageRef = "adamwentworth/pokemon_data:latest",
  [int]$Port = 3801,
  [int]$ReadyTimeoutSeconds = 45
)

$ErrorActionPreference = "Stop"

if (![string]::IsNullOrWhiteSpace($BackupDir)) {
  if (!(Test-Path $BackupDir)) {
    throw "BackupDir does not exist: $BackupDir"
  }
  $selectedBackup = $BackupDir
} else {
  if (!(Test-Path $BackupRoot)) {
    throw "BackupRoot does not exist: $BackupRoot"
  }
  $latest = Get-ChildItem -Path $BackupRoot -Directory | Sort-Object Name -Descending | Select-Object -First 1
  if ($null -eq $latest) {
    throw "No backups found under: $BackupRoot"
  }
  $selectedBackup = $latest.FullName
}

$dbPath = Join-Path $selectedBackup "pokego.db"
if (!(Test-Path $dbPath)) {
  throw "Backup is missing pokego.db: $selectedBackup"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$tempDir = Join-Path $env:TEMP ("pokemon-restore-drill-" + $stamp)
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

Copy-Item -Path (Join-Path $selectedBackup "*") -Destination $tempDir -Recurse -Force

$containerName = "pokemon_restore_drill_" + $stamp
$mount = "$tempDir:/data"
$portMap = "127.0.0.1:$Port:$Port"

try {
  docker run -d --rm `
    --name $containerName `
    -e "PORT=$Port" `
    -e "SQLITE_PATH=/data/pokego.db" `
    -e "INTERNAL_ONLY_ENABLED=false" `
    -p $portMap `
    -v $mount `
    $ImageRef | Out-Null

  $deadline = (Get-Date).AddSeconds($ReadyTimeoutSeconds)
  $ready = $false
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 2
    try {
      $resp = Invoke-WebRequest -Uri ("http://127.0.0.1:{0}/readyz" -f $Port) -UseBasicParsing -TimeoutSec 5
      if ($resp.StatusCode -eq 200) {
        $ready = $true
        break
      }
    } catch {
      # keep polling until timeout
    }
  }

  if (-not $ready) {
    throw "Restore drill failed: /readyz did not return 200 within $ReadyTimeoutSeconds seconds."
  }

  Write-Host "Restore drill successful from backup: $selectedBackup"
} finally {
  docker rm -f $containerName 2>$null | Out-Null
  if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
  }
}
