# Frontend Tech Debt Backlog (Clean Slate)

Last refreshed: 2026-02-17

This file is a fresh starting point for frontend housekeeping from the current stable baseline.
Historical migration logs were intentionally removed to keep this actionable.

## Current Baseline

- Source files in `frontend/src`: 500
- TypeScript files (`.ts`/`.tsx`) in `frontend/src`: 356
- JavaScript files (`.js`/`.jsx`) in `frontend/src`: 0
- Lint (`npm run lint`): pass (`0` errors, `0` warnings)
- Typecheck (`npm run typecheck`): pass
- Unit tests (`npm run test:unit`): pass (`133` files / `458` tests)
- Integration test files: `10`
- E2E test files: `1`
- Explicit `any` types in `frontend/src`: 0
- `@ts-ignore` / `@ts-expect-error` in `frontend/src` + `frontend/tests`: 0
- Remaining eslint suppression lines in `frontend/src`: 0

## Known Caveat

- On Windows, running all unit tests in one Vitest process can exhaust Node heap.
- Local default unit test command is now batched: `npm run test:unit`.
- CI can continue using its own full workflow path.

## Remaining Suppressions (Targeted Cleanup)

None.

## Largest Files (Maintainability Risk)

1. `frontend/src/pages/Pokemon/features/instances/components/Trade/TradeProposal.tsx` (`381` LOC)
2. `frontend/src/pages/Trades/views/PendingTradeView.tsx` (`375` LOC)
3. `frontend/src/pages/Pokemon/hooks/usePokemonPageController.tsx` (`367` LOC)
4. `frontend/src/pages/Search/views/ListViewComponents/WantedListView.tsx` (`338` LOC)
5. `frontend/src/pages/Pokemon/features/instances/CaughtInstance.tsx` (`325` LOC)

## Priority Backlog

### P0 - Reliability and Guardrails

#### P0.1 Remove Remaining ESLint Suppressions
- Status: Done (2026-02-17)
- Goal: eliminate hidden behavior risk from ignored lint rules.
- Tasks:
1. Replace each suppression with stable dependencies or explicit refs.
2. Add/adjust unit tests for each touched behavior path.
- DoD:
1. Suppressions reduced from 7 to 0.
2. `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build` all pass.

#### P0.2 Harden Test Runner Modes
- Status: Done (2026-02-17)
- Goal: make local and CI test execution predictable and documented.
- Tasks:
1. Keep batched runner for local Windows reliability.
2. Add explicit scripts for local-batched vs single-process runs.
3. Document expected usage in `frontend/README.md`.
- DoD:
1. No ambiguity on which script to run locally vs CI.
2. Fresh clone can run tests without OOM surprises.

#### P0.3 Add Missing High-Risk Regression Coverage
- Status: Done (2026-02-17)
- Goal: lock down session and state paths that can cause app-wide failures.
- Targets:
1. `frontend/src/contexts/AuthContext.tsx`
2. `frontend/src/pages/Pokemon/features/instances/hooks/useWantedFiltering.ts`
- DoD:
1. Direct tests cover token refresh/expiry session transitions.
2. Direct tests verify no rerender loop/memory-churn regressions in wanted filtering.

### P1 - Maintainability

#### P1.1 Decompose Oversized Instance Components
- Status: Done (2026-02-17)
- Goal: reduce component complexity and review risk.
- Targets:
1. `frontend/src/pages/Pokemon/features/instances/TradeInstance.tsx`
2. `frontend/src/pages/Pokemon/features/instances/CaughtInstance.tsx`
- Progress:
1. Extracted TradeInstance validation + patch construction into `utils/tradeInstanceForm.ts`.
2. Added regression tests in `tests/unit/pages/Pokemon/features/instances/utils/tradeInstanceForm.unit.test.ts`.
3. Extracted Trade image stage/background modal into typed section components.
4. Added section tests in `tests/unit/pages/Pokemon/features/instances/sections/TradeSections.unit.test.tsx`.
5. Extracted TradeInstance state/effect/handler orchestration into `hooks/useTradeInstanceController.ts`.
6. Added controller regression tests in `tests/unit/pages/Pokemon/features/instances/hooks/useTradeInstanceController.unit.test.ts`.
7. Reduced `TradeInstance.tsx` from `454` LOC to `267` LOC while preserving behavior.
8. Extracted CaughtInstance arc overlay measurement/observer logic into `hooks/useArcHeight.ts`.
9. Added pure helper tests in `tests/unit/pages/Pokemon/features/instances/hooks/useArcHeight.unit.test.ts`.
10. Reduced `CaughtInstance.tsx` from `426` LOC to `377` LOC while preserving behavior.
11. Extracted CaughtInstance persist computation/patch-map logic into `utils/caughtPersist.ts`.
12. Added persist regression tests in `tests/unit/pages/Pokemon/features/instances/utils/caughtPersist.unit.test.ts`.
13. Reduced `CaughtInstance.tsx` further from `377` LOC to `368` LOC while preserving behavior.
14. Extracted CaughtInstance form state + input handlers into `hooks/useCaughtFormState.ts`.
15. Added form-state regression tests in `tests/unit/pages/Pokemon/features/instances/hooks/useCaughtFormState.unit.test.ts`.
16. Reduced `CaughtInstance.tsx` from `368` LOC to `325` LOC while preserving behavior.
- DoD:
1. Each target split into smaller typed sections/hooks.
2. Behavior parity preserved with regression tests.

