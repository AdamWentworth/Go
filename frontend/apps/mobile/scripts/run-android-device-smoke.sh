#!/usr/bin/env bash
set -euo pipefail

user_home="$(getent passwd "$(id -u)" | cut -d: -f6)"
android_sdk_root="${ANDROID_SDK_ROOT:-${user_home}/Android/Sdk}"
java_home="${JAVA_HOME:-${user_home}/.local/share/pokegonexus-android/jdk}"
maestro_bin="${MAESTRO_BIN:-${user_home}/.maestro/bin/maestro}"
expo_go_apk="${POKEGONEXUS_EXPO_GO_APK:-${user_home}/.local/share/pokegonexus-android/downloads/Expo-Go-57.0.9.apk}"
avd_name="${POKEGONEXUS_ANDROID_AVD:-PokeGoNexus_Pixel_8_Pro_API_36}"
adb_bin="${android_sdk_root}/platform-tools/adb"
emulator_bin="${android_sdk_root}/emulator/emulator"
artifact_dir="$(mktemp -d /tmp/pokegonexus-android-smoke.XXXXXX)"
color_scheme="${POKEGONEXUS_SMOKE_COLOR_SCHEME:-light}"
smoke_flow="${POKEGONEXUS_SMOKE_FLOW:-.maestro/native-collection-smoke.yaml}"
smoke_density="${POKEGONEXUS_SMOKE_DENSITY:-520}"
smoke_font_scale="${POKEGONEXUS_SMOKE_FONT_SCALE:-1.0}"
smoke_reduce_motion="${POKEGONEXUS_SMOKE_REDUCE_MOTION:-false}"
metro_pid=""
metro_pgid=""
fixture_pid=""
fixture_pgid=""
device_id=""
original_density_override=""
density_changed="false"
original_font_scale=""
original_window_animation_scale=""
original_transition_animation_scale=""
original_animator_duration_scale=""
accessibility_settings_changed="false"

