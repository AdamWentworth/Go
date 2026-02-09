#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3005}"
USER_ID="${USER_ID:-}"
USERNAME="${USERNAME:-}"
ACCESS_TOKEN="${ACCESS_TOKEN:-}"

pass() { echo "[PASS] $1"; }
fail() { echo "[FAIL] $1" >&2; exit 1; }

check_2xx() {
  local name="$1"
  local url="$2"
  local headers=("${@:3}")
  local code
  code="$(curl -sS -o /tmp/users_smoke_body.txt -w "%{http_code}" "${headers[@]}" "$url" || true)"
  if [[ "$code" =~ ^2 ]]; then
    pass "$name ($code)"
  else
    echo "Response body for $name:"
    cat /tmp/users_smoke_body.txt || true
    fail "$name returned status $code"
  fi
}

echo "Running users smoke checks against ${BASE_URL}"

check_2xx "healthz" "${BASE_URL}/healthz"
check_2xx "readyz" "${BASE_URL}/readyz"
check_2xx "metrics" "${BASE_URL}/metrics"

if [[ -n "$USER_ID" && -n "$ACCESS_TOKEN" ]]; then
  check_2xx "overview canonical path" \
    "${BASE_URL}/api/users/${USER_ID}/overview?device_id=smoke-check" \
    -H "Cookie: accessToken=${ACCESS_TOKEN}"

  check_2xx "overview compatibility path" \
    "${BASE_URL}/api/${USER_ID}/overview?device_id=smoke-check" \
    -H "Cookie: accessToken=${ACCESS_TOKEN}"
else
  echo "Skipping protected overview checks (set USER_ID and ACCESS_TOKEN to enable)"
fi

if [[ -n "$USERNAME" ]]; then
  check_2xx "public snapshot canonical path" \
    "${BASE_URL}/api/public/users/${USERNAME}"

  check_2xx "public snapshot compatibility path" \
    "${BASE_URL}/api/users/public/users/${USERNAME}"
else
  echo "Skipping public snapshot checks (set USERNAME to enable)"
fi

rm -f /tmp/users_smoke_body.txt
echo "Users smoke checks completed successfully."
