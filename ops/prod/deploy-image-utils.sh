#!/usr/bin/env bash

resolve_image_ref() {
  local image_repo="$1"
  local raw_image_input="$2"
  local target_image=""

  if [[ -z "${raw_image_input}" ]]; then
    target_image="${image_repo}:latest"
  elif [[ "${raw_image_input}" == :* ]]; then
    target_image="${image_repo}${raw_image_input}"
  elif [[ "${raw_image_input}" == */* ]]; then
    target_image="${raw_image_input}"
  else
    target_image="${image_repo}:${raw_image_input}"
  fi

  if [[ "${target_image}" == */* && "${target_image}" != *:* && "${target_image}" != *@* ]]; then
    target_image="${target_image}:latest"
  fi

  printf '%s\n' "${target_image}"
}

resolve_repo_digest() {
  local image_ref="$1"
  local image_repo="$2"
  local digests=""
  local match=""

  digests="$(docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "${image_ref}" 2>/dev/null || true)"
  if [[ -z "${digests}" ]]; then
    return 0
  fi

  match="$(printf '%s\n' "${digests}" | grep -F -m1 "${image_repo}@" || true)"
  if [[ -n "${match}" ]]; then
    printf '%s\n' "${match}"
    return 0
  fi

  printf '%s\n' "${digests}" | sed -n '1p'
}

sanitize_tag_part() {
  printf '%s' "$1" | tr -c '[:alnum:]_.-' '-'
}

prepare_rollback_image() {
  local image_repo="$1"
  local label="$2"
  local container_name="$3"
  local safe_label=""

  PREVIOUS_IMAGE="$(docker inspect --format '{{.Config.Image}}' "${container_name}" 2>/dev/null || true)"
  PREVIOUS_IMAGE_ID="$(docker inspect --format '{{.Image}}' "${container_name}" 2>/dev/null || true)"
  ROLLBACK_IMAGE=""

  if [[ -z "${PREVIOUS_IMAGE}" ]]; then
    echo "No existing container image found for ${container_name}; rollback image will be unavailable."
    return 0
  fi

  echo "Previous image: ${PREVIOUS_IMAGE}"

  if [[ -z "${PREVIOUS_IMAGE_ID}" ]]; then
    return 0
  fi

  safe_label="$(sanitize_tag_part "${label}")"
  ROLLBACK_IMAGE="${image_repo}:rollback-${safe_label}-${GITHUB_RUN_ID:-manual}-${GITHUB_RUN_ATTEMPT:-1}"
  if docker tag "${PREVIOUS_IMAGE_ID}" "${ROLLBACK_IMAGE}"; then
    echo "Prepared local rollback image: ${ROLLBACK_IMAGE}"
  else
    echo "Could not tag previous image ID ${PREVIOUS_IMAGE_ID}; rollback will use ${PREVIOUS_IMAGE}." >&2
    ROLLBACK_IMAGE=""
  fi
}

select_deploy_image() {
  local target_image="$1"
  local image_repo="$2"
  local target_digest=""

  target_digest="$(resolve_repo_digest "${target_image}" "${image_repo}")"
  TARGET_DIGEST="${target_digest}"

  if [[ -n "${target_digest}" ]]; then
    DEPLOY_IMAGE="${target_digest}"
    echo "Resolved target image digest: ${DEPLOY_IMAGE}"
  else
    DEPLOY_IMAGE="${target_image}"
    echo "Target image digest unavailable; deploying tag/ref: ${DEPLOY_IMAGE}"
  fi
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

write_deploy_metadata() {
  local metadata_file="$1"
  local service_name="$2"
  local raw_image_input="$3"
  local target_image="$4"
  local target_digest="$5"
  local deploy_image="$6"
  local container_name="$7"
  local previous_image="$8"
  local previous_image_id="$9"
  local rollback_image="${10}"
  local deployed_image_id=""
  local created_utc=""

  deployed_image_id="$(docker inspect --format '{{.Image}}' "${container_name}" 2>/dev/null || true)"
  created_utc="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  mkdir -p "$(dirname "${metadata_file}")"
  if [[ -f "${metadata_file}" ]]; then
    cp -a "${metadata_file}" "${metadata_file}.previous"
  fi

  cat > "${metadata_file}" <<EOF
{
  "service": "$(json_escape "${service_name}")",
  "container": "$(json_escape "${container_name}")",
  "deployed_at_utc": "$(json_escape "${created_utc}")",
  "git_sha": "$(json_escape "${GITHUB_SHA:-}")",
  "github_run_id": "$(json_escape "${GITHUB_RUN_ID:-}")",
  "github_run_attempt": "$(json_escape "${GITHUB_RUN_ATTEMPT:-}")",
  "image_input": "$(json_escape "${raw_image_input}")",
  "target_image": "$(json_escape "${target_image}")",
  "target_digest": "$(json_escape "${target_digest}")",
  "deployed_image": "$(json_escape "${deploy_image}")",
  "deployed_image_id": "$(json_escape "${deployed_image_id}")",
  "previous_image": "$(json_escape "${previous_image}")",
  "previous_image_id": "$(json_escape "${previous_image_id}")",
  "rollback_image": "$(json_escape "${rollback_image}")"
}
EOF
  echo "Wrote deploy metadata: ${metadata_file}"
}
