# Frontend + React Native Roadmap

Last updated: 2026-02-21

## 1) Snapshot

- Web frontend is stable, deployable, and CI-gated.
- `P0` hardening is complete.
- `P1` CSS cleanup/guardrails is complete.
- Current focus is `P2.3`: stabilizing the first mobile vertical slices on top of shared contracts.

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

### P2.1 Shared Extraction (Done)

Done:

1. Shared endpoint contracts extracted for `users`, `search`, `auth`, `trades`, `location`, `events`, `pokemon`.
2. Shared common response envelope type extracted (`ApiResponse<T>`).
3. Shared domain normalizers extracted.
4. CI preflight added for shared-contracts wiring.
5. Shared DTOs centralized and consumed by web for:
   - user overview
   - auth session payloads
   - canonical pokemon instance payload schema
   - user-search outcomes
   - pokemon search request shape
   - pokemon API base/subtype payload schema
   - events update envelope + SSE endpoint/query
   - trade record + related-instance payload schema
   - partner info/reveal payloads
6. Trade UI handler/page transport types aligned to shared `TradeRecord`/`RelatedInstanceRecord`.
7. Trade proposal request DTO centralized in shared contracts and consumed by trade proposal/action code.
8. Receiver endpoint contract centralized (`receiverContract.endpoints.batchedUpdates`) and wired into web -> service worker config.
9. Shared `buildUrl` helper centralized in contracts and consumed from frontend service layer.
10. Shared-contracts checks expanded (`receiver.ts` required in CI preflight + endpoint contract test coverage).
11. Package-level versioning/release conventions documented in shared-contracts README.

### P2.2 Mobile Bootstrap (In Progress)

Done:

1. `apps/mobile` scaffolded with Expo + TypeScript.
2. Mobile baseline scripts wired (`start`, `android`, `ios`, `web`, `typecheck`, `lint`, `test`).
3. Runtime API config added via Expo `extra` (`app.config.ts` + `.env.example`).
4. Shared contracts consumed in mobile service layer (`authService`, shared URL builder/contracts).
5. Auth + navigation shell implemented (`Login`/`Home` flow with provider + stack navigator).
6. Mobile baseline checks green (`npm run typecheck`, `npm run lint`, `npm run test` in `apps/mobile`).
7. Session persistence added via `expo-secure-store` for mobile auth bootstrap continuity.
8. Dedicated mobile CI workflow added (`.github/workflows/ci-mobile.yml`).
9. Shared UI token package added (`@pokemongonexus/shared-ui-tokens`) and wired into mobile screen styling via reusable RN style primitives.

Remaining:

1. Validate the shell on physical device/emulator (`android` and/or `ios`) against live services.

### P2.3 Vertical Slices (In Progress)

Done:

1. Mobile trainer search + user lookup baseline shipped:
   - autocomplete via shared users contract
   - foreign instances lookup with private->public fallback
   - summary rendering for caught/trade/wanted counts
   - navigation wired from mobile home shell
   - service-level tests for autocomplete and lookup fallback behavior
2. Mobile pokemon detail read baseline shipped:
   - shared-contract-backed pokemon service (`/pokemons`)
   - dedicated pokemon read-model adapters (list/detail transforms)
   - Pokemon Catalog screen with filter + detail panel
   - navigation wired from mobile home shell
   - service and adapter tests
3. Mobile instance list read baseline shipped:
   - trainer lookup maps instances into typed read-models
   - caught/trade/wanted ownership filtering in mobile UI
   - instance list rendering for looked-up trainers (`variant_id` + `instance_id`)
   - read-model tests for ownership filtering behavior
4. Screen-level test coverage + first UX polish landed for mobile slices:
   - `TrainerSearchScreen` tests for debounce autocomplete + lookup ownership filtering
   - `PokemonCatalogScreen` tests for list/detail rendering + empty filter state
   - explicit empty-state hints for autocomplete, ownership lists, and pokemon filters
