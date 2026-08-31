#!/usr/bin/env bash
set -euo pipefail

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mobile_directory="$(cd "${script_directory}/.." && pwd)"
cd "${mobile_directory}"

user_home="$(getent passwd "$(id -u)" | cut -d: -f6)"
android_sdk_root="${ANDROID_SDK_ROOT:-${user_home}/Android/Sdk}"
java_home="${JAVA_HOME:-${user_home}/.local/share/pokegonexus-android/jdk}"
maestro_bin="${MAESTRO_BIN:-${user_home}/.maestro/bin/maestro}"
avd_name="${POKEGONEXUS_ANDROID_AVD:-PokeGoNexus_Pixel_8_Pro_API_36}"
app_id="${POKEGONEXUS_ANDROID_APP_ID:-com.pokegonexus.app}"
app_scheme="${POKEGONEXUS_ANDROID_APP_SCHEME:-pokegonexus}"
dev_client_url="${app_scheme}://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8091"
provided_android_apk="${POKEGONEXUS_ANDROID_APK:-${POKEGONEXUS_DEV_CLIENT_APK:-}}"
adb_bin="${android_sdk_root}/platform-tools/adb"
emulator_bin="${android_sdk_root}/emulator/emulator"
artifact_dir="$(mktemp -d /tmp/pokegonexus-android-smoke.XXXXXX)"
color_scheme="${POKEGONEXUS_SMOKE_COLOR_SCHEME:-light}"
smoke_flow="${POKEGONEXUS_SMOKE_FLOW:-.maestro/native-collection-smoke.yaml}"
smoke_density="${POKEGONEXUS_SMOKE_DENSITY:-520}"
smoke_font_scale="${POKEGONEXUS_SMOKE_FONT_SCALE:-1.0}"
smoke_reduce_motion="${POKEGONEXUS_SMOKE_REDUCE_MOTION:-false}"
smoke_memory_mb="${POKEGONEXUS_SMOKE_MEMORY_MB:-2048}"
smoke_runtime="${POKEGONEXUS_SMOKE_RUNTIME:-dev-client}"
smoke_network="${POKEGONEXUS_SMOKE_NETWORK:-online}"
smoke_navigation_mode="${POKEGONEXUS_SMOKE_NAVIGATION_MODE:-system}"
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
network_settings_changed="false"
original_airplane_mode=""
original_navigation_overlay=""
navigation_overlay_changed="false"

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
  if [[ "${network_settings_changed}" == "true" && -n "${device_id}" ]]; then
    if [[ "${original_airplane_mode}" == "enabled" ]]; then
      "${adb_bin}" -s "${device_id}" shell cmd connectivity airplane-mode enable >/dev/null 2>&1 || true
    else
      "${adb_bin}" -s "${device_id}" shell cmd connectivity airplane-mode disable >/dev/null 2>&1 || true
    fi
  fi
  if [[ "${navigation_overlay_changed}" == "true" && -n "${device_id}" && -n "${original_navigation_overlay}" ]]; then
    "${adb_bin}" -s "${device_id}" shell cmd overlay enable-exclusive \
      --category "${original_navigation_overlay}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

for required in "${adb_bin}" "${emulator_bin}" "${java_home}/bin/java" "${maestro_bin}"; do
  if [[ ! -e "${required}" ]]; then
    echo "Missing Android smoke dependency: ${required}" >&2
    exit 1
  fi
done
for required_command in curl nice npx python3 setsid; do
  if ! command -v "${required_command}" >/dev/null 2>&1; then
    echo "Missing Android smoke command: ${required_command}" >&2
    exit 1
  fi
done
if [[ ! "${smoke_memory_mb}" =~ ^[0-9]+$ ]] || (( smoke_memory_mb < 1536 )); then
  echo "POKEGONEXUS_SMOKE_MEMORY_MB must be an integer of at least 1536." >&2
  exit 1
fi

export ANDROID_HOME="${android_sdk_root}"
export ANDROID_SDK_ROOT="${android_sdk_root}"
export JAVA_HOME="${java_home}"
export PATH="${java_home}/bin:${android_sdk_root}/platform-tools:${PATH}"
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

case "${smoke_runtime}" in
  dev-client|standalone) ;;
  *)
    echo "Unsupported POKEGONEXUS_SMOKE_RUNTIME: ${smoke_runtime} (expected dev-client or standalone)." >&2
    exit 1
    ;;
esac
case "${smoke_network}" in
  online|offline) ;;
  *)
    echo "Unsupported POKEGONEXUS_SMOKE_NETWORK: ${smoke_network} (expected online or offline)." >&2
    exit 1
    ;;
esac
case "${smoke_navigation_mode}" in
  system|gesture|three-button) ;;
  *)
    echo "Unsupported POKEGONEXUS_SMOKE_NAVIGATION_MODE: ${smoke_navigation_mode} (expected system, gesture, or three-button)." >&2
    exit 1
    ;;