cleanup() {
  if [[ -n "${metro_pgid}" ]]; then
    kill -- "-${metro_pgid}" 2>/dev/null || true
    for _attempt in $(seq 1 20); do
      if ! kill -0 -- "-${metro_pgid}" 2>/dev/null; then
        break
      fi
      sleep 0.1
    done
    kill -KILL -- "-${metro_pgid}" 2>/dev/null || true
  elif [[ -n "${metro_pid}" ]] && kill -0 "${metro_pid}" 2>/dev/null; then
    kill "${metro_pid}" 2>/dev/null || true
  fi
  if [[ -n "${fixture_pgid}" ]]; then
    kill -- "-${fixture_pgid}" 2>/dev/null || true
    kill -KILL -- "-${fixture_pgid}" 2>/dev/null || true
  elif [[ -n "${fixture_pid}" ]] && kill -0 "${fixture_pid}" 2>/dev/null; then
    kill "${fixture_pid}" 2>/dev/null || true
  fi
  if [[ "${density_changed}" == "true" && -n "${device_id}" ]]; then
    if [[ -n "${original_density_override}" ]]; then
      "${adb_bin}" -s "${device_id}" shell wm density "${original_density_override}" >/dev/null 2>&1 || true
    else
      "${adb_bin}" -s "${device_id}" shell wm density reset >/dev/null 2>&1 || true
    fi
  fi
  if [[ "${accessibility_settings_changed}" == "true" && -n "${device_id}" ]]; then
    "${adb_bin}" -s "${device_id}" shell settings put system font_scale "${original_font_scale:-1.0}" >/dev/null 2>&1 || true
    "${adb_bin}" -s "${device_id}" shell settings put global window_animation_scale "${original_window_animation_scale:-1}" >/dev/null 2>&1 || true
    "${adb_bin}" -s "${device_id}" shell settings put global transition_animation_scale "${original_transition_animation_scale:-1}" >/dev/null 2>&1 || true
    "${adb_bin}" -s "${device_id}" shell settings put global animator_duration_scale "${original_animator_duration_scale:-1}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

for required in "${adb_bin}" "${emulator_bin}" "${java_home}/bin/java" "${maestro_bin}" "${expo_go_apk}"; do
  if [[ ! -e "${required}" ]]; then
    echo "Missing Android smoke dependency: ${required}" >&2
    exit 1
  fi
done
for required_command in curl python3 setsid; do
  if ! command -v "${required_command}" >/dev/null 2>&1; then
    echo "Missing Android smoke command: ${required_command}" >&2
    exit 1
  fi
done

export ANDROID_HOME="${android_sdk_root}"
export ANDROID_SDK_ROOT="${android_sdk_root}"
export JAVA_HOME="${java_home}"
export PATH="${java_home}/bin:${android_sdk_root}/platform-tools:${PATH}"
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

device_id="$(${adb_bin} devices | awk '/^emulator-[0-9]+[[:space:]]+device/ { print $1; exit }')"
if [[ -z "${device_id}" ]]; then
  nohup "${emulator_bin}" \
    -avd "${avd_name}" \
    -no-snapshot-load \
    -no-boot-anim \
    -no-audio \
    -no-metrics \
    -gpu auto \
    -netdelay none \
    -netspeed full \
    >"${artifact_dir}/emulator.log" 2>&1 &
  "${adb_bin}" wait-for-device
  device_id="$(${adb_bin} devices | awk '/^emulator-[0-9]+[[:space:]]+device/ { print $1; exit }')"
fi

for _attempt in $(seq 1 120); do
  if [[ "$("${adb_bin}" -s "${device_id}" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; then
    break
  fi
  sleep 1
done
if [[ "$("${adb_bin}" -s "${device_id}" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]]; then
  echo "Android emulator did not finish booting." >&2
  exit 1
fi

# The AVD's physical Pixel 8 Pro density produces a 448dp-wide window, while
# the agreed collection reference is the roughly 412dp Pixel viewport used by
# the web parity suite and the real-device review. Normalize the density for
# deterministic screenshots and restore the developer's prior override when
# the smoke exits.
original_density_override="$(
  "${adb_bin}" -s "${device_id}" shell wm density \
    | tr -d '\r' \
    | awk -F': ' '/Override density/ { print $2; exit }'
)"
"${adb_bin}" -s "${device_id}" shell wm density "${smoke_density}" >/dev/null
density_changed="true"

original_font_scale="$("${adb_bin}" -s "${device_id}" shell settings get system font_scale | tr -d '\r')"
original_window_animation_scale="$("${adb_bin}" -s "${device_id}" shell settings get global window_animation_scale | tr -d '\r')"
original_transition_animation_scale="$("${adb_bin}" -s "${device_id}" shell settings get global transition_animation_scale | tr -d '\r')"
original_animator_duration_scale="$("${adb_bin}" -s "${device_id}" shell settings get global animator_duration_scale | tr -d '\r')"
accessibility_settings_changed="true"
"${adb_bin}" -s "${device_id}" shell settings put system font_scale "${smoke_font_scale}" >/dev/null
case "${smoke_reduce_motion}" in
  true)
    "${adb_bin}" -s "${device_id}" shell settings put global window_animation_scale 0 >/dev/null
    "${adb_bin}" -s "${device_id}" shell settings put global transition_animation_scale 0 >/dev/null
    "${adb_bin}" -s "${device_id}" shell settings put global animator_duration_scale 0 >/dev/null
    ;;
  false)
    ;;
  *)
    echo "Unsupported POKEGONEXUS_SMOKE_REDUCE_MOTION: ${smoke_reduce_motion} (expected true or false)." >&2
    exit 1
    ;;
esac

if ! "${adb_bin}" -s "${device_id}" shell pm list packages | grep -q '^package:host.exp.exponent$'; then
  "${adb_bin}" -s "${device_id}" install -r "${expo_go_apk}"
fi

if curl --silent --fail --max-time 1 http://127.0.0.1:8091/status >/dev/null 2>&1; then
  echo "Android smoke port 8091 is already in use; stop that Metro server and retry." >&2
  exit 1
fi
if curl --silent --fail --max-time 1 http://127.0.0.1:8092/pokemons.json >/dev/null 2>&1; then
  echo "Android smoke fixture port 8092 is already in use; stop that server and retry." >&2
  exit 1
fi

fixture_directory="$(cd ../../packages/app-core/tests/__helpers__/fixtures && pwd)"
setsid python3 -m http.server 8092 \
  --bind 127.0.0.1 \
  --directory "${fixture_directory}" >"${artifact_dir}/fixture-server.log" 2>&1 &
fixture_pid="$!"
fixture_pgid="${fixture_pid}"
for _attempt in $(seq 1 30); do
  if curl --silent --fail --max-time 1 http://127.0.0.1:8092/pokemons.json >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "${fixture_pid}" 2>/dev/null; then
    echo "Catalog fixture server exited before the device smoke could start." >&2
    cat "${artifact_dir}/fixture-server.log" >&2
    exit 1
  fi
  sleep 0.2
done
if ! curl --silent --fail --max-time 1 http://127.0.0.1:8092/pokemons.json >/dev/null 2>&1; then
  echo "Catalog fixture server did not become ready." >&2
  cat "${artifact_dir}/fixture-server.log" >&2
  exit 1
fi

case "${color_scheme}" in
  light)
    "${adb_bin}" -s "${device_id}" shell cmd uimode night no >/dev/null
    ;;
  dark)
    "${adb_bin}" -s "${device_id}" shell cmd uimode night yes >/dev/null
    ;;
  *)
    echo "Unsupported POKEGONEXUS_SMOKE_COLOR_SCHEME: ${color_scheme} (expected light or dark)." >&2
    exit 1
    ;;
