#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT="${1:-/home/adam/deploy/Go}"
TARGET_ROOT="${2:-/srv/pokegonexus}"

if [[ ! -d "${SOURCE_ROOT}" ]]; then
  echo "Source deploy root not found: ${SOURCE_ROOT}" >&2
  exit 1
fi

mkdir -p "${TARGET_ROOT}"

copy_file_if_missing() {
  local src="$1"
  local dest="$2"

  if [[ ! -f "${src}" ]]; then
    echo "skip missing file: ${src}"
    return 0
  fi

  mkdir -p "$(dirname "${dest}")"
  if [[ -e "${dest}" ]]; then
    echo "keep existing file: ${dest}"
    return 0
  fi

  cp -a "${src}" "${dest}"
  echo "copied file: ${src} -> ${dest}"
}

copy_dir_if_missing() {
  local src="$1"
  local dest="$2"

  if [[ ! -d "${src}" ]]; then
    echo "skip missing dir: ${src}"
    return 0
  fi

  mkdir -p "$(dirname "${dest}")"
  if [[ -e "${dest}" ]]; then
    echo "keep existing dir: ${dest}"
    return 0
  fi

  cp -a "${src}" "${dest}"
  echo "copied dir: ${src} -> ${dest}"
}

service_env_paths=(
  "authentication/.env"
  "reader/events/.env"
  "reader/users/.env"
  "reader/search/.env"
  "receiver/.env"
  "location/.env"
  "storage/.env"
  "pokemon/.env"
  "monitoring/.env"
)

for path in "${service_env_paths[@]}"; do
  copy_file_if_missing "${SOURCE_ROOT}/${path}" "${TARGET_ROOT}/${path}"
done

copy_dir_if_missing "${SOURCE_ROOT}/authentication/backups" "${TARGET_ROOT}/authentication/backups"
copy_dir_if_missing "${SOURCE_ROOT}/storage/backups" "${TARGET_ROOT}/storage/backups"
copy_dir_if_missing "${SOURCE_ROOT}/pokemon/data" "${TARGET_ROOT}/pokemon/data"
copy_dir_if_missing "${SOURCE_ROOT}/kafka/data" "${TARGET_ROOT}/kafka/data"
copy_dir_if_missing "${SOURCE_ROOT}/monitoring/data" "${TARGET_ROOT}/monitoring/data"
copy_dir_if_missing "${SOURCE_ROOT}/monitoring/alertmanager-data" "${TARGET_ROOT}/monitoring/alertmanager-data"

# Legacy Pokemon data path used before the Go service layout.
if [[ ! -f "${TARGET_ROOT}/pokemon/data/pokego.db" && -f "${SOURCE_ROOT}/pokemon_data/data/pokego.db" ]]; then
  mkdir -p "${TARGET_ROOT}/pokemon/data"
  cp -a "${SOURCE_ROOT}/pokemon_data/data/pokego.db"* "${TARGET_ROOT}/pokemon/data/" 2>/dev/null || true
  echo "seeded Pokemon DB from legacy pokemon_data/data"
fi

copy_dir_if_missing "${SOURCE_ROOT}/location/init-sql" "${TARGET_ROOT}/location/init-sql"

if [[ -f "${SOURCE_ROOT}/reader/users/app.log" ]]; then
  copy_file_if_missing "${SOURCE_ROOT}/reader/users/app.log" "${TARGET_ROOT}/reader/users/app.log"
else
  mkdir -p "${TARGET_ROOT}/reader/users"
  : > "${TARGET_ROOT}/reader/users/app.log"
fi

for dir in \
  "authentication/backups" \
  "storage/backups" \
  "pokemon/data" \
  "kafka/data" \
  "monitoring/data" \
  "monitoring/alertmanager-data"
do
  mkdir -p "${TARGET_ROOT}/${dir}"
done

if [[ -f "${SOURCE_ROOT}/pokemon/data/pokego.db" && -f "${TARGET_ROOT}/pokemon/data/pokego.db" ]]; then
  source_hash="$(sha256sum "${SOURCE_ROOT}/pokemon/data/pokego.db" | awk '{print $1}')"
  target_hash="$(sha256sum "${TARGET_ROOT}/pokemon/data/pokego.db" | awk '{print $1}')"
  if [[ "${source_hash}" != "${target_hash}" ]]; then
    echo "Pokemon DB checksum mismatch after copy." >&2
    echo "source: ${source_hash}  ${SOURCE_ROOT}/pokemon/data/pokego.db" >&2
    echo "target: ${target_hash}  ${TARGET_ROOT}/pokemon/data/pokego.db" >&2
    exit 1
  fi
  echo "${target_hash}  pokemon/data/pokego.db" > "${TARGET_ROOT}/pokemon/data/pokego.db.sha256"
  echo "Pokemon DB checksum verified: ${target_hash}"
fi

echo
echo "Deploy state migration complete."
echo "Source: ${SOURCE_ROOT}"
echo "Target: ${TARGET_ROOT}"
echo
echo "Next: run a manual deploy with deploy_root=${TARGET_ROOT}"