esac
if [[ "${smoke_runtime}" == "dev-client" && "${smoke_network}" == "offline" ]]; then
  echo "Offline process-relaunch smoke requires the standalone runtime." >&2
  exit 1
fi

# Reject flow definitions that can escape into Expo Go or target a stale
# package. Native-module parity evidence is valid only when every route remains
# inside the installed project-owned application.
if grep -R -n -E 'exp://|host\.exp\.exponent' "${smoke_flow}"; then
  echo "Android smoke flow contains an Expo Go route or package id: ${smoke_flow}" >&2
  exit 1
fi
if [[ -d "${smoke_flow}" ]]; then
  mapfile -t contract_flows < <(find -L "${smoke_flow}" -maxdepth 1 -type f -name '*.yaml' | sort)
else
  contract_flows=("${smoke_flow}")
fi
for contract_flow in "${contract_flows[@]}"; do
  if ! grep -Fqx 'appId: ${APP_ID}' "${contract_flow}"; then
    echo "Android smoke flow must target the injected project app id: ${contract_flow}" >&2
    exit 1
  fi
done

if [[ -n "${provided_android_apk}" ]]; then
  android_apk="${provided_android_apk}"
  if [[ ! -f "${android_apk}" ]]; then
    echo "Provided Android APK does not exist: ${android_apk}" >&2
    exit 1
  fi
else
  active_build_emulator="$(${adb_bin} devices | awk '/^emulator-[0-9]+[[:space:]]+device/ { print $1; exit }')"
  if [[ -n "${active_build_emulator}" ]]; then
    echo "Refusing to run Gradle while Android emulator ${active_build_emulator} is active." >&2
    echo "Stop the emulator first, or pass POKEGONEXUS_ANDROID_APK to reuse an already-built APK." >&2
    exit 1
  fi
  if [[ "${smoke_runtime}" == "standalone" ]]; then
    node_environment="production"
    gradle_task="app:assembleRelease"
    apk_variant="release"
  else
    node_environment="development"
    gradle_task="app:assembleDebug"
    apk_variant="debug"
  fi
  echo "Synchronizing the Android native project and ${smoke_runtime} APK."
  if ! env \
    NODE_ENV="${node_environment}" \
    EXPO_PUBLIC_MOBILE_EXPERIENCE=native-preview \
    EXPO_PUBLIC_DEVICE_SMOKE_MODE=true \
    EXPO_PUBLIC_DEVICE_SMOKE_COLOR_SCHEME="${color_scheme}" \
    CI=1 \
    nice -n 10 npx expo prebuild --platform android --no-install \
      >"${artifact_dir}/expo-prebuild.log" 2>&1; then
    echo "Expo prebuild failed. Last output:" >&2
    tail -120 "${artifact_dir}/expo-prebuild.log" >&2
    exit 1
  fi
  if ! env \
    NODE_ENV="${node_environment}" \
    EXPO_PUBLIC_MOBILE_EXPERIENCE=native-preview \
    EXPO_PUBLIC_DEVICE_SMOKE_MODE=true \
    EXPO_PUBLIC_DEVICE_SMOKE_COLOR_SCHEME="${color_scheme}" \
    CI=1 \
    nice -n 10 ./android/gradlew -p android "${gradle_task}" \
      -PreactNativeArchitectures=x86_64 \
      --no-daemon \
      --max-workers=2 \
      >"${artifact_dir}/gradle-build.log" 2>&1; then
    echo "Android build failed. Last output:" >&2
    tail -160 "${artifact_dir}/gradle-build.log" >&2
    exit 1
  fi
  android_apk="${mobile_directory}/android/app/build/outputs/apk/${apk_variant}/app-${apk_variant}.apk"
fi
if [[ ! -f "${android_apk}" ]]; then
  echo "Android APK was not produced: ${android_apk}" >&2
  exit 1
fi

device_id="$(${adb_bin} devices | awk '/^emulator-[0-9]+[[:space:]]+device/ { print $1; exit }')"
if [[ -z "${device_id}" ]]; then
  nohup "${emulator_bin}" \
    -avd "${avd_name}" \
    -memory "${smoke_memory_mb}" \
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

