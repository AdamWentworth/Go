#!/usr/bin/env bash
set -euo pipefail

editor_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_root="$(cd "${editor_dir}/.." && pwd)"
prod_host="${POKEGO_EDITOR_PROD_HOST:-}"
ssh_key="${POKEGO_EDITOR_SSH_KEY:-}"
deploy_root="${POKEGO_EDITOR_DEPLOY_ROOT:-/srv/pokegonexus}"
publisher_env="${POKEGO_EDITOR_PUBLISHER_ENV:-${deploy_root}/pokemon/catalog-publisher.env}"
local_port="${POKEGO_EDITOR_POSTGRES_PORT:-5433}"
python_bin="${PYTHON_BIN:-${editor_dir}/.venv/bin/python}"

fail() {
  echo "production editor error: $*" >&2
  exit 1
}

[[ -n "${prod_host}" ]] || fail "set POKEGO_EDITOR_PROD_HOST, for example adam@192.168.1.77"
[[ -x "${python_bin}" ]] || fail "Python executable is missing: ${python_bin}. Create editor/.venv first."
[[ -f "${repo_root}/ops/pokemon-catalog/refresh-api-cache-prod.sh" ]] || fail "catalog cache refresh script is missing"
[[ -f "${repo_root}/ops/pokemon-catalog/backup-editor-session-prod.sh" ]] || fail "catalog editor backup script is missing"

ssh_args=(-o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3)
if [[ -n "${ssh_key}" ]]; then
  [[ -f "${ssh_key}" ]] || fail "SSH key is missing: ${ssh_key}"
  ssh_args+=(-i "${ssh_key}")
fi

# Make a retained PostgreSQL dump before exposing the editor to the live
# publisher role. A failed backup means there is no safe direct-edit session.
ssh "${ssh_args[@]}" "${prod_host}" "bash -s -- $(printf '%q' "${deploy_root}")" \
  < "${repo_root}/ops/pokemon-catalog/backup-editor-session-prod.sh"

remote_source_command="set -a; . $(printf '%q' "${publisher_env}"); printf '%s' \"\$CATALOG_PUBLISHER_DATABASE_URL\""
database_url="$(ssh "${ssh_args[@]}" "${prod_host}" "${remote_source_command}")"
[[ "${database_url}" == postgres://* || "${database_url}" == postgresql://* ]] || fail "publisher environment did not provide a PostgreSQL URL"

ssh -N "${ssh_args[@]}" \
  -L "127.0.0.1:${local_port}:127.0.0.1:5433" \
  "${prod_host}" &
tunnel_pid=$!

cleanup() {
  local status="$?"
  trap - EXIT INT TERM
  if [[ -n "${tunnel_pid:-}" ]]; then
    kill "${tunnel_pid}" >/dev/null 2>&1 || true
    wait "${tunnel_pid}" 2>/dev/null || true
  fi
  unset POKEGO_EDITOR_DATABASE_URL POKEGO_EDITOR_DATABASE_LABEL
  exit "${status}"
}
trap cleanup EXIT INT TERM

sleep 1
kill -0 "${tunnel_pid}" >/dev/null 2>&1 || fail "SSH tunnel failed to start"

export POKEGO_EDITOR_DATABASE_URL="${database_url}"
export POKEGO_EDITOR_DATABASE_LABEL="PRODUCTION PostgreSQL catalog"
"${python_bin}" "${editor_dir}/main.py"

# Normal editor exits are the authoritative save boundary. Refresh the API
# cache over SSH without ever printing the catalog or cache credentials.
ssh "${ssh_args[@]}" "${prod_host}" "bash -s -- $(printf '%q' "${deploy_root}")" \
  < "${repo_root}/ops/pokemon-catalog/refresh-api-cache-prod.sh"
