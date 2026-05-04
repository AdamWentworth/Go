# Frontend Workspace

This folder is the frontend monorepo workspace.

- `apps/web`: Vite React web app.
- `apps/mobile`: Expo React Native app.
- `packages/shared-contracts`: shared API contracts/types used by frontend apps.
- `packages/shared-ui-tokens`: shared visual tokens.

Install dependencies once from the workspace root:

```bash
cd frontend
npm ci
```

Use workspace commands for CI parity:

- `npm run test` (web + mobile)
- `npm run lint` (web + mobile)
- `npm run typecheck` (web + mobile)
- `npm --workspace apps/web run dev`
- `npm --workspace apps/mobile run start`
