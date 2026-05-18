# Mobile App (Expo)

Expo mobile shell for PokeGo Nexus.

## Included baseline

1. Expo + TypeScript shell.
2. Shared web frontend rendering via embedded WebView.
3. Route presets for major frontend pages (`/pokemon`, `/search`, `/trades`, `/account`, etc.).
4. Typed runtime config via Expo `extra`.
5. Lint/typecheck/test scripts.

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

## Note on Node version

Use the repo `.nvmrc` Node version (`24`) for normal development and CI parity.
Expo/React Native dependencies in this scaffold require at least Node `>= 20.19.4`, so Node 24 is the intended path here.

## Monorepo Resolution Note

This app consumes local workspace packages from `../../packages/*`.
If Metro cannot resolve `@pokemongonexus/*` imports, restart with cache clear:

```bash
npx expo start -c
```
