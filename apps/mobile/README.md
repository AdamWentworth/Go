# Mobile App (Expo)

React Native mobile scaffold for Pokemon Go Nexus.

## Included baseline

1. Expo + TypeScript scaffold.
2. Auth shell + navigation skeleton (`Login` and `Home`).
3. Typed runtime API config via Expo `extra`.
4. Shared contracts consumption from `@pokemongonexus/shared-contracts`.
5. Lint/typecheck/test scripts.

## Commands

```bash
npm run start
npm run android
npm run ios
npm run web
npm run typecheck
npm run lint
npm run test
```

## Environment

Copy `.env.example` values into your environment (or EAS secrets) using `EXPO_PUBLIC_*` keys.

## Note on Node version

Expo/React Native dependencies in this scaffold expect Node `>= 20.19.4`.  
If you are below that, install may still work but runtime/tooling issues are possible.