# Exercise the system-window geometry that matters for the target phone. The
# default AVD uses three-button navigation, which cannot reproduce leaks around
# Android's bottom gesture handle. Preserve and restore the developer's active
# overlay when a smoke explicitly selects a navigation mode.
original_navigation_overlay="$(
  "${adb_bin}" -s "${device_id}" shell cmd overlay list \
    | tr -d '\r' \
    | awk '/^\[x\] com\.android\.internal\.systemui\.navbar\./ { print $2; exit }'
)"
if [[ "${smoke_navigation_mode}" != "system" ]]; then
  if [[ "${smoke_navigation_mode}" == "gesture" ]]; then
    navigation_overlay="com.android.internal.systemui.navbar.gestural"
  else
    navigation_overlay="com.android.internal.systemui.navbar.threebutton"
  fi
  if ! "${adb_bin}" -s "${device_id}" shell cmd overlay list \
    | grep -Fq "${navigation_overlay}"; then
    echo "Android emulator does not expose the requested navigation overlay: ${navigation_overlay}" >&2
    exit 1
  fi
  if [[ "${original_navigation_overlay}" != "${navigation_overlay}" ]]; then
    "${adb_bin}" -s "${device_id}" shell cmd overlay enable-exclusive \
      --category "${navigation_overlay}" >/dev/null
    navigation_overlay_changed="true"
    sleep 1
  fi
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

install_output=""
if ! install_output="$("${adb_bin}" -s "${device_id}" install -r -t "${android_apk}" 2>&1)"; then
  if grep -Fq 'INSTALL_FAILED_UPDATE_INCOMPATIBLE' <<<"${install_output}"; then
    echo "Removing an incompatible prior ${app_id} test install and retrying."
    "${adb_bin}" -s "${device_id}" uninstall "${app_id}" >/dev/null
    "${adb_bin}" -s "${device_id}" install -r -t "${android_apk}" >/dev/null
  else
    echo "${install_output}" >&2
    exit 1
  fi
fi
if ! "${adb_bin}" -s "${device_id}" shell pm list packages | grep -Fqx "package:${app_id}"; then
  echo "Android app did not install with expected application id: ${app_id}" >&2
  exit 1
fi

original_airplane_mode="$("${adb_bin}" -s "${device_id}" shell cmd connectivity airplane-mode | tr -d '\r')"
case "${smoke_network}" in
  offline)
    "${adb_bin}" -s "${device_id}" shell cmd connectivity airplane-mode enable >/dev/null
    ;;
  online)
    # A previously interrupted offline proof can leave the reusable AVD in
    # airplane mode. Online flows must establish their own network precondition
    # and restore the developer's original setting during cleanup.
    "${adb_bin}" -s "${device_id}" shell cmd connectivity airplane-mode disable >/dev/null
    ;;
esac
network_settings_changed="true"

if [[ "${smoke_runtime}" == "dev-client" ]] \
  && curl --silent --fail --max-time 1 http://127.0.0.1:8091/status >/dev/null 2>&1; then
  echo "Android smoke port 8091 is already in use; stop that Metro server and retry." >&2
  exit 1
fi
fixture_directory="$(cd ../../packages/app-core/tests/__helpers__/fixtures && pwd)"
if curl --silent --fail --max-time 1 http://127.0.0.1:8092/pokemons.json >/dev/null 2>&1; then
  # A developer may already have the deterministic fixture server running for
  # a local preview. Reuse it when it exposes the expected catalog instead of forcing
  # them to tear down a healthy preview merely to run native automation.
  echo "Reusing catalog fixture server on port 8092."
else
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
fi
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
if [[ "${smoke_runtime}" == "dev-client" ]]; then
  setsid env \
    REACT_NATIVE_PACKAGER_HOSTNAME=10.0.2.2 \
    EXPO_PUBLIC_MOBILE_EXPERIENCE=native-preview \
    EXPO_PUBLIC_DEVICE_SMOKE_MODE=true \
    EXPO_PUBLIC_DEVICE_SMOKE_COLOR_SCHEME="${color_scheme}" \
    CI=1 \
    npx expo start --dev-client --host localhost --port 8091 >"${artifact_dir}/metro.log" 2>&1 &
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
fi

prepare_dev_client() {
  # Clear once for deterministic SecureStore/SQLite state, then connect the
  # installed Pokémon Go Nexus development client to this isolated Metro
  # server before Maestro starts opening fixture routes through the app's own
  # URL scheme.
  local fixture_url
  fixture_url="${app_scheme}://device-smoke/login"
  "${adb_bin}" -s "${device_id}" shell am force-stop "${app_id}"
  "${adb_bin}" -s "${device_id}" shell pm clear "${app_id}" >/dev/null
  "${adb_bin}" -s "${device_id}" shell am start \
    -a android.intent.action.VIEW \
    -d "${dev_client_url}" \
    "${app_id}" >/dev/null
  for _attempt in $(seq 1 90); do
    if grep -q '^Android Bundled ' "${artifact_dir}/metro.log"; then
      sleep 2
      "${adb_bin}" -s "${device_id}" shell am force-stop "${app_id}"
      return 0
    fi
    if (( _attempt >= 3 && _attempt % 3 == 0 )); then
      "${adb_bin}" -s "${device_id}" shell am start \
        -a android.intent.action.VIEW \
        -d "${fixture_url}" \
        "${app_id}" >/dev/null
    fi
    sleep 1
  done
  echo "Pokémon Go Nexus development client did not load the fixture route." >&2
  tail -120 "${artifact_dir}/metro.log" >&2
  "${adb_bin}" -s "${device_id}" logcat -d -t 200 '*:W' >&2 || true
  exit 1
}

