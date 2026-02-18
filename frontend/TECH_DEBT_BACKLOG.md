# Frontend Tech Debt Backlog (Risk-First Reset)

Last refreshed: 2026-02-17 (post P0.1 + P0.4)

This is a clean reset of frontend housekeeping priorities from the current stable baseline.
The focus is production risk reduction first, then maintainability and performance improvements.

## Current Baseline (Verified)

- Lint: pass (`npm run lint`)
- Typecheck: pass (`npm run typecheck`)
- Build: pass (`npm run build`)
- Unit tests: pass (`136` files / `485` tests, batched runner)
- Integration tests: pass (`10` files / `33` tests)
- E2E tests: pass (`1` file / `4` tests)
- Contract tests: pass (`1` file / `3` tests)
- Bundle budget gate: pass (`node scripts/check-bundle-budget.mjs`)
- Prod dependency audit: pass (`npm audit --omit=dev --audit-level=moderate`)
- Full dependency audit: failing (`9` moderate, dev-tooling chain via `ajv`/eslint path)

## Priority Model

- `P0`: release/reliability/security signal risk
- `P1`: correctness and maintainability risk
- `P2`: performance and polish

## P0 - Reliability and Release Guardrails

### P0.1 CI Audit Signal Quality

- Status: `Done` (2026-02-17)
- Goal: stop non-runtime tooling issues from blocking production deploys while keeping visibility.
- Problem:
  `npm audit --omit=dev` is clean, but full `npm audit` fails on dev-tooling transitive issues.
- Completed:
1. Updated `ci-frontend` to use blocking production-only audit:
  `npm audit --omit=dev --audit-level=moderate`.
2. Added non-blocking informational dev/full audit step with `continue-on-error`.
3. Added `frontend-dev-audit-report` artifact upload (`tests/reports/npm-audit-dev.json`).
4. Updated `frontend/README.md` CI section to reflect the policy.
- Tasks:
1. Split audit gates in `ci-frontend`:
  keep prod audit blocking; run dev/full audit as non-blocking or scheduled reporting.
2. Keep Trivy image/filesystem scans as blocking in container job.
3. Document policy in workflow comments and `frontend/README.md`.
- DoD:
1. CI fails only on production-impacting vulnerabilities.
2. Dev-tooling vulnerabilities are still surfaced and tracked.

### P0.2 API Client and Auth/Public Route Consistency

- Status: `In Progress` (2026-02-17)
- Goal: eliminate inconsistent network behavior and duplicated fallback logic.
- Problem:
  mixed `fetch`/`axios` usage and route fallback logic in store code.
- Progress:
1. Added shared request policy utilities in `src/services/httpClient.ts`
  (default credentials, timeout guard, safe JSON parsing).
2. Added `src/services/userSearchService.ts` with centralized:
  `fetchForeignInstancesByUsername` canonical/public fallback behavior
  and `fetchTrainerAutocomplete` user-search behavior.
3. Refactored `useUserSearchStore` to consume service outcomes rather than doing inline fetch/fallback logic.
4. Refactored `TrainerSearchBar` to consume service-layer autocomplete behavior.
5. Added regression tests in `tests/unit/services/userSearchService.unit.test.ts`
  for success, 304, 403, 404, fallback, and autocomplete error handling.
- Tasks:
1. Introduce a shared typed API client policy (credentials, timeout, error normalization).
2. Centralize auth-required vs public endpoint behavior.
3. Move username/public fallback behavior out of stores into service layer.
4. Add regression tests for 200/403/404/timeout paths.
- DoD:
1. Stores/pages do not manually branch transport/auth behavior.
2. Same request policy applies across users/search/location/auth calls.

### P0.3 Close High-Risk Coverage Gaps

- Status: `Pending`
- Goal: increase confidence in branch-heavy flows that can break user journeys.
- Highest-risk targets:
1. `frontend/src/pages/Authentication/hooks/useRegisterForm.ts`
2. `frontend/src/pages/Authentication/hooks/useAccountForm.ts`
3. `frontend/src/pages/Pokemon/features/instances/components/Trade/TradeDetails.tsx`
4. `frontend/src/pages/Pokemon/features/instances/components/Wanted/WantedDetails.tsx`
- Tasks:
1. Add direct unit tests for success/error/edge branches.
2. Add one integration scenario per target flow where appropriate.
- DoD:
1. Each listed target has direct regression coverage.
2. Critical user flows are validated without relying only on indirect tests.

