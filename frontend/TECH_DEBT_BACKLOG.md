# Frontend Tech Debt Backlog

This backlog converts the current frontend audit into an execution plan focused on production hardening first, then maintainability and migration work.

## Current Status (2026-02-15)

- Completed:
1. P0.2 runtime crash fixes (`TradeDetails` undefined call path, `TradeListView`/`WantedListView` gender render crash path).
2. P0.3 hook correctness (`useSortManager` and `AccountForm` hook-order safety).
3. P0.4 import hardening for targeted paths (`Search`, `Trades`, `changeInstanceTag`) plus ESLint guardrail.
4. P0.5 top-level error boundary with fallback UI, logging hook, and regression test.
5. P1.2 full test suite stabilization (`184/184` passing, deterministic Vitest sequencing, stale integration/e2e assertions updated to canonical instance model).
6. P1.1 TypeScript baseline green (`npm exec tsc --noEmit` clean; auth/location/fusion/raid/test typing drift fixed).
7. P1.3 slice A: Trades/Search compatibility adapter (`instances`/`setInstances` primary naming with legacy alias support) + regression tests.
8. P1.3 slice B: Instance detail flow naming migration (`InstanceOverlay` -> `TradeDetails`/`WantedDetails` + wanted edit hook) with legacy alias fallback and new regression tests.
9. P1.3 slice C: Instance/trade internal terminology cleanup (`useCalculateStardustCost`, `createMirrorEntry`) + dedicated regression tests.
10. P1.3 slice D: removed remaining legacy `ownershipData` aliases inside the instances module (`TradeDetails`, `WantedDetails`, `MirrorManager`, `useToggleEditModeWanted`) and refreshed hook regression tests.
11. P1.3 slice E: Trades/Fusion naming cleanup to canonical `instances` model + regression tests.
12. P1.4 slice A: introduced shared scoped logger utility (`VITE_LOG_LEVEL`, `VITE_VERBOSE_LOGS`, legacy `VITE_DEBUG_LOGS`) and migrated high-noise logs in instances/variants/user-search stores.
13. P1.4 slice B: migrated high-chatter variant/instance utility logs (`loadVariants`, `fetchAndProcessVariants`, `mergeInstancesData`, `logSize`) to scoped debug logging.
14. P1.4 slice C: migrated periodic updates + location/search hot-path logging (`periodicUpdates`, `checkBatchedUpdates`, `useInitLocation`, `Search`, `PokemonSearchBar`) and added dedicated batched-updates regression tests.
15. P1.4 slice D: migrated SSE/events, pokemon fetch service, and instances storage logging (`EventsContext`, `pokemonDataService`, `instancesStorage`) to scoped logger; production build strips `console`/`debugger` while preserving dev logging.
16. P1.4 slice E (part 1): migrated trade handlers + instance edit hooks (`handle*Trade`, `useToggleEditModeWanted`, `useToggleEditModeTrade`) to scoped logger and added `useToggleEditModeTrade` regression tests.
17. TS migration slice: converted `useToggleEditModeWanted` and `useToggleEditModeTrade` from `.js` to `.ts` and rewired call sites (`WantedDetails`, `TradeDetails`) with green typecheck/tests.
18. TS migration slice: converted `createMirrorEntry.js` to `createMirrorEntry.ts` and kept mirror creation semantics with dedicated unit coverage.
19. TS migration slice: converted `useFavoriteList.js` to `useFavoriteList.ts` and added sorting regression tests (favorites -> CP -> pokedex order).
20. TS migration slice: converted `hasDetails.js` to `hasDetails.ts` and added helper regression coverage for moves/IVs/size/location/date paths.
21. TS migration slice: converted `useErrorHandler.js` to `useErrorHandler.ts` and added hook regression coverage for set/clear behavior and payload compatibility.
22. TS migration slice: converted `calculateDamage.js` to `calculateDamage.ts` and added raid damage regression coverage (neutral/STAB/type-effectiveness/case normalization + legacy empty-move behavior).
23. TS migration slice: converted search display helpers (`formatCostumeName.js`, `getPokemonDisplayName.js`) to TypeScript with regression tests for naming/modifier formatting behavior.
24. TS migration slice: converted search validation/image helpers (`validatePokemon.js`, `updateImage.js`) to TypeScript with regression tests for variant checks and image-selection behavior.
25. TS migration slice: converted `URLSelect.js` and `useTradeFiltering.js` to TypeScript, rewired `WantedDetails` import, and added regression coverage for image selection and trade filtering behavior.
26. TS migration slice: converted `useWantedFiltering.js` to TypeScript, rewired `TradeDetails` import, and added hook regression coverage for exclude/include/edit-mode grey-out behavior.
27. TS migration slice: converted Raid utility JS files (`typeEffectiveness.js`, `constants.js`) to TypeScript and added regression coverage for multipliers/type chart behavior and constant exports.
28. TS migration slice: converted `usePokemonDetails.js` to TypeScript and expanded hook regression coverage to include object-map variant resolution.
29. TS migration slice: converted `reportWebVitals.js` to TypeScript and added regression coverage for callback/no-callback registration behavior.
30. TS migration slice: converted `ThemeContext.jsx` to TypeScript, tightened provider typing/storage parsing, and added context regression tests for init/toggle/provider-guard behavior.
31. TS migration slice: converted `SearchModeToggle.jsx` to TypeScript and added unit coverage for welcome/active-mode/click dispatch behavior.
32. TS migration slice: converted `ConfirmationOverlay.jsx` to TypeScript, rewired search popups/list views, and added regression tests for confirm/close/propagation behavior.
33. TS migration slice: converted `Search/views/ListView.jsx` to TypeScript, removed noisy console logging, fixed scroll-to-top ref wiring, and added list view regression coverage.
34. TS migration slice: converted `Search/views/ListViewComponents/CaughtListView.jsx` to TypeScript with safer optional move access and added regression tests for rendering + overlay navigation flows.
35. TS migration slice: converted `Search/views/ListViewComponents/TradeListView.jsx` to TypeScript and added regression tests for wanted-list image resolution and confirmation navigation behavior.
36. Naming canonicalization slice: standardized Search status state and API values to canonical `caught` only, removed deprecated legacy request compatibility, and updated Search status tests/CSS to support `caught` active styling.
37. Reliability slice: hardened `Trade/WantedListDisplay.jsx` and `Wanted/TradeListDisplay.jsx` against partial list payloads, removed debug-era noise/invalid sort args, and added unit regression coverage for filtering, fallback images, and click/toggle behavior.
38. TS migration slice: converted `Trade/WantedListDisplay.jsx` and `Wanted/TradeListDisplay.jsx` to TypeScript (`.tsx`) with typed props/state and updated parent import wiring.
39. TS migration slice: converted `Search/views/ListViewComponents/WantedListView.jsx` to TypeScript with typed search-row models, safer date handling, and dedicated list-view regression tests for trade-list rendering and confirmation navigation.
40. TS migration slice: converted `Search/views/MapViewComponents/WantedPopup.jsx` to TypeScript (`.tsx`) with typed popup payloads and added popup regression tests for trade-match rendering, confirmation navigation, and outside-click close behavior.
41. Compatibility hardening slice: updated `components/pokemonComponents/IV.tsx` to support legacy `item` payload callers while preserving typed `ivs` mode and preventing TS/runtime regressions across Search popups.
42. TS migration slice: converted `Search/views/MapViewComponents/TradePopup.jsx` and `CaughtPopup.jsx` to TypeScript (`.tsx`), rewired `MapView` imports, and added regression tests for list rendering, confirmation navigation, and legacy move-id fallback behavior.
43. TS migration slice: converted `Search/views/MapView.jsx` to `MapView.tsx`, rewired `Search.jsx` import, and added OpenLayers-mocked regression tests for popup mode routing (`caught`/`trade`/`wanted`) and map cleanup on unmount.
44. TS migration slice: converted `Search/Search.jsx` to `Search.tsx`, tightened search result typing and ownership normalization input handling, and added regression tests for welcome rendering, list enrichment/sorting, ownership-mode propagation, and map/list view switching.
45. TS migration slice: converted `Search/PokemonSearchBar.jsx` to `PokemonSearchBar.tsx`, aligned view toggle output to canonical `list`/`map`, and added regression tests for shadow-trade validation, trade query normalization, and view-toggle dispatch.
46. TS migration slice: converted `Search/SearchParameters/LocationSearch.jsx` to `LocationSearch.tsx`, replaced ad-hoc console logging with scoped logger usage, and added regression tests for suggestion fetch/selection, outside-click collapse, current-location toggle, and short-input behavior.
47. TS migration slice: converted `Search/SearchParameters/OwnershipSearch.jsx` and ownership subcomponents (`CaughtSearch.jsx`, `TradeSearch.jsx`, `WantedSearch.jsx`, `FriendshipSearch.jsx`) to TypeScript, kept legacy alias compatibility (`trade_in_wanted_list`) while normalizing internal naming, and added regression tests for mode resets, checkbox/slider behavior, lucky-toggle behavior, and IV forwarding.
- In progress:
1. P0.1 strict CI gate expansion (typecheck+test blocking enabled; lint still advisory pending baseline cleanup).
2. P1.4 logging policy.
- Pending:
1. P1.3 naming canonicalization.

