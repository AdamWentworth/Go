# Frontend Tech Debt Backlog

This backlog converts the current frontend audit into an execution plan focused on production hardening first, then maintainability and migration work.

## Current Status (2026-02-17)

- Completed:
1. P0.2 runtime crash fixes (`TradeDetails` undefined call path, `TradeListView`/`WantedListView` gender render crash path).
2. P0.3 hook correctness (`useSortManager` and `AccountForm` hook-order safety).
3. P0.4 import hardening for targeted paths (`Search`, `Trades`, `changeInstanceTag`) plus ESLint guardrail.
4. P0.5 top-level error boundary with fallback UI, logging hook, and regression test.
5. P1.2 full test suite stabilization (`354/354` unit tests currently passing, deterministic Vitest sequencing, stale integration/e2e assertions updated to canonical instance model).
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
48. TS migration slice: converted `Search/SearchParameters/VariantSearch.jsx` and `Search/SearchParameters/VariantComponents/MovesSearch.jsx` to TypeScript, hardened move-type icon rendering for missing metadata, and added regression tests for autocomplete selection, max toggle transitions, validation error propagation, costume reset behavior, move selection emission, and second charged-move autofill behavior.
49. TS migration slice: converted the remaining Search JS files (`Search/components/Dropdown.jsx`, `Search/views/ListViewComponents/MiniMap.jsx`) to TypeScript, hardened minimap initialization for missing coordinates, rewired list-view imports/mocks, and added direct regression coverage for dropdown behavior and minimap lifecycle/color-path handling.
50. TS migration slice: converted `Raid/MoveSelector.jsx` and `Raid/Pagination.jsx` to TypeScript, removed runtime PropTypes from pagination, hardened zero-page navigation behavior, rewired `Raid.jsx` imports, and added unit tests for move selection callbacks and pagination window/boundary behavior.
51. TS migration slice: converted `Raid/RaidBossSelector.jsx` and `Raid/Table.jsx` to TypeScript, removed runtime PropTypes from table rendering, rewired `Raid.jsx` imports, and added regression tests for datalist input behavior and raid table rendering/empty-state rows.
52. TS migration slice: converted `Trades/Trades.jsx`, `Trades/TradeStatusButtons.jsx`, and `Trades/TradeList.jsx` to TypeScript, introduced shared `Trades/types.ts` status typing, hardened current-user parsing for trade filtering, and added regression tests for status controls, list filtering behavior, and parent-to-child store wiring.
53. TS migration slice: converted the Home page walkthrough stack (`Home`, `HomeHeader`, `HowItWorks`, navigation/search/pokemon sections, and Pokemon showcase cards) from `.jsx` to `.tsx`, standardized extensionless imports, and added regression tests for home rendering/auth-button visibility and How It Works section content.
54. TS migration slice: converted `Trades/TradeCard.jsx` and `Trades/components/PartnerInfoModal.jsx` to TypeScript, standardized trade-card import wiring, typed partner-info map rendering/copy behavior, and added regression tests for trade status routing/confirmation gating and partner-info rendering/copy/location fallbacks.
55. TS migration slice: converted `Trades/views/ProposedTradeView.jsx` and `Trades/views/PendingTradeView.jsx` to TypeScript, removed debug-only console noise, added shared trade-view types, and added regression tests for proposed/pending actions, detail toggles, loading state, and partner-info reveal flow.
56. TS migration slice: converted `Trades/views/OffersTradeView.jsx`, `Trades/views/CancelledTradeView.jsx`, and `Trades/views/CompletedTradeView.jsx` to TypeScript, removed debug-era logs, standardized typed trade/detail rendering helpers, and added regression tests for accept/deny/re-propose/thumbs-up actions plus loading/detail-toggle behavior.
57. TS migration slice: converted all `Pokemon/features/instances/sections/*.jsx` files to TypeScript (`BackgroundSelector`, `HeaderRow`, `IdentityRow`, `ImageStage`, `LevelGenderRow`, `MetaPanel`, `Modals`, `MovesAndIV`, `PowerPanel`, `StatsRow`) and added section-level regression tests covering callback wiring, conditional rendering, overlay handling, and badge/background presentation.
58. TS migration slice: converted `TradeInstance.jsx` and `WantedInstance.jsx` to TypeScript (`.tsx`), centralized entity-key fallback with new `getEntityKey` helper + unit tests, and converted the legacy alias `OwnedInstance.jsx` to `OwnedInstance.ts`.
59. TS migration slice: converted `components/Wanted/WantedDetails.jsx` to TypeScript (`WantedDetails.tsx`), fixed TS-safe filter/image typing and import hardening (`FilterImages` extensionless), and kept `useTradeFiltering`/edit-toggle behavior stable with green typecheck/tests/build.
60. TS migration slice: converted `components/Trade/TradeDetails.jsx` and `instances/InstanceOverlay.jsx` to TypeScript (`TradeDetails.tsx`, `InstanceOverlay.tsx`), removed stale `.js` import suffixes, stabilized strict-null/readonly typing in trade-overlay flows, and validated with green typecheck/unit/build.
61. TS migration slice: converted the final two JS entry files (`instances/CaughtInstance.jsx`, `Pokemon/Pokemon.jsx`) to TypeScript (`CaughtInstance.tsx`, `Pokemon.tsx`), aligned route/menu import paths to extensionless TS targets, and validated with green typecheck/unit/build.
62. Type-hardening slice: rewrote `instances/CaughtInstance.tsx` and tightened the caught-instance section/component contracts (header/identity/level-gender/stats/meta/moves+iv/power/modals), removing high-risk cast chains while preserving behavior.
63. Compatibility slice: normalized shared pokemon component typing (`Moves`, `Gender`, `Weight`, `Height`, `Types`, `LocationCaught`, `DateCaught`, `Favorite`, `BackgroundLocationCard`) so existing call sites/tests remain stable under stricter TS.
64. Validation slice: restored full green after hardening pass (`npm run typecheck`, `npm run test:unit` with `354/354` passing, and `npm run build` all successful).
65. Logging cleanup slice: migrated `Pokemon` active-view debug signal plus fusion overlay logs (`useFusion`, `FuseOverlay`) to scoped logger for env-gated output.
66. Logging cleanup slice: migrated `authService` and `TradeDetails` logging to scoped logger, preserving error/debug semantics while keeping production logs env-gated.
67. Logging cleanup slice: migrated authentication UI and mega selection paths (`Account`, `Register`, `useMegaPokemonHandler`) to scoped logger with behavior-preserving error/warn coverage.
68. Naming canonicalization slice: retired legacy `pokemonKey` usage from frontend source/test logic in favor of explicit `variant_id`/`instance_id` semantics; kept legacy `pokemonKey` fixture fields as inert test data only.
69. Logging cleanup slice: migrated raw console usage in auth form hooks and raid data paths (`useAccountForm`, `useRegisterForm`, `useRaidBossesData`, `calculateRaidBossDPS`) to scoped logger with `debug` for high-chatter telemetry and `error` for failure paths.
70. Logging cleanup slice: migrated service/entry-point logging (`index`, `userService`, `tradeService`, `sseService`, `locationServices`) to scoped logger and updated location service regression assertions for logger-prefixed error output.
71. Logging cleanup slice: migrated instances/trades mutation-path logging (`updateInstanceStatus`, `updateInstanceDetails`, `updatePokemonInstanceStatus`, `useBootstrapInstances`, `loadInstances`, `useTradeStore`) to scoped logger and aligned unit assertions to scoped prefixes.
72. Logging cleanup slice: migrated tags/variants/filtering logging (`useTagsStore`, `useBootstrapTags`, `useBootstrapVariants`, `usePokemonOwnershipFilter`) to scoped logger and updated hook regression expectations for scoped error output.
73. Logging cleanup slice: migrated auth/session/trades DB logging (`AuthContext`, `useSessionStore`, `tradesDB`) to scoped logger with debug-level payload size telemetry retained for dev only.
74. Logging cleanup slice: migrated fusion/instance overlay + trade detail paths (`useFusionSelectionState`, `useFusionInstanceCreation`, `resolveFusionSelection`, `getCandidatesForIdWithVariants`, `useCalculatedCP`, `InstanceOverlay`, `TradeInstance`, `WantedDetails`, `MirrorManager`, `TradeProposal`, `UpdateForTradeModal`, `createMirrorEntry`) to scoped logger and removed stale console debug comment from `TradeDetails`.
75. Logging cleanup slice: migrated tagging/auth/search hot-path logs (`categorizeVariantKeys`, `useHandleChangeTags`, `Login`, `CoordinateSelector`, `TrainerSearchBar`, `useDownloadImage`, `useMegaPokemonSelection`, `EvolutionShortcut`, `MapView`) to scoped logger with dev-gated debug/info output.
76. Logging cleanup slice: migrated utility and sort diagnostics (`cacheHelpers`, `calculateBaseStats`, `deviceID`, `imageHelpers`, `db/init`, `useRecentPokemons`, `useNumberPokemons`) to scoped logger while preserving warning/error semantics.
77. Logging cleanup slice: reduced raw `console.*` usage in `frontend/src` to logger-core sinks only (`utils/logger.ts` emit functions), with full `typecheck` + `354/354` unit + production build verification.
78. P2.1 slice A: removed all explicit `any` usage from `features/variants/utils/createPokemonVariants.ts` (47 -> 0), aligned `PokemonVariant` typing with runtime `raid_boss/backgrounds` optionality, and verified with green `typecheck` + `354/354` unit + production build.
79. P2.1 slice B: removed all explicit `any` usage from `features/instances/services/updatePokemonInstanceStatus.ts` (44 -> 0), tightened typed instance mutation paths, and verified with targeted unit coverage plus green `typecheck` + `354/354` unit + production build.
80. P2.1 slice C: removed all explicit `any` usage from `features/tags/utils/tagHelpers.ts` (33 -> 0), widened helper inputs to typed partial sources with deterministic defaults, eliminated mirror-entry cast usage in `createMirrorEntry.ts`, and verified with targeted + full green (`typecheck`, `354/354` unit, production build).
81. P2.1 slice D: removed all explicit `any` usage from `pages/Pokemon/features/instances/components/Trade/MirrorManager.tsx` (37 -> 0), tightened mirror lookup/update typing, and added dedicated `MirrorManager` regression coverage (reuse/create/toggle flows) with green `typecheck` + `354/354` unit + production build.
82. P2.2 slice A: extracted `TradeDetails` trade-proposal candidate/decision logic into `tradeDetailsHelpers.ts` (`prepareTradeCandidateSets`, `resolveTradeProposalDecision`), simplified `handleProposeTrade` orchestration, and added/expanded helper regression coverage for no-caught, needs-trade-selection, pending-trade exclusion, and proposal-ready payload flow (`369/369` unit tests green, plus green typecheck/build).
83. P2.2 slice B: extracted `TradeDetails` instance-to-overlay merge flow into tested helper `buildWantedOverlayPokemon`, simplified `handlePokemonClick` orchestration, and added helper regression coverage for missing-variant, missing-instance, and successful merged overlay payload behavior.
84. P2.2 slice C: extracted the large wanted-filter render block from `TradeDetails` into dedicated child component `TradeFiltersPanel.tsx`, preserving filter toggle behavior/layout modes and adding dedicated unit coverage for mirror hidden-state, compact include-heading rendering, and include/exclude toggle callback wiring (`372/372` unit tests green, plus green typecheck/build).
85. P2.2 slice D: extracted the `TradeDetails` top-row (edit/save + reset affordance + header mode + mirror manager) into `TradeTopRow.tsx`, preserved reset/mirror/header behaviors, and added dedicated unit coverage for heading variants, reset click gating, and structural rendering (`375/375` unit tests green, plus green typecheck/build).
86. P2.2 slice E: extracted trade-proposal/update-modal orchestration from `TradeDetails` into `useTradeProposalFlow.ts`, removed dead in-component update-modal handler path, and added dedicated hook regression coverage for no-selection, fetch failure, needs-trade-selection, and proposal-ready flows (`382/382` unit tests green, plus green typecheck/build).
87. P2.2 slice F: extracted pure `VariantSearch` decision helpers into `variantSearchHelpers.ts` (max-cycle, suggestions, forms normalization, costume/background gating, date-sort), rewired `VariantSearch.tsx` to consume helpers, and added dedicated helper regression coverage (`389/389` unit tests green, plus green typecheck/build).
88. P2.2 slice G: extracted `VariantSearch` input/autocomplete and toggle/dropdown UI into typed child components (`VariantSearchInput.tsx`, `VariantSearchTogglePanel.tsx`) with dedicated regression tests and full green validation (`393/393` unit tests, typecheck, production build).
89. P2.2 slice H: extracted `VariantSearch` preview/moves/background and overlay UI into typed child components (`VariantSearchPreviewPanel.tsx`, `VariantSearchBackgroundOverlay.tsx`) with focused regression tests and full green validation (`397/397` unit tests, typecheck, production build).
90. P2.2 slice I: extracted `VariantSearch` state/handler orchestration into `useVariantSearchController.ts`, slimmed `VariantSearch.tsx` to composition-only UI (`175` LOC), and added dedicated hook regression coverage for suggestions, max-toggle transitions, costume reset, background selection, and empty-input reset behavior.
91. P2.2 slice J: extracted pure `Pokemon.tsx` page helpers into `pokemonPageHelpers.ts` (status normalization, slider math, bulk-select ids, sub-label derivation), rewired `Pokemon.tsx` to consume helpers, and added dedicated helper regression coverage (`408/408` unit tests green, plus green typecheck/build).
92. P2.2 slice K: extracted `Pokemon.tsx` slider/panel render orchestration into `components/PokemonViewSlider.tsx`, moved Pokedex/Pokemon/Tags panel wiring behind typed callbacks, and added focused slider wiring/style regression tests (`411/411` unit tests green, plus green typecheck/build).
93. P2.2 slice L: extracted `Pokemon.tsx` overlay/action-menu/modal block into `components/PokemonPageOverlays.tsx`, preserved highlight action + close/action menu + mega/fusion modal wiring, and added focused overlay regression tests with full green validation (`411/411` unit tests, typecheck, production build).
94. P2.2 slice M: extracted `Pokemon.tsx` state/effect/handler orchestration into `hooks/usePokemonPageController.tsx`, slimmed `Pokemon.tsx` to composition-only rendering (`109` LOC), and added dedicated hook regression coverage for foreign-profile load, select-all highlighting, and tags-panel state transitions (`417/417` unit tests green, plus green typecheck/build).
95. P2.3 slice A: removed unused Jest toolchain dependencies (`jest`, `babel-jest`, `jest-environment-jsdom`, `jest-localstorage-mock`, `jest-watch-typeahead`, `identity-obj-proxy`, `jest-fixed-jsdom`, `@types/jest`), migrated lingering `jest.Mocked` usages to Vitest `Mocked`, removed `jest` from TS global types and ESLint globals, and verified with green `typecheck` + `417/417` unit + production build.
96. P0.1 slice A: lint-baseline reduction on low-risk shared paths (`CloseButton`, `WindowOverlay`, `EventsContext`, `TrainerSearchBar`, fusion/mega selection hooks, `PokemonIDUtils`, `findVariantForInstance`) including `no-empty-object-type`, irregular whitespace, async promise executor removal, and `no-explicit-any` cleanup; added `PokemonIDUtils` regression tests and validated with green `typecheck` + `421/421` unit + production build; lint baseline reduced from `232` to `212` total findings (`189` -> `170` errors).
97. P0.1 slice B: removed `no-explicit-any` debt from `features/instances/actions/updateInstanceStatus.ts` by introducing typed change-detection/prune/update payload helpers and preserving batched persistence behavior; validated with targeted `updateInstanceStatus` tests plus green `typecheck` + `421/421` unit + production build; lint baseline reduced from `212` to `193` total findings (`170` -> `151` errors).
98. P0.1 slice C: removed `no-explicit-any` debt from `features/instances/actions/updateInstanceDetails.ts`, `features/instances/storage/instancesStorage.ts`, and `features/instances/store/useInstancesStore.ts` using typed snapshot/queue helpers and typed store updater boundaries; validated with targeted instances action/storage/store tests plus green `typecheck` + `421/421` unit + production build; lint baseline reduced from `193` to `172` total findings (`151` -> `131` errors).
99. P0.1 slice D: removed `no-explicit-any` hotspots from `Trades/TradeCard.tsx`, `PokemonMenu/PokemonCard.tsx`, `PokemonMenu/PokemonGrid.tsx`, `PokemonMenu/PokemonMenu.tsx`, and `instances/InstanceOverlay.tsx` via typed normalization/adapters and safer key handling; added dedicated regression tests for `PokemonCard` and `InstanceOverlay`; validated with green `typecheck` + `426/426` unit + production build; lint baseline reduced from `172` to `118` total findings (`131` -> `81` errors).
100. P0.1 slice E: removed remaining explicit `any` usage from the trade/instance editing stack (`db/tradesDB.ts` generics, `features/trades/store/useTradeStore.ts`, `TradeDetails.tsx`, `WantedDetails.tsx`, `TradeInstance.tsx`, `WantedInstance.tsx`, `TradeOverlaysPanel.tsx`, `TradeProposal.tsx`, `UpdateForTradeModal.tsx`) and hardened trade-payload typing/contracts (`tradeDetailsHelpers.ts`, `useTradeProposalFlow.ts`) with compatible unit fixture updates; validated with green `typecheck`, `426/426` unit tests, and production build; lint baseline reduced from `118` to `82` total findings (`81` -> `47` errors).
101. P0.1 slice F: removed the remaining explicit `any` + empty-catch lint blockers across tags/instances/fusion/auth paths (`db/tagsDB.ts`, `features/tags/store/useTagsStore.ts`, `features/tags/utils/initializePokemonTags.ts`, `TagsMenu/PreviewContainer.tsx`, `features/instances/utils/{instancesEquality,mergeInstancesData}.ts`, `Authentication/Login.tsx`, `LevelArc.tsx`, fusion handlers/services, and `getDisplayName.ts`), preserved behavior with green `typecheck` + `426/426` unit tests, and reduced lint from `67` findings (`33` errors) to `32` findings (`0` errors, warnings only).
102. P0.1 slice G: removed low-risk lint warning debt across shared UI/util paths (`DateCaught`, `Gender`, `HeaderUI`, `PokedexListsMenu`, `SearchMenu`, `SelectChip`, `WantedInstance`, `WantedListDisplay`, `PokedexOverlay`, `useVariantSearchController`, `authService`, `loadInstances`, `createPokemonVariants`) by eliminating unused vars/imports and stabilizing helper references; validated with green `typecheck`, `426/426` unit tests, and production build; lint baseline reduced from `32` findings to `14` findings (all remaining are `react-hooks/exhaustive-deps` warnings).
103. P0.1 slice H: resolved the remaining `react-hooks/exhaustive-deps` warning set (`AuthContext`, `WantedDetails`, `useCalculateStardustCost`, `useTradeFiltering`, `useWantedFiltering`, `PokemonSearchBar`, `MapView`), validated with green `lint` + `typecheck` + targeted unit regressions + production build, and flipped frontend CI lint from advisory to blocking.
- In progress:
1. None.

