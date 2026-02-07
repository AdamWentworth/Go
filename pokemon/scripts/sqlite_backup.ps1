param(
  [string]$SourcePath = "data/pokego.db",
  [string]$BackupRoot = "data/backups",
  [int]$KeepLatest = 20
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $SourcePath)) {
  throw "SQLite source file not found: $SourcePath"
}

New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$destDir = Join-Path $BackupRoot $stamp
New-Item -ItemType Directory -Force -Path $destDir | Out-Null

$baseName = [System.IO.Path]::GetFileName($SourcePath)
$sourceDir = Split-Path -Parent $SourcePath

# Backup the primary database file.
Copy-Item -Path $SourcePath -Destination (Join-Path $destDir $baseName) -Force

# If WAL mode files exist, copy them too so restore state remains consistent.
$wal = Join-Path $sourceDir ($baseName + "-wal")
$shm = Join-Path $sourceDir ($baseName + "-shm")
if (Test-Path $wal) {
  Copy-Item -Path $wal -Destination (Join-Path $destDir ($baseName + "-wal")) -Force
}
if (Test-Path $shm) {
  Copy-Item -Path $shm -Destination (Join-Path $destDir ($baseName + "-shm")) -Force
}

# Write checksum manifest for quick integrity checks.
$manifestPath = Join-Path $destDir "SHA256SUMS.txt"
Get-ChildItem -Path $destDir -File | ForEach-Object {
  $hash = Get-FileHash -Algorithm SHA256 -Path $_.FullName
  "{0}  {1}" -f $hash.Hash, $_.Name
} | Set-Content -Path $manifestPath -Encoding ASCII

Write-Host "Backup created at: $destDir"

# Retention policy: keep latest N backups.
$dirs = Get-ChildItem -Path $BackupRoot -Directory | Sort-Object Name -Descending
if ($dirs.Count -gt $KeepLatest) {
  $toDelete = $dirs | Select-Object -Skip $KeepLatest
  foreach ($d in $toDelete) {
    Remove-Item -Path $d.FullName -Recurse -Force
  }
}
