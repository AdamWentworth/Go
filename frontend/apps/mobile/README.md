# Mobile App (Expo)

Expo mobile shell for Pokémon Go Nexus.

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
9. A parity-focused native collection shell using the canonical Tags / Pokémon /
   Wishlist header, compact search and collection filters, responsive 3/6/9-column
   grid, and the existing Pokémon presentation assets for location cards, Lucky,
   Max forms, types, Favorites, and Most Wanted.

The native preview now lands signed-in users directly in the collection. Tags,
Wishlist, and the bottom Poké Ball still hand off to the current app until each
complete workflow is ported; this keeps the preview honest and deployable while
the production default remains the WebView experience.

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
```

## Environment

Copy `.env.example` values into your environment (or EAS secrets) using `EXPO_PUBLIC_*` keys.

`EXPO_PUBLIC_FRONTEND_APP_URL` controls which deployed web app the mobile shell loads.

`EXPO_PUBLIC_MOBILE_EXPERIENCE` defaults to `webview`. Set it to
`native-preview` only in deliberate preview builds; every preview retains a
direct fallback to the current WebView app.

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