if [[ "${smoke_runtime}" == "dev-client" ]]; then
  prepare_dev_client
else
  "${adb_bin}" -s "${device_id}" shell am force-stop "${app_id}"
  "${adb_bin}" -s "${device_id}" shell pm clear "${app_id}" >/dev/null
fi

run_maestro_flow() {
  local flow="$1"
  local output_name="$2"
  local bundles_before bundles_after
  # A process boundary removes mounted Expo Router state between fixtures. App
  # smoke mode supplies a deterministic theme and each fixture owns its domain
  # state, while the installed development client retains its Metro endpoint.
  "${adb_bin}" -s "${device_id}" shell am force-stop "${app_id}"
  if [[ "${smoke_runtime}" == "dev-client" ]]; then
    bundles_before="$(grep -c '^Android Bundled ' "${artifact_dir}/metro.log" || true)"
    "${adb_bin}" -s "${device_id}" shell am start \
      -a android.intent.action.VIEW \
      -d "${dev_client_url}" \
      "${app_id}" >/dev/null
    bundles_after="${bundles_before}"
    for _attempt in $(seq 1 45); do
      bundles_after="$(grep -c '^Android Bundled ' "${artifact_dir}/metro.log" || true)"
      if (( bundles_after > bundles_before )); then
        break
      fi
      sleep 1
    done
    if (( bundles_after <= bundles_before )); then
      echo "Development client did not mount a fresh project bundle for ${output_name}." >&2
      tail -120 "${artifact_dir}/metro.log" >&2
      return 1
    fi
    # Give the retained development bundle a brief moment to mount before the
    # flow delivers its app route. This still keeps a real process boundary
    # between fixtures without dropping into the development-launcher home.
    sleep 2
  else
    sleep 1
  fi
  "${maestro_bin}" --device "${device_id}" test \
    --no-ansi \
    -e "APP_ID=${app_id}" \
    -e "APP_LINK_BASE=${app_scheme}:/" \
    --test-output-dir "${artifact_dir}/maestro/${output_name}" \
    "${flow}"
}

if [[ -d "${smoke_flow}" ]]; then
  mapfile -t smoke_flows < <(find -L "${smoke_flow}" -maxdepth 1 -type f -name '*.yaml' | sort)
  failed_flows=()
  for flow in "${smoke_flows[@]}"; do
    flow_name="$(basename "${flow}" .yaml)"
    echo "Running isolated device smoke: ${flow_name}"
    if ! run_maestro_flow "${flow}" "${flow_name}"; then
      echo "Retrying isolated device smoke once after an app restart: ${flow_name}"
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
  flow_name="$(basename "${smoke_flow}" .yaml)"
  if ! run_maestro_flow "${smoke_flow}" "${flow_name}"; then
    echo "Retrying device smoke once after an app restart: ${flow_name}"
    run_maestro_flow "${smoke_flow}" "${flow_name}-retry"
  fi
fi

mapfile -t full_window_gradient_screenshots < <(
  find "${artifact_dir}/maestro" \
    -type f \
    -path '*/takeScreenshot/*' \
    \( -iname '*action-menu*.png' -o -iname '*sort-menu*.png' \) \
    | sort
)
for full_window_gradient_screenshot in "${full_window_gradient_screenshots[@]}"; do
  node "${mobile_directory}/scripts/assert-native-action-menu-window.mjs" \
    "${full_window_gradient_screenshot}"
done

mapfile -t full_window_loading_screenshots < <(
  find "${artifact_dir}/maestro" \
    -type f \
    -path '*/takeScreenshot/*' \
    -iname '*navigation-loading*.png' \
    | sort
)
for full_window_loading_screenshot in "${full_window_loading_screenshots[@]}"; do
  node "${mobile_directory}/scripts/assert-native-loading-window.mjs" \
    "${full_window_loading_screenshot}"
done

mapfile -t full_window_route_screenshots < <(
  find "${artifact_dir}/maestro" \
    -type f \
    -path '*/takeScreenshot/*' \
    -iname '*-route-window*.png' \
    | sort
)
for full_window_route_screenshot in "${full_window_route_screenshots[@]}"; do
  node "${mobile_directory}/scripts/assert-native-route-window.mjs" \
    "${full_window_route_screenshot}"
done

"${adb_bin}" -s "${device_id}" exec-out screencap -p >"${artifact_dir}/final-screen.png"
echo "Android device smoke passed. Artifacts: ${artifact_dir}"
