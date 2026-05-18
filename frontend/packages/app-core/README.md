# @pokemongonexus/app-core

`app-core` is the canonical source for the web app's React UI, route pages, domain stores, services, browser-facing storage, and tests.

The Vite host lives in `frontend/apps/web`, but most web behavior should be implemented and tested here.

## Source Map

- `src/App.tsx` - route registration and top-level providers.
- `src/AppProviders.tsx` / `src/AppBootstrap.tsx` - app bootstrap, store hydration, auth-aware sync setup.
- `src/components` - shared UI, overlays, loading spinner, nav/action menu, Pokemon display widgets, and dev instrumentation.
- `src/contexts` - cross-cutting providers for auth, loading, modals, theme, and events/SSE.
- `src/db` - IndexedDB helper layer.
- `src/features` - domain-owned state, storage, actions, and derivation helpers.
- `src/hooks` - shared hooks that are not owned by one route feature.
- `src/pages` - route pages and feature-specific UI compositions.
- `src/services` - API clients and backend service wrappers.
- `src/stores` - shared/batched-update stores that do not belong cleanly to one page.
- `src/styles` - global CSS imports and token layers.
- `src/types` - app-local TypeScript models.
- `src/utils` - storage, logging, routing, asset URL, and formatting helpers.
- `tests` - unit, integration, contract, and workflow tests used by the web workspace.

## Feature Ownership

- `features/variants` owns Pokemon API payload hydration, generated variants, Pokédex list generation, and variant IndexedDB cache behavior.
- `features/instances` owns current/foreign trainer instances, instance identity, status/detail updates, merge/equality helpers, and instance IndexedDB persistence.
- `features/tags` owns generated tag buckets and tag cache/bootstrap behavior.
- `features/trades` owns trade records, related instances, and proposal actions.
- `features/pokemonDisplay` owns derived display rules for cards and overlays: base image, fusion/mega/crown/max display, backgrounds, move pools, and presentation helpers.
- `features/query` owns reusable search-term matching and evolutionary-family expansion.
- `features/location` owns browser geolocation state used by account/search flows.

## Route Pages

- `pages/Home` - landing page and feature overview.
- `pages/Authentication` - login, register, account management, location choices, password reset UI.
- `pages/Pokemon` - core collection workspace, Pokédex panel, Pokémon grid, Tags panel, and caught/trade/wanted overlays.
- `pages/Search` - Pokémon/trainer discovery, list/map views, result detail flows.
- `pages/Trades` - trade status dashboard and action handlers.
- `pages/Raid` - raid calculation UI and support utilities.

## Testing Guidance

Use focused tests near the behavior you change:

- Domain helper/store behavior: `tests/unit/features/*` or `tests/integration/features/*`.
- Route/UI behavior: `tests/unit/pages/*`.
- API DTO expectations: `tests/contracts/*`.
- Store workflows: `tests/e2e/__flows__/*`.
- Browser/Safari/layout regressions: `frontend/apps/web/tests/browser/*`.

Run tests through the web workspace from `frontend/`:

```bash
npm --workspace apps/web run test:unit
npm --workspace apps/web run test:integration
npm --workspace apps/web run test:contracts
npm --workspace apps/web run test:browsers:safari
```

## Maintenance Rules Of Thumb

- Prefer feature-owned helpers over prop-drilling new business rules through route components.
- Keep components responsible for rendering and local UI state; keep persistence and cross-feature mutations in stores/actions.
- Do not add one-line wrapper modules. Import the real helper directly unless the wrapper owns meaningful behavior.
- When a change affects visible UI, add a user-facing test, not only a helper test.
- Treat Safari/WebKit, dynamic viewport height, touch gestures, IndexedDB, and overlay layout as high-risk areas.