#### P1.2 Decompose Search Control Surface
- Status: In Progress (2026-02-17)
- Goal: simplify search UI orchestration and reduce hook/dependency fragility.
- Targets:
1. `frontend/src/pages/Search/PokemonSearchBar.tsx`
2. `frontend/src/pages/Search/SearchParameters/useVariantSearchController.ts`
- Progress:
1. Extracted PokemonSearchBar search validation/matching/query normalization into `utils/buildPokemonSearchQuery.ts`.
2. Added utility regression tests in `tests/unit/pages/Search/utils/buildPokemonSearchQuery.unit.test.ts`.
3. Reduced `PokemonSearchBar.tsx` from `406` LOC to `346` LOC while preserving behavior.
4. Extracted variant search validation-state composition/execution into `SearchParameters/variantSearchControllerHelpers.ts`.
5. Added helper regression tests in `tests/unit/pages/Search/SearchParameters/variantSearchControllerHelpers.unit.test.ts`.
6. Reduced `useVariantSearchController.ts` from `403` LOC to `314` LOC while preserving behavior.
7. Extracted PokemonSearchBar collapse/resize/scroll lifecycle into `hooks/useSearchBarCollapse.ts`.
8. Added lifecycle helper tests in `tests/unit/pages/Search/hooks/useSearchBarCollapse.unit.test.ts`.
9. Reduced `PokemonSearchBar.tsx` from `346` LOC to `294` LOC while preserving behavior.
10. Extracted Pokemon input decision logic into `evaluatePokemonInputChange` in `SearchParameters/variantSearchControllerHelpers.ts`.
11. Added decision-table tests in `tests/unit/pages/Search/SearchParameters/variantSearchControllerHelpers.unit.test.ts` and wired `useVariantSearchController.ts` to the helper.
- DoD:
1. Large orchestration logic moved to pure helpers/hooks.
2. Existing search behavior remains intact under tests.

#### P1.3 Trade Proposal Flow Tightening
- Status: Done (2026-02-17)
- Goal: improve readability and reduce state branching risk.
- Target:
1. `frontend/src/pages/Pokemon/features/instances/components/Trade/TradeProposal.tsx`
- Progress:
1. Extracted typed payload/data helpers into `Trade/tradeProposalHelpers.ts` (`hasInstanceData`, username parsing, instance sanitization, payload builder).
2. Added preflight validation helper `buildTradeProposalPreflight` to centralize proposal guard branches.
3. Added regression tests in `tests/unit/pages/Pokemon/features/instances/components/Trade/tradeProposalHelpers.unit.test.ts` covering parse/sanitize/payload/preflight paths.
4. Refactored `TradeProposal.tsx` to use helper-driven preflight and payload creation.
5. Cleaned non-ASCII text artifacts in user-facing strings/comments; file reduced from `392` LOC to `381` LOC.
- DoD:
1. Branch-heavy sections extracted into typed helpers.
2. Proposal and error-handling behavior verified by tests.

### P2 - Performance and UX

#### P2.1 Repeatable Perf Baseline Script
- Status: Pending
- Goal: make performance regressions measurable per PR.
- Tasks:
1. Document local perf capture workflow (FP/FCP, variants pipeline, image timing).
2. Add optional CI artifact step for perf snapshots on demand.
- DoD:
1. Team can compare before/after perf with the same method.

#### P2.2 Search/List Rendering Efficiency Review
- Status: Pending
- Goal: reduce rerender load in heavy list/search pages.
- Tasks:
1. Audit memoization and derived data recomputation in search + list views.
2. Address highest-cost rerender hotspots first.
- DoD:
1. No behavior changes.
2. Measurable reduction in repeated renders for key views.

## Working Rules

1. One vertical slice at a time.
2. Every behavior-affecting refactor gets regression tests in the same PR.
3. Keep naming canonical (`caught`, `trade`, `wanted`; `variant_id`, `instance_id`).
4. Keep new code TypeScript-only.

## Next Recommended Slice

Continue `P1.2` by extracting remaining `useVariantSearchController.ts` orchestration side effects into focused hooks and keep behavior parity:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test:unit`
4. `npm run build`