## Audit Snapshot (2026-02-17)

Repo parse against backlog claims:
1. JS/JSX migration status: `0` JS/JSX files remain under `frontend/src` (accurate).
2. Canonical naming drift: `ownershipData` references in `frontend/src` = `0`; legacy `pokemonKey` references in `frontend/src` = `0`.
3. Logging policy drift: raw `console.*` references in `frontend/src` = `4` (all are intentional sink calls inside `utils/logger.ts`).
4. Explicit `any` hotspot counts for P2.1 priority files:
   - `createPokemonVariants.ts`: `0`
   - `updatePokemonInstanceStatus.ts`: `0`
   - `tagHelpers.ts`: `0`
   - `MirrorManager.tsx`: `0`
5. P2.2 decomposition target sizes:
   - `Pokemon.tsx`: `109` LOC
   - `VariantSearch.tsx`: `175` LOC
   - `TradeDetails.tsx`: `294` LOC
   - All P2.2 target components are now under the `~300` LOC goal.
6. Tooling cleanup status:
   - Jest framework/toolchain packages/config references removed.
   - Remaining `@testing-library/jest-dom` and `jest-axe` usage is intentional for Vitest matcher/a11y helpers.
7. Lint baseline (post P0.1 slices A-H):
   - `npm run lint`: `0` findings (`0` errors, `0` warnings), down from `232` (`189` errors, `43` warnings).

