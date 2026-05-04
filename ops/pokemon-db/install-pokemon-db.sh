#!/usr/bin/env bash
set -euo pipefail

PACKAGE_PATH="${1:?Usage: install-pokemon-db.sh PACKAGE_PATH [DEPLOY_ROOT] [COMPOSE_FILE] [TARGET_IMAGE] [SERVICE_NAME]}"
DEPLOY_ROOT="${2:-/home/adam/deploy/Go}"
COMPOSE_FILE="${3:-pokemon/docker-compose.yml}"
TARGET_IMAGE="${4:-}"
SERVICE_NAME="${5:-pokemon_data}"

POKEMON_DEPLOY_DIR="${DEPLOY_ROOT}/pokemon"
ENV_FILE="${POKEMON_DEPLOY_DIR}/.env"
DATA_DIR="${POKEMON_DEPLOY_DIR}/data"
DB_FILE="pokego.db"
CONTAINER_NAME="${CONTAINER_NAME:-pokemon_data_container}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-pokemon}"
EDGE_NETWORK="${EDGE_NETWORK:-pokemon_edge}"
EDGE_SUBNET="${EDGE_SUBNET:-172.30.0.0/24}"
EDGE_GATEWAY="${EDGE_GATEWAY:-172.30.0.1}"
DEFAULT_IMAGE="adamwentworth/pokemon_service_go:latest"
ALPINE_IMAGE="alpine:3.23"

TMP_DIR=""
BACKUP_NAME=""
PREVIOUS_IMAGE=""
ROLLBACK_NEEDED=0

fail() {
  echo "pokemon-db install error: $*" >&2
  exit 1
}

validate_sqlite() {
  local db_path="$1"

  if command -v python3 >/dev/null 2>&1; then
    python3 - "$db_path" <<'PY'
import pathlib
import sqlite3
import sys

db_path = pathlib.Path(sys.argv[1]).resolve()
conn = sqlite3.connect(f"file:{db_path.as_posix()}?mode=ro", uri=True)
try:
    integrity = conn.execute("PRAGMA integrity_check").fetchone()[0]
    if integrity != "ok":
        raise SystemExit(f"integrity_check failed: {integrity}")
    table_count = conn.execute(
        "SELECT count(*) FROM sqlite_master WHERE type = 'table'"
    ).fetchone()[0]
    if table_count == 0:
        raise SystemExit("database has no tables")
finally:
    conn.close()
PY
    return
  fi

  if command -v sqlite3 >/dev/null 2>&1; then
    local integrity
    integrity="$(sqlite3 "$db_path" 'PRAGMA integrity_check;')"
    [[ "${integrity}" == "ok" ]] || fail "integrity_check failed: ${integrity}"
    return
  fi

  fail "python3 or sqlite3 is required to validate ${db_path}"
}

compose_up() {
  local image_ref="$1"
  POKEMON_IMAGE="${image_ref}" docker compose \
    --project-directory "${POKEMON_DEPLOY_DIR}" \
    -f "${COMPOSE_FILE}" \
    --env-file "${ENV_FILE}" \
    up -d --no-deps --force-recreate --no-build "${SERVICE_NAME}"
}

restore_db_backup() {
  [[ -n "${BACKUP_NAME}" ]] || return 0

  docker run --rm \
    -v "${DATA_DIR}:/data" \
    -e BACKUP_NAME="${BACKUP_NAME}" \
    -e DB_FILE="${DB_FILE}" \
    "${ALPINE_IMAGE}" \
    sh -ec '
      backup="/data/backups/${BACKUP_NAME}"
      if [ -f "${backup}/${DB_FILE}" ]; then
        echo "Restoring previous Pokemon DB from ${backup}"
        rm -f "/data/${DB_FILE}" "/data/${DB_FILE}-wal" "/data/${DB_FILE}-shm"
        rm -f "/data/${DB_FILE}.sha256" "/data/${DB_FILE}.release.json"
        cp -a "${backup}/${DB_FILE}" "/data/${DB_FILE}"
        [ -f "${backup}/${DB_FILE}-wal" ] && cp -a "${backup}/${DB_FILE}-wal" "/data/${DB_FILE}-wal"
        [ -f "${backup}/${DB_FILE}-shm" ] && cp -a "${backup}/${DB_FILE}-shm" "/data/${DB_FILE}-shm"
        [ -f "${backup}/${DB_FILE}.sha256" ] && cp -a "${backup}/${DB_FILE}.sha256" "/data/${DB_FILE}.sha256"
        [ -f "${backup}/${DB_FILE}.release.json" ] && cp -a "${backup}/${DB_FILE}.release.json" "/data/${DB_FILE}.release.json"
        [ -f "/data/${DB_FILE}.sha256" ] || sha256sum "/data/${DB_FILE}" > "/data/${DB_FILE}.sha256"
      fi
    '
}

