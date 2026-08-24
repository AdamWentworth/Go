# Mobile App (Expo)

Expo mobile shell for Pokémon Go Nexus.

Native workflow replacements are governed by the
[Native Collection Parity Contract](./COLLECTION_PARITY_CONTRACT.md). The
canonical web application remains the default until a complete workflow passes
its automated and manual parity gates.

## Included baseline

1. Expo + TypeScript shell.
2. Shared web frontend rendering via embedded WebView.
3. Route presets for major frontend pages (`/pokemon`, `/search`, `/trades`, `/account`, etc.).
4. Typed runtime config via Expo `extra`.
5. Lint/typecheck/test scripts.
6. Expo Router foundation for incremental native routes.
7. SecureStore-backed refresh-token persistence for native sessions.
8. Preview-only native email sign-in with refresh rotation, session recovery,
   and an immediate fallback to the current app.

## Commands

```bash
cd frontend
nvm use
npm ci
npm --workspace apps/mobile run start
npm --workspace apps/mobile run start:native-preview
npm --workspace apps/mobile run android
npm --workspace apps/mobile run ios
npm --workspace apps/mobile run web
npm --workspace apps/mobile run typecheck
npm --workspace apps/mobile run lint
npm --workspace apps/mobile run test
npm --workspace apps/mobile run device:smoke:android
```

`device:smoke:android` boots or reuses the dedicated Pixel emulator, starts an
isolated Metro server with the full checked-in Pokémon catalog plus seeded tag
memberships, and drives the real Expo/React Native runtime with Maestro. It
verifies that the unfiltered catalog is the default, then checks the Tags,
Pokémon, and Wishlist tabs, horizontal swiping, tag selection, filter clearing,
tagged ownership glows, and opening a collection entry without requiring
production credentials. The
device-smoke route is disabled unless `EXPO_PUBLIC_DEVICE_SMOKE_MODE=true` and
is unavailable in production bundles.

## Environment

Copy `.env.example` values into your environment (or EAS secrets) using `EXPO_PUBLIC_*` keys.

`EXPO_PUBLIC_FRONTEND_APP_URL` controls which deployed web app the mobile shell loads.

`EXPO_PUBLIC_MOBILE_EXPERIENCE` defaults to `webview`. Set it to
`native-preview` only in deliberate development builds. That mode opens the
parity lab, not an unfinished replacement workflow, and retains a direct path
to the canonical WebView app.

## Android development build

Expo Go is no longer the device runtime for this project. The app targets Expo
SDK 57 and uses `expo-dev-client`, which gives Pixel testing a Pokémon Go Nexus
native runtime instead of depending on whichever SDK the Play Store Expo Go app
currently embeds.

Create the installable development APK from this directory with:

```bash
npx eas-cli build --platform android --profile development
```

Install the resulting APK on the Pixel once. For normal TypeScript/JavaScript
iteration after that, keep the phone and computer on the same network and run:

```bash
cd frontend
npm --workspace apps/mobile run start:native-preview
```

Open **Pokémon Go Nexus** on the phone and select the local development server.
Rebuild the APK only after changing native dependencies, native configuration,
or the Expo SDK. The `device-preview` EAS profile produces a standalone internal
APK with the native preview bundled for force-stop/relaunch and offline checks.

Until a native milestone passes the parity contract, the lab intentionally
contains no user-facing replacement. Native engineering routes may still exist
for automated development, but they are not candidates for device approval.

Native social sign-in is intentionally not enabled yet. Google, Discord, and
Facebook continue through the current app until their system-browser callback
exchange is implemented without placing session tokens in redirect URLs.

## Note on Node version

Use the repo `.nvmrc` Node version (`24`) for normal development and CI parity.
Expo/React Native dependencies in this scaffold require at least Node `>= 20.19.4`, so Node 24 is the intended path here.

## Monorepo Resolution Note

This app consumes local workspace packages from `../../packages/*`.
If Metro cannot resolve `@pokemongonexus/*` imports, restart with cache clear:

```bash
npx expo start -c
```
