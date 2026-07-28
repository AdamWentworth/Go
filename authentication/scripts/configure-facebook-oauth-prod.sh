#!/usr/bin/env bash

set -euo pipefail

env_file="${1:-/srv/pokegonexus/authentication/.env}"
callback_url="${2:-https://pokegonexus.com/api/auth/facebook/callback}"

if [[ ! -f "$env_file" ]]; then
  printf 'Auth environment file not found: %s\n' "$env_file" >&2
  exit 1
fi

printf 'Configuring Facebook OAuth in %s\n' "$env_file"
read -r -p 'Facebook App ID: ' client_id
read -r -s -p 'Facebook App Secret (input hidden): ' client_secret
printf '\n'

if [[ ! "$client_id" =~ ^[0-9]+$ ]]; then
  printf 'The App ID must contain only digits.\n' >&2
  exit 1
fi

if [[ -z "$client_secret" ]]; then
  printf 'The App Secret cannot be empty.\n' >&2
  exit 1
fi

backup="${env_file}.bak.$(date -u +%Y%m%dT%H%M%SZ)"
temp_file="$(mktemp "${env_file}.tmp.XXXXXX")"
trap 'rm -f "$temp_file"' EXIT

cp -a "$env_file" "$backup"

awk '
  !/^FACEBOOK_CLIENT_ID=/ &&
  !/^FACEBOOK_CLIENT_SECRET=/ &&
  !/^FACEBOOK_CALLBACK_URL=/
' "$env_file" >"$temp_file"

{
  printf '\nFACEBOOK_CLIENT_ID=%s\n' "$client_id"
  printf 'FACEBOOK_CLIENT_SECRET=%s\n' "$client_secret"
  printf 'FACEBOOK_CALLBACK_URL=%s\n' "$callback_url"
} >>"$temp_file"

chown --reference="$env_file" "$temp_file"
chmod --reference="$env_file" "$temp_file"
mv "$temp_file" "$env_file"
trap - EXIT

unset client_secret

printf 'Facebook OAuth settings installed.\n'
printf 'Callback URL: %s\n' "$callback_url"
printf 'Backup: %s\n' "$backup"
printf 'The auth service has not been restarted or deployed yet.\n'