rollback() {
  local code="$1"
  set +e

  if [[ "${ROLLBACK_NEEDED}" -eq 1 ]]; then
    echo "Rolling back Pokemon DB deployment."
    docker stop "${CONTAINER_NAME}" >/dev/null 2>&1 || true
    restore_db_backup

    local rollback_image="${PREVIOUS_IMAGE:-${DEFAULT_IMAGE}}"
    if [[ -n "${rollback_image}" ]]; then
      compose_up "${rollback_image}" || true
    fi
  fi

  [[ -n "${TMP_DIR}" ]] && rm -rf "${TMP_DIR}"
  exit "${code}"
}

trap 'rollback $?' EXIT

[[ -f "${PACKAGE_PATH}" ]] || fail "package not found: ${PACKAGE_PATH}"
[[ -f "${COMPOSE_FILE}" ]] || fail "compose file not found: ${COMPOSE_FILE}"
[[ -f "${ENV_FILE}" ]] || fail "env file not found: ${ENV_FILE}"

TMP_DIR="$(mktemp -d)"
EXTRACT_DIR="${TMP_DIR}/extract"
mkdir -p "${EXTRACT_DIR}"
tar -xzf "${PACKAGE_PATH}" -C "${EXTRACT_DIR}"

NEW_DB_PATH="$(find "${EXTRACT_DIR}" -type f -name "${DB_FILE}" -print -quit)"
CHECKSUM_PATH="$(find "${EXTRACT_DIR}" -type f -name SHA256SUMS.txt -print -quit)"
MANIFEST_PATH="$(find "${EXTRACT_DIR}" -type f -name manifest.json -print -quit)"

[[ -n "${NEW_DB_PATH}" ]] || fail "package does not contain ${DB_FILE}"
[[ -n "${CHECKSUM_PATH}" ]] || fail "package does not contain SHA256SUMS.txt"

(
  cd "$(dirname "${CHECKSUM_PATH}")"
  sha256sum -c SHA256SUMS.txt
)

validate_sqlite "${NEW_DB_PATH}"

mkdir -p "${POKEMON_DEPLOY_DIR}"
mkdir -p "${DATA_DIR}" 2>/dev/null || true

if ! docker network inspect "${EDGE_NETWORK}" >/dev/null 2>&1; then
  echo "External docker network ${EDGE_NETWORK} not found; creating it now."
  docker network create \
    --driver bridge \
    --subnet "${EDGE_SUBNET}" \
    --gateway "${EDGE_GATEWAY}" \
    "${EDGE_NETWORK}"
fi

NETWORK_SUBNET="$(docker network inspect -f '{{(index .IPAM.Config 0).Subnet}}' "${EDGE_NETWORK}")"
[[ "${NETWORK_SUBNET}" == "${EDGE_SUBNET}" ]] || fail "network ${EDGE_NETWORK} subnet is ${NETWORK_SUBNET}; expected ${EDGE_SUBNET}"

PREVIOUS_IMAGE="$(docker inspect --format '{{.Config.Image}}' "${CONTAINER_NAME}" 2>/dev/null || true)"
if [[ -z "${TARGET_IMAGE}" ]]; then
  TARGET_IMAGE="${PREVIOUS_IMAGE:-${DEFAULT_IMAGE}}"
fi

echo "Target Pokemon image: ${TARGET_IMAGE}"
docker pull "${TARGET_IMAGE}"
docker pull "${ALPINE_IMAGE}" >/dev/null

POKEMON_IMAGE="${TARGET_IMAGE}" docker compose \
  --project-directory "${POKEMON_DEPLOY_DIR}" \
  -f "${COMPOSE_FILE}" \
  --env-file "${ENV_FILE}" \
  config >/dev/null

APP_UID="$(docker run --rm --entrypoint /bin/sh "${TARGET_IMAGE}" -c 'id -u app 2>/dev/null || id -u')"
APP_GID="$(docker run --rm --entrypoint /bin/sh "${TARGET_IMAGE}" -c 'id -g app 2>/dev/null || id -g')"

if docker inspect "${CONTAINER_NAME}" >/dev/null 2>&1; then
  echo "Stopping ${CONTAINER_NAME} before replacing ${DB_FILE}."
  docker stop "${CONTAINER_NAME}" >/dev/null
fi

ROLLBACK_NEEDED=1
BACKUP_NAME="pokemon-db-$(date -u +%Y%m%dT%H%M%SZ)"
NEW_DB_DIR="$(dirname "${NEW_DB_PATH}")"
NEW_DB_BASENAME="$(basename "${NEW_DB_PATH}")"
MANIFEST_DIR="${NEW_DB_DIR}"
MANIFEST_BASENAME=""
if [[ -n "${MANIFEST_PATH}" ]]; then
  MANIFEST_DIR="$(dirname "${MANIFEST_PATH}")"
  MANIFEST_BASENAME="$(basename "${MANIFEST_PATH}")"