## Rules Of Execution

1. One vertical slice at a time: fix, tests, CI green, then move on.
2. No broad refactors while P0 reliability items are open.
3. Any item that changes runtime behavior must include regression tests.
4. Do not tighten CI gates until the corresponding baseline is green.

## P0: Production Safety (Blockers)

### P0.1 - CI Quality Gates (Blocking)

- Status: Done

- Goal: prevent shipping broken runtime/type/test states.
- Tasks:
1. [x] Add `typecheck` script to `frontend/package.json`.
2. [x] Add CI steps in `.github/workflows/ci-frontend.yml` for:
3. [x] `npm run lint`
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
1. [x] `npm run test` green locally (`351 passed`).
2. [x] No unhandled promise rejection during test run.
- Estimate: 1 to 2 days.

### P1.3 - Naming Canonicalization (Domain)

- Status: Done

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

- Status: Done

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

- Status: Done

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

- Status: Done

- Goal: reduce complexity and improve reviewability.
- First targets:
1. `frontend/src/pages/Pokemon/features/instances/components/Trade/TradeDetails.tsx`
2. `frontend/src/pages/Search/SearchParameters/VariantSearch.tsx`
3. `frontend/src/pages/Pokemon/Pokemon.tsx`
- DoD:
1. Extract pure helpers/hooks and child components.
2. No single component file over ~300 LOC in target set.
- Estimate: 2 to 3 days.

### P2.3 - Tooling Cleanup

- Status: Done

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

Start the next maintainability wave by targeting high-value runtime-path regression coverage that still lacks direct tests (`AuthContext` session lifecycle and `useWantedFiltering` edge-path behavior), then re-run full CI gates on PR.
