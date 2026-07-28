#!/usr/bin/env bash

set -euo pipefail

env_file="${1:-/srv/pokegonexus/authentication/.env}"
callback_url="${2:-https://pokegonexus.com/api/auth/google/callback}"

if [[ ! -f "$env_file" ]]; then
  printf 'Auth environment file not found: %s\n' "$env_file" >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  printf 'openssl is required to generate the OAuth state secret.\n' >&2
  exit 1
fi

printf 'Configuring Google OAuth in %s\n' "$env_file"
read -r -p 'Google OAuth client ID: ' client_id
read -r -s -p 'Google OAuth client secret (input hidden): ' client_secret
printf '\n'

if [[ ! "$client_id" =~ \.apps\.googleusercontent\.com$ ]]; then
  printf 'The client ID does not look like a Google OAuth web client ID.\n' >&2
  exit 1
fi

if [[ -z "$client_secret" ]]; then
  printf 'The client secret cannot be empty.\n' >&2
  exit 1
fi

oauth_state_secret="$(openssl rand -hex 32)"
backup="${env_file}.bak.$(date -u +%Y%m%dT%H%M%SZ)"
temp_file="$(mktemp "${env_file}.tmp.XXXXXX")"
trap 'rm -f "$temp_file"' EXIT

cp -a "$env_file" "$backup"

awk '
  !/^GOOGLE_CLIENT_ID=/ &&
  !/^GOOGLE_CLIENT_SECRET=/ &&
  !/^GOOGLE_CALLBACK_URL=/ &&
  !/^OAUTH_STATE_SECRET=/
' "$env_file" >"$temp_file"

{
  printf '\nGOOGLE_CLIENT_ID=%s\n' "$client_id"
  printf 'GOOGLE_CLIENT_SECRET=%s\n' "$client_secret"
  printf 'GOOGLE_CALLBACK_URL=%s\n' "$callback_url"
  printf 'OAUTH_STATE_SECRET=%s\n' "$oauth_state_secret"
} >>"$temp_file"

chown --reference="$env_file" "$temp_file"
chmod --reference="$env_file" "$temp_file"
mv "$temp_file" "$env_file"
trap - EXIT

unset client_secret oauth_state_secret

printf 'Google OAuth settings installed.\n'
printf 'Callback URL: %s\n' "$callback_url"
printf 'Backup: %s\n' "$backup"
printf 'The auth service has not been restarted or deployed yet.\n'