fi

docker run --rm \
  -v "${DATA_DIR}:/data" \
  -v "${NEW_DB_DIR}:/release:ro" \
  -v "${MANIFEST_DIR}:/manifest:ro" \
  -e BACKUP_NAME="${BACKUP_NAME}" \
  -e DB_FILE="${DB_FILE}" \
  -e MANIFEST_BASENAME="${MANIFEST_BASENAME}" \
  -e NEW_DB_BASENAME="${NEW_DB_BASENAME}" \
  -e RUN_ID="$$" \
  "${ALPINE_IMAGE}" \
  sh -ec '
    backup="/data/backups/${BACKUP_NAME}"
    mkdir -p "${backup}"

    if [ -f "/data/${DB_FILE}" ]; then
      cp -a "/data/${DB_FILE}" "${backup}/${DB_FILE}"
      [ -f "/data/${DB_FILE}-wal" ] && cp -a "/data/${DB_FILE}-wal" "${backup}/${DB_FILE}-wal"
      [ -f "/data/${DB_FILE}-shm" ] && cp -a "/data/${DB_FILE}-shm" "${backup}/${DB_FILE}-shm"
      [ -f "/data/${DB_FILE}.sha256" ] && cp -a "/data/${DB_FILE}.sha256" "${backup}/${DB_FILE}.sha256"
      [ -f "/data/${DB_FILE}.release.json" ] && cp -a "/data/${DB_FILE}.release.json" "${backup}/${DB_FILE}.release.json"
      sha256sum "${backup}/${DB_FILE}" > "${backup}/SHA256SUMS.previous.txt"
    else
      echo "No previous /data/${DB_FILE} exists; rollback will only restore the previous image."
    fi

    install_tmp="/data/.${DB_FILE}.${RUN_ID}.tmp"
    cp "/release/${NEW_DB_BASENAME}" "${install_tmp}"
    chmod 664 "${install_tmp}"
    if [ -f "/data/${DB_FILE}" ]; then
      owner="$(stat -c "%u:%g" "/data/${DB_FILE}" 2>/dev/null || true)"
      [ -n "${owner}" ] && chown "${owner}" "${install_tmp}" || true
    fi

    rm -f "/data/${DB_FILE}-wal" "/data/${DB_FILE}-shm"
    mv "${install_tmp}" "/data/${DB_FILE}"
    sha256sum "/data/${DB_FILE}" > "/data/${DB_FILE}.sha256"
    if [ -n "${MANIFEST_BASENAME}" ] && [ -f "/manifest/${MANIFEST_BASENAME}" ]; then
      cp "/manifest/${MANIFEST_BASENAME}" "/data/${DB_FILE}.release.json"
    fi
  '

docker run --rm -v "${DATA_DIR}:/data" "${ALPINE_IMAGE}" sh -ec "
  chown -R ${APP_UID}:${APP_GID} /data || true
  find /data -type d -exec chmod 775 {} +
  find /data -type f -exec chmod 664 {} +
"

EXISTING_PROJECT="$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' "${CONTAINER_NAME}" 2>/dev/null || true)"
if [[ -n "${EXISTING_PROJECT}" && "${EXISTING_PROJECT}" != "${COMPOSE_PROJECT_NAME}" ]]; then
  echo "Removing existing ${CONTAINER_NAME} from compose project ${EXISTING_PROJECT} before deploy."
  docker rm -f "${CONTAINER_NAME}"
fi

compose_up "${TARGET_IMAGE}"

CONTAINER_IP="$(docker inspect -f '{{with index .NetworkSettings.Networks "pokemon_edge"}}{{.IPAddress}}{{end}}' "${CONTAINER_NAME}" 2>/dev/null || true)"
[[ -n "${CONTAINER_IP}" ]] || fail "failed to determine ${CONTAINER_NAME} IP on pokemon_edge"

echo "Waiting for /readyz on ${CONTAINER_IP}:3001"
HEALTH_OK=0
for _ in $(seq 1 30); do
  if curl -fsS --max-time 2 "http://${CONTAINER_IP}:3001/readyz" >/dev/null 2>&1; then
    HEALTH_OK=1
    break
  fi
  sleep 2
done

if [[ "${HEALTH_OK}" -ne 1 ]]; then
  echo "Pokemon DB deployment failed readiness checks." >&2
  docker ps -a --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" || true
  docker logs --tail 200 "${CONTAINER_NAME}" || true
  fail "readiness check failed"
fi

ROLLBACK_NEEDED=0
rm -rf "${TMP_DIR}"
TMP_DIR=""
echo "Pokemon DB deployment succeeded."
