# Mobile App (Expo)

Expo mobile shell for Pokemon Go Nexus.

## Included baseline

1. Expo + TypeScript shell.
2. Shared web frontend rendering via embedded WebView.
3. Route presets for major frontend pages (`/pokemon`, `/search`, `/trades`, `/account`, etc.).
4. Typed runtime config via Expo `extra`.
5. Lint/typecheck/test scripts.

## Commands

```bash
cd frontend
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

Expo/React Native dependencies in this scaffold expect Node `>= 20.19.4`.  
If you are below that, install may still work but runtime/tooling issues are possible.

## Monorepo Resolution Note

This app consumes local workspace packages from `../../packages/*`.
If Metro cannot resolve `@pokemongonexus/*` imports, restart with cache clear:

```bash
npx expo start -c
```