esac
setsid env \
  EXPO_PUBLIC_MOBILE_EXPERIENCE=native-preview \
  EXPO_PUBLIC_DEVICE_SMOKE_MODE=true \
  EXPO_PUBLIC_DEVICE_SMOKE_COLOR_SCHEME="${color_scheme}" \
  CI=1 \
  npx expo start --host localhost --port 8091 >"${artifact_dir}/metro.log" 2>&1 &
metro_pid="$!"
metro_pgid="${metro_pid}"

for _attempt in $(seq 1 90); do
  if curl --silent --fail http://127.0.0.1:8091/status | grep -q 'packager-status:running'; then
    break
  fi
  if ! kill -0 "${metro_pid}" 2>/dev/null; then
    echo "Metro exited before the device smoke could start." >&2
    tail -80 "${artifact_dir}/metro.log" >&2
    exit 1
  fi
  sleep 1
done
if ! curl --silent --fail --max-time 1 http://127.0.0.1:8091/status | grep -q 'packager-status:running'; then
  echo "Metro did not become ready for the Android smoke." >&2
  tail -80 "${artifact_dir}/metro.log" >&2
  exit 1
fi

run_maestro_flow() {
  local flow="$1"
  local output_name="$2"
  # Expo Router deliberately preserves mounted route state. A directory run
  # must therefore restart Expo Go between flows so each smoke validates a
  # fresh user session rather than inheriting the preceding flow's modal,
  # selected tag, or draft edits.
  "${adb_bin}" -s "${device_id}" shell am force-stop host.exp.exponent
  # Expo Go occasionally relaunches before Android has fully torn down the
  # preceding React host. Give the process boundary time to settle so an
  # infrastructure splash/error screen cannot masquerade as an app failure.
  sleep 1
  "${maestro_bin}" --device "${device_id}" test \
    --no-ansi \
    --test-output-dir "${artifact_dir}/maestro/${output_name}" \
    "${flow}"
}

if [[ -d "${smoke_flow}" ]]; then
  mapfile -t smoke_flows < <(find "${smoke_flow}" -maxdepth 1 -type f -name '*.yaml' | sort)
  failed_flows=()
  for flow in "${smoke_flows[@]}"; do
    flow_name="$(basename "${flow}" .yaml)"
    echo "Running isolated device smoke: ${flow_name}"
    if ! run_maestro_flow "${flow}" "${flow_name}"; then
      echo "Retrying isolated device smoke once after a clean Expo Go restart: ${flow_name}"
      if ! run_maestro_flow "${flow}" "${flow_name}-retry"; then
        failed_flows+=("${flow_name}")
      fi
    fi
  done
  if (( ${#failed_flows[@]} > 0 )); then
    echo "Android device smoke failures: ${failed_flows[*]}" >&2
    echo "Artifacts: ${artifact_dir}" >&2
    exit 1
  fi
else
  run_maestro_flow "${smoke_flow}" "$(basename "${smoke_flow}" .yaml)"
fi

"${adb_bin}" -s "${device_id}" exec-out screencap -p >"${artifact_dir}/final-screen.png"
echo "Android device smoke passed. Artifacts: ${artifact_dir}"
