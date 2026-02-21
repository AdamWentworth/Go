# Frontend + React Native Roadmap

Last updated: 2026-02-21

## 1) Snapshot

- Web frontend is stable, deployable, and CI-gated.
- `P0` hardening is complete.
- `P1` CSS cleanup/guardrails is complete.
- Current focus is `P2`: ship React Native using a shared-core architecture.

## 2) Architecture Decision (Locked)

We are using:

1. Shared core packages (`packages/*`) for contracts, domain logic, and reusable non-UI logic.
2. Separate UI applications for each platform:
   - Web: React + Vite
   - Mobile: React Native + Expo

We are not doing a DOM-in-native strategy as the primary path.

## 3) Delivery Targets

1. RN MVP ready for real device testing: **8-12 iterations**.
2. Near-full web feature replica in RN: **16-22 iterations**.

One iteration = one scoped, test-backed change set that keeps CI green.

## 4) Completed Work

### P0 Hardening (Done)

1. Date safety normalization.
2. Accessibility semantics/keyboard support.
3. A11y lint enforcement in CI.
4. Coverage gate enforcement.

### P1 CSS Governance (Done)

1. Token layer rollout.
2. CSS architecture boundaries and conventions.
3. Large file split/reduction.
4. Stylelint enforcement in CI.

### P2.1 Shared Extraction (In Progress)

Done:

1. Shared endpoint contracts extracted for `users`, `search`, `auth`, `trades`, `location`, `events`, `pokemon`.
2. Shared common response envelope type extracted (`ApiResponse<T>`).
3. Shared domain normalizers extracted.
4. CI preflight added for shared-contracts wiring.
5. Shared DTOs centralized and consumed by web for:
   - user overview
   - auth session payloads
   - user-search outcomes
   - pokemon search request shape
   - events update envelope + SSE endpoint/query
   - partner info/reveal payloads

## 5) Remaining Work by Phase

### P2.1 Shared-Core Completion (Now)

Objective: finish transport/domain extraction so mobile can consume stable packages.

Remaining:

1. Sweep for any remaining frontend-local transport DTOs and endpoint string duplication.
2. Move reusable non-UI helpers from `frontend/src` to shared packages where low-risk.
3. Add/expand contract tests for extracted modules.
4. Lock package-level versioning/release conventions (internal is fine, but explicit).

Exit criteria:

1. Web uses shared contracts for all backend boundaries.
2. No duplicated transport DTO definitions across services.
3. Contract tests + typecheck + lint all green.

Estimated remaining: **2-4 iterations**.

### P2.2 Mobile Bootstrap

Objective: create runnable Expo app using shared contracts/core.

Work:

1. Scaffold `apps/mobile` with Expo + TS + lint/test baseline.
2. Configure env/runtime config for API endpoints.
3. Wire auth shell + navigation skeleton.
4. Consume shared contracts in mobile service layer.

Exit criteria:

1. Mobile app runs on simulator/device.
2. Auth/session bootstrap path functional.
3. Shared contracts imported directly by mobile.

Estimate: **2-3 iterations**.

### P2.3 Vertical Slices (RN)

Objective: prove end-to-end business value without web regressions.

Suggested order:

1. Trainer search list + user lookup.
2. Pokemon detail read path.
3. Instance list read path (caught/trade/wanted views).

Exit criteria:

1. At least one full production-grade slice is stable (`MVP gate`).
2. Shared-core reuse is verified in real app flows.

Estimate: **4-6 iterations**.

### P2.4 Parity + Hardening

Objective: move from MVP to near-full parity with explicit tradeoffs.

Work:

1. Build parity matrix (web feature -> mobile status/owner/target).
2. Port remaining high-value flows (trade management, profile/account, tag interactions).
3. Add RN performance + crash + network resilience checks.
4. Release hardening (offline/cache strategy, error UX, observability).

Exit criteria:

1. Near-full parity on prioritized features.
2. Stable release candidate with monitoring and rollback plan.

Estimate: **8-10 iterations**.

## 6) Priority Rules

1. No business logic behavior change without tests in same iteration.
2. Keep canonical naming: `caught`, `trade`, `wanted`, `variant_id`, `instance_id`.
3. Dev logs enabled in dev; suppressed in prod.
4. Keep CI green every iteration (`test`, `typecheck`, `lint`, contract checks).

## 7) Risks and Mitigations

1. Map stack mismatch (OpenLayers web vs RN maps):
   - Mitigation: isolate map logic behind adapter interfaces before full UI parity work.
2. Offline/cache behavior divergence:
   - Mitigation: define shared cache contract + platform-specific storage adapters.
3. UI parity drag from web-specific patterns:
   - Mitigation: parity matrix and explicit “native-appropriate” UX decisions.
4. Scope creep during refactors:
   - Mitigation: keep extraction and feature work in separate iterations.

## 8) Next 3 Iterations (Immediate Plan)

1. Complete remaining `P2.1` DTO/contract sweep and remove duplicated service payload types.
2. Extract next safe shared non-UI utilities used by both search + user flows.
3. Add/expand contract tests to lock shared API boundaries, then cut over to `P2.2` mobile scaffold.

## 9) Definition of Success

1. RN app is testable on device with shared-core contracts.
2. Web remains stable with no regression in core flows.
3. Shared packages become the single source of truth for backend-facing contracts.
