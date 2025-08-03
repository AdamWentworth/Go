#!/usr/bin/env bash
# Installs (or replaces) a daily cron entry that runs scripts/backup-mysql.sh at 00:00 local time.

set -euo pipefail

# Resolve repo root and absolute path to the script
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
SCRIPT="${REPO_ROOT}/scripts/backup-mysql.sh"
LOG="/var/log/mysql_backups.log"

if [ ! -x "${SCRIPT}" ]; then
  echo "ERROR: ${SCRIPT} not found or not executable." >&2
  exit 1
fi

# Ensure log file exists (and is writable by your user’s cron)
sudo touch "${LOG}" && sudo chown "$(id -u)":"$(id -g)" "${LOG}"

# Escape % for crontab
CRONLINE='0 0 * * * '"${SCRIPT}"' >> '"${LOG}"' 2>&1'

# Install: keep existing crontab lines except ours, then append ours
( crontab -l 2>/dev/null | grep -v "scripts/backup-mysql.sh" ; echo "${CRONLINE}" ) | crontab -

echo "Cron installed:"
crontab -l | grep backup-mysql.sh || true
