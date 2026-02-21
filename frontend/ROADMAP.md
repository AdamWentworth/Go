# Frontend Engineering Roadmap

Last updated: 2026-02-21

This replaces the old tech-debt backlog and gives a practical execution plan from the current state.

## Current Position

- Frontend status: stable and deployable with strong automated testing and CI gates.
- Recent review score:
  - Production readiness: 8.2/10
  - Code quality/maintainability: 7.8/10
  - Industry-practice alignment: 7.9/10
- Primary gaps:
  - hardening issues (date safety, accessibility semantics/enforcement, coverage gates)
  - CSS scale/consistency cost
  - mobile strategy (React Native) not yet implemented

## Execution Order (Recommended)

1. Fix hardening risks first.
2. Standardize CSS system and reduce styling entropy.
3. Implement React Native via shared core + separate UI layers.

Reason: mobile expansion is expensive; it should start from a hardened, stable web foundation.

## Phase 0 - Hardening and Guardrails (Priority: P0)

- Status: Completed (2026-02-18)
- Target window: 1-2 weeks
- Objective: eliminate avoidable runtime/accessibility/quality-gate regressions.

### Work Items

1. P0.1 Date safety normalization
   - Replace unsafe `toISOString()` usage with safe date-format helper where invalid input can occur.
   - Add unit tests for invalid/empty date input behavior.

2. P0.2 Accessibility semantics and keyboard support
   - Replace clickable non-semantic containers with proper interactive elements where applicable.
   - Ensure keyboard activation and focus states are preserved.
   - Add role/name expectations in affected view tests.

3. P0.3 Accessibility lint enforcement
   - Add `eslint-plugin-jsx-a11y` and a baseline ruleset.
   - Fix current violations and keep lint clean in CI.

4. P0.4 Coverage policy gate
   - Add minimum coverage thresholds for critical areas (start conservative, ratchet up).
   - Keep current pass/fail tests; add coverage fail-fast in CI.

### Definition of Done

1. No known invalid-date crash paths in search/trade list rendering.
2. Search list interactions are keyboard-accessible and screen-reader sane.
3. A11y lint runs in CI and is blocking.
4. Coverage thresholds are enforced and green.

## Phase 1 - CSS System Cleanup (Priority: P1)

- Status: Completed (2026-02-21)
- Target window: 2-4 weeks
- Objective: keep vanilla CSS (or evolve carefully) while making it scalable and maintainable.

### Decision Gate

Choose one of the following before implementation:

1. Option A (Recommended): keep vanilla CSS and enforce structure.
2. Option B: migrate to utility-first styling (higher churn now, potentially faster feature velocity later).

Recommendation: Option A first. It gives lower risk and protects delivery while reducing CSS debt.

### Work Items (Option A Path)

1. P1.1 Design token layer
   - Introduce centralized CSS variables for spacing, typography, color, z-index, motion.
   - Remove repeated hard-coded values in largest CSS files first.
   - Status: Completed (initial rollout, 2026-02-18)

2. P1.2 CSS architecture boundaries
   - Define folder conventions for shared primitives vs feature-level styles.
   - Enforce naming pattern and file size guidance for new edits.
   - Status: Completed (policy and conventions documented, 2026-02-18)

3. P1.3 Large-file reduction
   - Split highest-cost CSS files into cohesive modules (Search/Trades first).
   - Keep selectors local and reduce cascade depth.
   - Status: Completed (Search/Trades high-cost files split, 2026-02-18)

4. P1.4 Styling quality checks
   - Add Stylelint (or equivalent) with agreed rules.
   - Run in CI as non-blocking first, then blocking once clean.
   - Status: Completed (Stylelint wired and blocking in CI, 2026-02-21)

### Definition of Done

1. Tokens are used in key high-churn areas.
2. Largest CSS files are reduced/split with no behavior regressions.
3. Style linting is active in CI.
4. New styling work follows a documented standard.

## Phase 2 - React Native Implementation (Priority: P2)

- Status: In Progress (P2.1 started, 2026-02-21)
- Target window: 4-10 weeks (incremental)
- Objective: ship native apps without destabilizing the web app.

### Architecture Direction

Use a shared-domain model, not a full single-UI model:

1. Shared packages:
   - types
   - API client contracts
   - domain logic/state transforms
   - validators/formatters
2. Separate UI layers:
   - web (React + Vite)
   - mobile (React Native/Expo)

This avoids forcing web-specific dependencies (DOM/OpenLayers/CSS) into mobile.

### Work Items

1. P2.1 Monorepo/package extraction prep
   - Extract shared types and service contracts from frontend into a shared package.
   - Keep API semantics identical across platforms.
   - Status: In Progress (shared `users`, `search`, `auth`, `trades`, `location`, `events`, `pokemon` contracts extracted/wired; shared domain normalizers added; CI preflight guard added for package resolution; `UserOverview` and `PartnerInfo` DTO shapes centralized in shared contracts and consumed by web, 2026-02-21)

2. P2.2 Mobile bootstrap
   - Stand up Expo app with auth shell, navigation, and environment handling.
   - Connect to existing backend endpoints through shared service layer.

3. P2.3 Vertical slice pilot
   - Implement one end-to-end slice on mobile (recommended: Search list mode, then Pokemon detail).
   - Reuse shared logic package; implement native UI independently.

4. P2.4 Platform parity plan
   - Create explicit parity matrix (web feature, mobile status, owner, target release).
   - Roll out remaining features by priority/value.

### Definition of Done

1. Shared package consumed by web and mobile.
2. Mobile app ships at least one production-grade vertical slice.
3. No web regression caused by shared extraction work.
4. Parity roadmap is explicit and tracked.

## Parallel Constraints and Rules

1. No business-logic behavior changes without tests in the same PR.
2. Keep naming canonical across services and frontend:
   - `caught`, `trade`, `wanted`, `variant_id`, `instance_id`
3. Keep verbose logs dev-only.
4. Maintain CI green at each phase step.

## Immediate Next Sprint Plan

1. Start Phase 2.1 by extracting shared API contracts/types into a reusable package.
2. Create the minimal Expo bootstrap app with shared environment loading.
3. Keep web CI green while shared extraction lands incrementally.
