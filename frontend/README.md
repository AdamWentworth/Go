# Frontend Workspace

This folder is the frontend monorepo workspace.

- `apps/web`: Vite React web app.
- `apps/mobile`: Expo React Native app.
- `packages/shared-contracts`: shared API contracts/types used by frontend apps.
- `packages/shared-ui-tokens`: shared visual tokens.

Use app-local commands for CI parity:

- Web: run commands in `frontend/apps/web`.
- Mobile: run commands in `frontend/apps/mobile`.

You can also run one command from `frontend/`:

- `npm run test` (web + mobile)
- `npm run lint` (web + mobile)
- `npm run typecheck` (web + mobile)
