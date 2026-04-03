#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="frontend_nginx"
STATE_FILE="/tmp/certbot-frontend-nginx.was-running"

if docker inspect -f '{{.State.Running}}' "${CONTAINER_NAME}" 2>/dev/null | grep -qx 'true'; then
  printf 'yes\n' > "${STATE_FILE}"
  docker stop "${CONTAINER_NAME}" >/dev/null
else
  rm -f "${STATE_FILE}"
fi
