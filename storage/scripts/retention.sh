#!/usr/bin/env bash
# Applies tiered retention to backups with names like user_pokemon_backup_YYYY-MM-DD.sql[.gz]
# Policy (same as backup.go):
#  - Daily (not 1st of month): keep 30 days
#  - Monthly (1st of month, except Jan 1): keep 12 months
#  - Yearly (Jan 1): keep 5 years

set -euo pipefail

# Defaults; override via env if you like
BACKUPS_DIR="${BACKUPS_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)/backups}"
DAILY_RETENTION_DAYS="${DAILY_RETENTION_DAYS:-30}"
MONTHLY_RETENTION_MONTHS="${MONTHLY_RETENTION_MONTHS:-12}"
YEARLY_RETENTION_YEARS="${YEARLY_RETENTION_YEARS:-5}"
DRY_RUN="${DRY_RUN:-0}"

now=$(date +%s)
nowY=$(date +%Y); nowM=$(date +%m); nowD=$(date +%d)

delete_file() {
  local f="$1"
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "DRY-RUN: would delete $f"
  else
    rm -f -- "$f" && echo "Deleted $f"
  fi
}

shopt -s nullglob
for f in "${BACKUPS_DIR}"/user_pokemon_backup_*.sql "${BACKUPS_DIR}"/user_pokemon_backup_*.sql.gz; do
  b=$(basename "$f")
  if [[ "$b" =~ user_pokemon_backup_([0-9]{4}-[0-9]{2}-[0-9]{2})\.sql(\.gz)?$ ]]; then
    ds="${BASH_REMATCH[1]}"                       # YYYY-MM-DD
    file_ts=$(date -d "$ds" +%s 2>/dev/null || true)
    [[ -n "$file_ts" ]] || { echo "WARN: skip unparsable: $b"; continue; }

    fileY=${ds:0:4}; fileM=${ds:5:2}; fileD=${ds:8:2}
    is_yearly=$([[ "$fileM" == "01" && "$fileD" == "01" ]] && echo 1 || echo 0)
    is_monthly=$([[ "$fileD" == "01" && "$is_yearly" == "0" ]] && echo 1 || echo 0)
    is_daily=$([[ "$is_yearly" == "0" && "$is_monthly" == "0" ]] && echo 1 || echo 0)

    age_days=$(( (now - file_ts) / 86400 ))
    # Age in months and years (simple calendar difference)
    age_months=$(( (10#$nowY - 10#$fileY)*12 + (10#$nowM - 10#$fileM) ))
    age_years=$(( 10#$nowY - 10#$fileY ))

    if [[ "$is_daily" == "1" && "$age_days" -gt "$DAILY_RETENTION_DAYS" ]]; then
      delete_file "$f"; continue
    fi
    if [[ "$is_monthly" == "1" && "$age_months" -gt "$MONTHLY_RETENTION_MONTHS" ]]; then
      delete_file "$f"; continue
    fi
    if [[ "$is_yearly" == "1" && "$age_years" -gt "$YEARLY_RETENTION_YEARS" ]]; then
      delete_file "$f"; continue
    fi
    echo "Keep $b"
  else
    echo "Skip (pattern mismatch): $b"
  fi
done
