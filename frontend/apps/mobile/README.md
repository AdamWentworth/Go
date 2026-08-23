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

## Commands

```bash
cd frontend
nvm use
npm ci
npm --workspace apps/mobile run start
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
