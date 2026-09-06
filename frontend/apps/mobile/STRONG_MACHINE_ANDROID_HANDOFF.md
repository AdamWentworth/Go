# Strong-machine Android performance handoff

Last updated: 2026-09-05

## Objective

Build the current `mobile/native-migration` branch as a standalone,
release-mode, ARM64 Android APK and complete the physical Pixel performance
gate for the public information/FAQ work. The functional, visual, content, and
browser-proxy parity checkpoint is commit `278718da`.

Read `CURRENT_NATIVE_TESTING_STATUS.md` before changing application code. The
canonical Vite application remains the specification, and Native must be no
slower at both median and p95 for every bounded interaction.

## Why this moved to another machine

- Expo rejected the new `performance-android` build because the account's free
  Android quota is exhausted until October 1, 2026.
- No new EAS build was queued. The newest EAS APK is from commit `e77b3c39` and
  is too old to qualify the current source.
- The original workstation has 16 GB RAM and 2 GB swap. It has completed recent
  one-ABI release builds in about five minutes, but previous resource pressure
  crashed VS Code. Do not run another unrestricted local build there.

## Recommended builder

- 32 GB RAM, or 16 GB RAM with at least 8 GB swap;
- 8 or more CPU cores;
- SSD with at least 30 GB free;
- Node 24, npm, JDK 17, Android SDK/platform tools, and Maestro;
- an unlocked, USB-authorized physical ARM64 Android phone.

The checked-in runner uses a 2 GB Gradle heap, at most two Gradle workers, no
persistent Gradle daemon, and automatically selects the connected phone's
`arm64-v8a` ABI. Do not broaden the build to all four Android ABIs for this
test. The focused APK should be roughly 64 MB; old multi-ABI EAS artifacts are
roughly 167 MB.

## Obtain the exact source

From the repository root:

```bash
git fetch origin
git switch mobile/native-migration
git pull --ff-only origin mobile/native-migration
git status --short --branch
git rev-parse HEAD
```

The worktree must be clean. Record the reported commit with the APK and test
reports. Then install dependencies from `frontend/`:

```bash
nvm use
npm ci
```

## Build and collect Native phone evidence

Connect and unlock the phone, then obtain its ID with the Android SDK's
`platform-tools/adb devices`. From `frontend/apps/mobile/`, substitute that ID
for `PGN_ANDROID_DEVICE` and run:

```bash
PGN_ANDROID_DEVICE=<device-id>
POKEGONEXUS_ANDROID_DEVICE_ID="$PGN_ANDROID_DEVICE" \
POKEGONEXUS_ANDROID_REQUIRE_PHYSICAL=true \
POKEGONEXUS_SMOKE_RUNTIME=standalone \
POKEGONEXUS_SMOKE_PERFORMANCE=true \
POKEGONEXUS_PERFORMANCE_SAMPLES=5 \
POKEGONEXUS_SMOKE_COLOR_SCHEME=dark \
POKEGONEXUS_SMOKE_FLOW=.maestro-performance/native-information-performance.yaml \
POKEGONEXUS_SMOKE_ARTIFACT_DIR=.artifacts/performance-parity/native-information-standalone \
bash scripts/run-android-device-smoke.sh
```

This command prebuilds Android, compiles one release ABI, installs the APK, and
runs five isolated FAQ samples. It must not use Metro, Expo Go, a development
client, or `POKEGONEXUS_SMOKE_SKIP_APK_INSTALL=true`.

Expected outputs:

- APK: `frontend/apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
- Native report:
  `frontend/apps/mobile/.artifacts/performance-parity/native-information-standalone/native-android-performance.json`

If a retained copy is useful, name only one canonical file with the short Git
commit, for example
`PokeGoNexus-information-<commit>-arm64.apk`, under the ignored
`.artifacts/performance-parity/candidates/` directory. Never commit APKs or put
several obsolete downloads behind one QR.

## Collect the matching Vite phone reference

With the same phone still connected, run from `frontend/`:

```bash
PGN_ANDROID_DEVICE=<device-id>
POKEGONEXUS_ANDROID_DEVICE_ID="$PGN_ANDROID_DEVICE" \
POKEGONEXUS_PERFORMANCE_WORKFLOWS_ONLY=true \
POKEGONEXUS_PERFORMANCE_WORKFLOW_FILTER=information \
POKEGONEXUS_PERFORMANCE_SAMPLES=5 \
POKEGONEXUS_PERFORMANCE_REPORT=.artifacts/performance-parity/vite-information-physical-android.json \
npm --workspace apps/web run performance:parity:report:android
```

Compare only the four public-information interactions:

```bash
node scripts/performance-parity/compare.mjs \
  --reference .artifacts/performance-parity/vite-information-physical-android.json \
  --candidate apps/mobile/.artifacts/performance-parity/native-information-standalone/native-android-performance.json \
  --profile physical-android \
  --scenario-prefix interaction.information. \
  --output .artifacts/performance-parity/information-physical-android-result.json
```

## Acceptance and handback

The gate passes only when all five Native flows complete on the physical phone
and Native is no slower than Vite at both median and p95 for FAQ topic
selection, expand-all, search, and clear. A Maestro Android text-injection
device-server death is harness instability; preserve its logs and retry, but do
not report it as an app crash without matching logcat evidence.

After a valid pass, update `CURRENT_NATIVE_TESTING_STATUS.md` with the APK
commit/hash, phone model and refresh rate, exact median/p95 values, report
paths, and any genuine failures. Commit and push that evidence on
`mobile/native-migration`. Do not promote the native experience to production
as part of this task.