## Rules Of Execution

1. One vertical slice at a time: fix, tests, CI green, then move on.
2. No broad refactors while P0 reliability items are open.
3. Any item that changes runtime behavior must include regression tests.
4. Do not tighten CI gates until the corresponding baseline is green.

## P0: Production Safety (Blockers)

### P0.1 - CI Quality Gates (Blocking)

- Status: In progress

- Goal: prevent shipping broken runtime/type/test states.
- Tasks:
1. [x] Add `typecheck` script to `frontend/package.json`.
2. [x] Add CI steps in `.github/workflows/ci-frontend.yml` for:
3. [ ] `npm run lint` (currently advisory while baseline is reduced)
4. [x] `npm run typecheck`
5. [x] `npm run test`
6. [x] Keep build + bundle checks as required.
- DoD:
1. CI fails on type/test failures.
2. Lint becomes blocking once baseline debt is reduced.
- Estimate: 0.5 day.

### P0.2 - Runtime Crash Fixes

- Status: Done

- Goal: remove known production crash vectors.
- Tasks:
1. [x] Fix undefined symbols:
2. [x] `frontend/src/pages/Pokemon/features/instances/components/Trade/TradeDetails.jsx` (`updateDBEntry` undefined).
3. [x] `frontend/src/pages/Search/views/ListViewComponents/TradeListView.jsx` (`GenderIcon` undefined).
4. [x] `frontend/src/pages/Search/views/ListViewComponents/WantedListView.jsx` (`GenderIcon` undefined).
5. [x] Add regression tests for fixed paths.
- DoD:
1. [x] No `no-undef` lint errors in affected files.
2. [x] Targeted tests added and passing.
- Estimate: 0.5 day.

