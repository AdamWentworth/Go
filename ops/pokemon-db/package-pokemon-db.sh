#!/usr/bin/env bash
set -euo pipefail

DB_PATH="${1:-pokemon/data/pokego.db}"
OUT_DIR="${2:-dist/pokemon-db}"
VERSION="${3:-${GITHUB_SHA:-}}"

if [[ -z "${VERSION}" ]]; then
  VERSION="$(git rev-parse HEAD 2>/dev/null || date -u +%Y%m%dT%H%M%SZ)"
fi

fail() {
  echo "pokemon-db package error: $*" >&2
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

[[ -s "${DB_PATH}" ]] || fail "database is missing or empty: ${DB_PATH}"

validate_sqlite "${DB_PATH}"
command -v python3 >/dev/null 2>&1 || fail "python3 is required to write the release manifest"

mkdir -p "${OUT_DIR}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

DB_SHA256="$(sha256sum "${DB_PATH}" | awk '{print $1}')"
DB_SIZE_BYTES="$(wc -c < "${DB_PATH}" | tr -d '[:space:]')"
VERSION_SLUG="$(printf '%s' "${VERSION}" | tr -c '[:alnum:]_.-' '-')"
ARCHIVE_BASENAME="pokemon-db-${VERSION_SLUG}-${DB_SHA256:0:12}"
STAGING_DIR="${TMP_DIR}/${ARCHIVE_BASENAME}"
PACKAGE_PATH="${OUT_DIR}/${ARCHIVE_BASENAME}.tgz"
MANIFEST_PATH="${OUT_DIR}/${ARCHIVE_BASENAME}.manifest.json"
RELEASE_TAG="pokemon-db-${VERSION_SLUG}"
ARTIFACT_NAME="pokemon-db-${VERSION_SLUG}"
SOURCE_COMMIT="${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || true)}"

mkdir -p "${STAGING_DIR}"
cp "${DB_PATH}" "${STAGING_DIR}/pokego.db"

(
  cd "${STAGING_DIR}"
  sha256sum pokego.db > SHA256SUMS.txt
)

export DB_PATH DB_SHA256 DB_SIZE_BYTES SOURCE_COMMIT VERSION
export MANIFEST_TARGET="${STAGING_DIR}/manifest.json"
python3 <<'PY'
import datetime
import json
import os

created_utc = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0)
manifest = {
    "artifact": "pokemon-db",
    "database": "pokego.db",
    "source_path": os.environ["DB_PATH"],
    "source_commit": os.environ.get("SOURCE_COMMIT", ""),
    "version": os.environ["VERSION"],
    "sha256": os.environ["DB_SHA256"],
    "size_bytes": int(os.environ["DB_SIZE_BYTES"]),
    "created_utc": created_utc.isoformat().replace("+00:00", "Z"),
}

with open(os.environ["MANIFEST_TARGET"], "w", encoding="utf-8") as handle:
    json.dump(manifest, handle, indent=2, sort_keys=True)
    handle.write("\n")
PY

cp "${STAGING_DIR}/manifest.json" "${MANIFEST_PATH}"
tar -C "${TMP_DIR}" -czf "${PACKAGE_PATH}" "${ARCHIVE_BASENAME}"

echo "Packaged Pokemon DB: ${PACKAGE_PATH}"
echo "sha256: ${DB_SHA256}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "artifact_name=${ARTIFACT_NAME}"
    echo "db_sha256=${DB_SHA256}"
    echo "manifest_path=${MANIFEST_PATH}"
    echo "package_path=${PACKAGE_PATH}"
    echo "release_tag=${RELEASE_TAG}"
  } >> "${GITHUB_OUTPUT}"
fi