### P0.4 Runtime Env Guardrails

- Status: `Done` (2026-02-17)
- Goal: prevent browser-runtime env mistakes from reappearing.
- Problem:
  browser code still contains `process.env` usage instead of `import.meta.env`.
- Completed:
1. Replaced remaining browser `process.env` usage in
  `src/features/instances/actions/updateInstanceDetails.ts` with `import.meta.env.DEV`.
2. Added ESLint guard (`no-restricted-properties`) for `process.env` in `src/**/*`.
3. Expanded `src/vite-env.d.ts` with currently used `VITE_*` keys and optional debug/perf flags.
4. Verified no `process.env` usage remains under `frontend/src`.
- Tasks:
1. Replace remaining `process.env` checks in browser code.
2. Add lint guard to disallow `process.env` in `frontend/src`.
3. Keep environment variable typing updated in `vite-env.d.ts`.
- DoD:
1. No `process.env` references remain in browser source.
2. Lint catches future regressions automatically.

## P1 - Correctness and Maintainability

### P1.1 Expand Contract Test Surface

- Status: `Pending`
- Goal: protect frontend assumptions about backend response shapes.
- Tasks:
1. Add contract tests for `users`, `search`, and `auth` endpoints used by frontend.
2. Validate required fields and status-code semantics for key read paths.
- DoD:
1. Contract suite covers more than pokemon data.
2. Breaking backend schema changes fail fast in CI.

### P1.2 Storage Access Consolidation

- Status: `Pending`
- Goal: reduce repeated `localStorage` parsing and timestamp-key drift.
- Tasks:
1. Introduce typed storage adapters for user/session/location/cache timestamps.
2. Replace ad hoc `JSON.parse` and key literals in views/stores.
3. Add adapter tests for malformed data and migration defaults.
- DoD:
1. Storage key handling is centralized and typed.
2. Corrupt stored values no longer crash feature flows.

### P1.3 Alert UX Cleanup

- Status: `Pending`
- Goal: replace blocking `alert()` calls with consistent app feedback.
- Tasks:
1. Replace `alert` usage with modal/toast/error-boundary patterns where appropriate.
2. Keep user-facing messages unchanged unless product decision says otherwise.
3. Add tests for critical error messaging paths.
- DoD:
1. No blocking `alert()` calls remain in primary app flows.
2. Error handling is consistent across auth/search/trade/instance interactions.

### P1.4 Dependency Upgrade Lane (Controlled)

- Status: `Pending`
- Goal: keep dependency drift under control without destabilizing app behavior.
- Tasks:
1. Upgrade patch/minor dependencies in small batches.
2. Handle major upgrades in isolated PRs with compatibility notes.
3. Run full frontend gates after each batch.
- DoD:
1. Dependency drift is reduced with no behavior regressions.
2. Upgrade policy is repeatable and documented.

## P2 - Performance and Polish

### P2.1 Repeatable Perf Baseline Workflow

- Status: `Pending`
- Goal: make perf changes measurable and comparable between PRs.
- Tasks:
1. Document local telemetry capture workflow (FP/FCP, variants pipeline, image timing).
2. Add optional CI artifact upload for perf snapshot logs.
- DoD:
1. Team can compare before/after metrics with a single repeatable process.

### P2.2 Targeted Render Cost Review

- Status: `Pending`
- Goal: reduce unnecessary rerenders in heavy list/search views.
- Tasks:
1. Measure rerender hotspots before changing code.
2. Optimize highest-cost derived computations first.
- DoD:
1. Measurable reduction in rerender count on target views.
2. No functional behavior changes.

## Working Rules

1. One vertical slice at a time.
2. Every behavior-affecting refactor must include regression tests in the same PR.
3. Keep naming canonical:
  `caught`, `trade`, `wanted`, `variant_id`, `instance_id`.
4. TypeScript-only changes for new/edited frontend source.
5. Prefer explicit risk-reduction outcomes over purely stylistic refactors.

## Next Recommended Slice

Execute `P0.2` next:

1. Introduce shared API client policy for `fetch`/`axios` consistency.
2. Move username/public fallback behavior out of stores into service layer.
3. Add regression tests for auth/public handling paths.
4. Verify with:
  `npm run lint`
  `npm run typecheck`
  `npm run test:unit`
  `npm run build`