### P0.3 - Hook Correctness

- Status: Done

- Goal: eliminate invalid hook usage that can cause undefined behavior.
- Tasks:
1. [x] Refactor `frontend/src/hooks/sort/useSortManager.ts` to never call hooks conditionally.
2. [x] Refactor `frontend/src/pages/Authentication/FormComponents/AccountForm.tsx` so all hooks run unconditionally.
3. [x] Add unit tests to ensure equivalent behavior.
- DoD:
1. [x] No `react-hooks/rules-of-hooks` errors in affected files.
2. [x] Existing behavior unchanged (targeted regression coverage + build verification).
- Estimate: 0.5 to 1 day.

### P0.4 - Import Resolution Hardening

- Status: Done (target scope in this backlog)

- Goal: remove brittle `.js` extension imports that resolve incorrectly during migration/deploy.
- Tasks:
1. [x] Replace `.js` suffix imports that target TS sources with extensionless imports.
2. [x] Standardize import style in `Search`, `Trades`, and `changeInstanceTag` paths.
3. [x] Add ESLint rule to disallow extensioned local TS imports.
- DoD:
1. [x] No extension-mismatch imports remain in targeted TS module paths (`@/features`, `@/types`, `changeInstanceTag`).
2. [x] Dev/prod module loading validated via clean build.
- Estimate: 0.5 day.

### P0.5 - Error Boundary

- Status: Done

- Goal: prevent full-route white screens from isolated component failures.
- Tasks:
1. [x] Add top-level React error boundary around routed app content.
2. [x] Add fallback UI and logging hook.
3. [x] Add test proving render fallback on thrown child error.
- DoD:
1. [x] A thrown child error no longer crashes the entire app shell.
- Estimate: 0.5 day.

## P1: Correctness + Stability

### P1.1 - Typescript Baseline Green

- Status: Done