5. Mobile route-surface expansion shipped with reusable service adapters:
   - `PokemonCollectionScreen` (own + foreign username collection read path)
   - `SearchScreen` (shared-contract `searchPokemon` baseline)
   - `TradesScreen` (trade overview read path + status grouping)
   - `AccountScreen` (auth/secondary profile update + delete baseline)
   - `RegisterScreen` (mobile register baseline + immediate sign-in flow)
   - auth token propagation from session storage into mobile service headers
   - new service coverage for `account`, `search`, `trades`, `overview`
6. Mobile trade mutation baseline shipped:
   - trade mutation adapters for accept/deny/cancel/complete/re-propose/delete
   - optimistic in-screen mutation updates + status reaggregation
   - receiver batched update service adapter for trade update sync
   - post-mutation server refresh for reconciliation after optimistic updates
   - unit coverage for trade mutation business rules
   - screen-level coverage for trade action + sync behavior
7. Mobile search parameter surface expanded:
   - extracted typed search query builder from form state
   - expanded filter controls for flags, optional move/iv/background/costume fields, and trade booleans
   - added query-builder unit tests to lock parameter normalization behavior
   - updated screen-level search test assertions for advanced parameter propagation
8. Mobile instance mutation baseline shipped:
   - added typed instance mutation helpers for status/favorite/most-wanted/nickname updates
   - wired own-collection mutation actions into `PokemonCollectionScreen`
   - added optimistic local updates + receiver sync for pokemon updates
   - added mutation unit tests and screen-level mutation sync tests
9. Mobile instance creation + extended mutation controls shipped:
   - added typed instance creation helper from catalog pokemon data
   - wired creation actions into `PokemonCatalogScreen` (create caught/trade/wanted)
   - expanded collection mutations for mega/fusion toggles and tag bucket add/remove updates
   - added helper-level tests for instance creation and extended mutation semantics
10. Mobile trade reconciliation UX shipped:
   - `TradesScreen` now tracks sync outcome (`idle/success/failed`) for mutation visibility
   - failed optimistic sync now exposes explicit retry action (`Retry Last Update`)
   - mutation sync failures are surfaced as persistent sync errors while server state is reloaded
   - screen-level tests cover successful mutation sync and failed->retry->success flow
11. Mobile trade lifecycle action gating shipped:
   - added status-based action rules (`proposed/pending/denied/cancelled/completed/deleted`)
   - `TradesScreen` now shows allowed actions per selected trade status
   - invalid actions are disabled at UI level for safer mutation flows
   - dedicated unit tests added for action-rule behavior
12. Mobile account/register validation parity pass shipped:
   - extracted typed validation modules for register and account flows
   - register flow now enforces username/email/password/trainer-code constraints before submit
   - account flow now validates pokemon-go-name and strict allow-location parsing (`true/false`)
   - added screen tests for register/account success + invalid-input behavior
13. Mobile account/register UX polish shipped:
   - added field-level validation checklists for register/account flows
   - added status-aware server error mapping for register/update/delete account actions
   - expanded unit coverage for validation state helpers + server error mapping
   - expanded screen coverage for friendly error UX in register/account paths
14. Mobile trade confirmation + lifecycle messaging shipped:
   - added action-level confirmation prompts before trade mutations
   - added selected-trade lifecycle detail messaging (proposed/pending/completed/cancelled/denied/deleted)
   - retained status-based action gating and reconciliation flow
   - expanded trade screen tests to cover confirm/cancel mutation paths and lifecycle labels
15. Mobile search UX parity pass shipped:
   - added post-search no-results guidance state
   - added selectable search result rows + selected-result detail card
   - added incremental pagination for large result sets (`Load More`)
   - expanded search screen tests for empty-state and pagination behavior
16. Mobile pokemon-collection editing UX pass shipped:
   - added sectioned instance editor (`status`, `attributes`, `tags`)
   - added confirmation prompts for status changes and destructive tag actions
   - upgraded custom tag management to bucket-based add/remove/clear flows
   - expanded instance mutation tests and collection screen tests for tag clear/remove + confirmations
17. Mobile trades lifecycle audit messaging shipped:
   - added selected-trade audit detail lines (proposal/accept/complete/cancel/delete + canceller)
   - integrated audit detail rendering alongside lifecycle status hints
   - expanded lifecycle message unit tests and trade screen assertions
