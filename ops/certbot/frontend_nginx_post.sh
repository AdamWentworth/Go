#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="frontend_nginx"
STATE_FILE="/tmp/certbot-frontend-nginx.was-running"

if [[ -f "${STATE_FILE}" ]]; then
  docker start "${CONTAINER_NAME}" >/dev/null
  rm -f "${STATE_FILE}"
fi