- Goal: `tsc --noEmit` fully clean.
- Scope:
1. Missing module/type references in auth forms.
2. `InstancesData` naming drift to canonical `Instances`.
3. `fetch` header typing in `useUserSearchStore`.
4. Fusion/raid type mismatch fixes.
5. Test typing fixes (`msw rest` API version alignment, helper exports).
- DoD:
1. `npm run typecheck` passes.
2. No `TS2307`, `TS2339`, `TS2345` leftovers in current report set.
- Estimate: 1 to 2 days.

### P1.2 - Test Suite Stabilization

- Status: Done

- Goal: all unit/integration/e2e tests green and deterministic.
- Scope:
1. [x] Repair failing instances store integration/e2e tests to match current domain semantics (`Caught/Trade/Wanted/Missing`).
2. [x] Remove fragile global assertion in `tests/setupTests.ts` that fails any `console.error` globally.
3. [x] Keep failure detection but scope assertions per test where relevant.
4. [x] Reduce randomization for CI determinism (disabled shuffle/concurrent test execution in Vitest).
- DoD:
1. [x] `npm run test` green locally (`191 passed`).
2. [x] No unhandled promise rejection during test run.
- Estimate: 1 to 2 days.

### P1.3 - Naming Canonicalization (Domain)

- Goal: unify model language for maintainability.
- Target canonical terms:
1. `instances` over `ownershipData`.
2. `is_caught`/`Caught` and `Missing` as the only canonical status model.
3. `variant_id` over `pokemonKey`.
- DoD:
1. New code uses canonical terms only.
2. Legacy aliases isolated to compatibility adapters.
- Estimate: 1 to 2 days (incremental).

### P1.4 - Logging Policy

- Goal: cut production log noise and keep only actionable telemetry.
- Tasks:
1. Replace ad-hoc `console.log` with logger utility and env-based levels.
2. Remove noisy loops/log spam from periodic update paths.
3. Keep structured error logs for failures only.
- DoD:
1. No verbose logs in production build paths.
2. Debug logs gated behind explicit dev flag.
- Estimate: 0.5 to 1 day.

## P2: Maintainability + Performance Structure

### P2.1 - Any Reduction Campaign

- Goal: reduce `any` usage in core data paths.
- Priority files:
1. `frontend/src/features/variants/utils/createPokemonVariants.ts`
2. `frontend/src/features/instances/services/updatePokemonInstanceStatus.ts`
3. `frontend/src/features/tags/utils/tagHelpers.ts`
4. `frontend/src/pages/Pokemon/features/instances/components/Trade/MirrorManager.tsx`
- DoD:
1. `@typescript-eslint/no-explicit-any` reduced by at least 70% in priority files.
2. No behavior regressions.
- Estimate: 2 to 4 days (incremental by file).

### P2.2 - Decompose Large Components

- Goal: reduce complexity and improve reviewability.
- First targets:
1. `frontend/src/pages/Pokemon/features/instances/components/Trade/TradeDetails.jsx`
2. `frontend/src/pages/Search/SearchParameters/VariantSearch.jsx`
3. `frontend/src/pages/Pokemon/Pokemon.jsx`
- DoD:
1. Extract pure helpers/hooks and child components.
2. No single component file over ~300 LOC in target set.
- Estimate: 2 to 3 days.

### P2.3 - Tooling Cleanup

- Goal: simplify stack and reduce maintenance overhead.
- Tasks:
1. Remove unused Jest toolchain packages if Vitest is canonical.
2. Keep one test framework config path.
3. Validate no CI/script dependency on removed packages.
- DoD:
1. Package and scripts reflect one testing framework.
2. CI unchanged functionally.
- Estimate: 0.5 day.

## Suggested Execution Order (Short Sprints)

### Sprint A

1. P0.2 runtime crash fixes.
2. P0.3 hook correctness.
3. P0.4 import hardening.
4. P0.5 error boundary.

### Sprint B

1. P1.1 typecheck green.
2. P1.2 test stabilization.
3. P0.1 enable strict CI gates.

### Sprint C

1. P1.3 naming canonicalization.
2. P1.4 logging cleanup.
3. P2.1 any-reduction wave 1.

### Sprint D

1. P2.2 component decomposition.
2. P2.3 tooling cleanup.

## Immediate Next Step

Continue P1.3 incremental JS->TS migration for low-risk UI/context slices with tests-first changes (next candidate: `Search/SearchParameters/VariantSearch.jsx` plus `VariantComponents/MovesSearch.jsx`), while keeping P1.4 log gating and P0.1 lint-baseline reduction in parallel.