18. Mobile search interaction polish shipped:
   - added client-side result sorting controls (distance, pokemon id, username)
   - added trainer jump CTA from selected result (`Open Trainer Collection`)
   - retained selected-result detail panel and no-results guidance
   - expanded search screen tests for sort behavior and trainer navigation flow
19. Mobile pokemon attribute validation pass shipped:
   - enforced nickname max length validation before mutation sync
   - enforced mega/fusion form requirements when enabling those states
   - added attribute-level validation hints in collection editor
   - expanded collection screen tests for invalid nickname/mega-form mutation guards

Remaining:

1. Validate first slices on device against live APIs.
2. Continue UX polish for edge network/error paths on mobile slices.
3. Close functional parity gaps for:
   - final pokemon workflow polish (advanced overlay parity beyond current sectioned editor)
   - final trade lifecycle edge-case UX polish (fine-grained confirmation copy)
   - full search parity finish (map interaction parity + remaining web-specific advanced interactions)

## 5) Parity Snapshot (Web -> Mobile)

1. `/login`: `complete` (mobile auth shell + persisted session).
2. `/pokemon`: `partial` (catalog + collection read paths exist; advanced instance workflows pending).
3. `/pokemon/:username`: `partial` (foreign collection lookup/read implemented; deeper UI parity pending).
4. `/search`: `partial` (endpoint wired + baseline UI; full filter/map parity pending).
5. `/trades`: `partial` (read + mutation baseline implemented; reconciliation UX parity pending).
6. `/account`: `partial` (update/delete baseline implemented; full form parity pending).
7. `/register`: `partial` (register screen baseline implemented; full validation/error UX parity pending).

## 6) Next Phase (P2.4) Preview

Objective: move from MVP to near-full parity with explicit tradeoffs.

Planned work:

1. Build parity matrix (web feature -> mobile status/owner/target).
2. Port remaining high-value flows (trade management, profile/account, tag interactions).
3. Add RN performance + crash + network resilience checks.
4. Release hardening (offline/cache strategy, error UX, observability).

## 7) Priority Rules

1. No business logic behavior change without tests in same iteration.
2. Keep canonical naming: `caught`, `trade`, `wanted`, `variant_id`, `instance_id`.
3. Dev logs enabled in dev; suppressed in prod.
4. Keep CI green every iteration (`test`, `typecheck`, `lint`, contract checks).

## 8) Risks and Mitigations

1. Map stack mismatch (OpenLayers web vs RN maps):
   - Mitigation: isolate map logic behind adapter interfaces before full UI parity work.
2. Offline/cache behavior divergence:
   - Mitigation: define shared cache contract + platform-specific storage adapters.
3. UI parity drag from web-specific patterns:
   - Mitigation: parity matrix and explicit "native-appropriate" UX decisions.
4. Scope creep during refactors:
   - Mitigation: keep extraction and feature work in separate iterations.

## 9) Next 3 Iterations (Immediate Plan)

1. Finish remaining `P2.2` exit criteria (device/emulator validation against live services).
2. Port register screen + finalize auth-path parity.
3. Start mutation parity for trades and pokemon instance workflows.

## 10) Definition of Success

1. RN app is testable on device with shared-core contracts.
2. Web remains stable with no regression in core flows.
3. Shared packages remain the single source of truth for backend-facing contracts.

## 11) 99% Parity Checklist (Open)

1. Pokemon page parity:
   - sectioned editor + custom tag management parity: shipped baseline
   - remaining: advanced overlay affordances and tighter field-level mutation hints
2. Search parity:
   - filter/result UX parity, pagination/selection, and trainer navigation: shipped baseline
   - remaining: map parity and web-specific advanced interactions
3. Trades parity:
   - conflict/retry/server-authoritative reconciliation UX after mutation: shipped
   - status-based actions + confirmation/lifecycle messaging: shipped
   - optional final pass: richer audit details and status-specific help copy
4. Account/Register parity:
   - baseline parity shipped (validation + field hints + mapped server errors)
   - optional final pass for fully native form affordances (inline field focus helpers)
5. Platform hardening:
   - real device validation on Android and iOS against live services
   - resilience passes (network interruptions/offline behavior/retries)
   - observability/crash hooks for mobile release confidence
