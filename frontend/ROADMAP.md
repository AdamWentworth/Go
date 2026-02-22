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
20. Mobile trade edge-case guard polish shipped:
   - added fine-grained action decision guards (status + participant completion state)
   - surfaced unavailable-action hint reasons in trade detail UI
   - refined confirmation copy per action with clearer side effects
   - expanded trade rule/message/screen tests for completion guard behavior
21. Mobile search map baseline hardening shipped:
   - added typed search map model coverage for coordinate extraction, bounds, and marker layout
   - added dedicated map canvas tests for empty state and marker selection events
   - added screen-level map selection sync test (`marker -> selected result detail`)
   - normalized mobile search sort labels to ASCII-safe strings for stable rendering/tests
22. Mobile pokemon workflow overlay validation polish shipped:
   - added inline nickname/tag length telemetry in collection editor
   - disabled invalid submit actions (unchanged/too-long nickname, empty/duplicate/too-long tags)
   - surfaced explicit validation messaging for duplicate and oversized tags
   - expanded `PokemonCollectionScreen` tests for duplicate/oversized tag guardrails
23. Mobile search map advanced interactions shipped (Iteration 24):
   - location name autocomplete input wired to `/location` service with 350ms debounce
   - suggestion tap populates lat/lon fields; location query clears on filter reset
   - viewport filter toggle (On/Off) applies `isPointInViewport` to canvas points in real time
   - pan controls (N/S/E/W) and zoom controls (+/-/Reset view) for map viewport
   - filtered point count shown with `(filtered)` annotation when viewport is active
   - marker selection now shows inline popup with pokemon id, username, and ownership mode
   - `getViewportBounds` + `isPointInViewport` unit tests added to `searchMapModels.test.ts`
   - new `locationService.ts` + `locationService.test.ts` covering fetch, mapping, and error paths
   - `SearchMapCanvas` and `SearchScreen` tests expanded for popup and autocomplete/viewport flows

24. Mobile pokemon core stat editing shipped:
   - added typed CP/level/IV mutation adapter (mutateInstanceBattleStats)
   - expanded collection editor attributes section with CP/level/attack/defense/stamina fields
   - added validation guardrails for numeric format and stat ranges (IV 0-15, level 1-50)
   - prevented invalid or unchanged stat submits from dispatching receiver sync updates
   - expanded mutation and screen tests for battle-stat save and invalid-IV blocks

25. Mobile pokemon caught-details alignment shipped:
   - aligned nickname limit to web parity (12 characters max)
   - added typed caught-details mutation adapter (`mutateInstanceCaughtDetails`)
   - expanded collection attributes editor with gender + date_caught controls
   - added strict date validation (`YYYY-MM-DD`) and gender normalization guardrails
   - expanded mutation and screen tests for caught-details save + invalid-date blocking

26. Mobile pokemon move-id editing baseline shipped:
   - added typed move mutation adapter (`mutateInstanceMoves`)
   - expanded collection attributes editor with fast/charged move id fields
   - added move-id validation guardrails (whole numbers, 0+, blank to clear)
   - prevented invalid or unchanged move submits from dispatching receiver sync updates
   - expanded mutation and screen tests for move save and invalid-negative blocking

27. Mobile pokemon aura/location detail editing baseline shipped:
   - added typed aura/location mutation adapters (`mutateInstanceAura`, `mutateInstanceLocationDetails`)
   - expanded collection attributes editor with lucky/shadow/purified controls and location fields
   - normalized aura semantics to match web behavior (shadow/purified mutually exclusive; shadow clears lucky)
   - added location validation guardrails (max 255 chars for `location_caught`/`location_card`)
   - expanded mutation and screen tests for aura normalization and invalid-location blocking

28. Mobile pokemon max-stat editing baseline shipped:
   - added typed max-stat mutation adapter (`mutateInstanceMaxStats`)
   - expanded collection attributes editor with max attack/guard/spirit fields
   - added max-stat validation guardrails (whole numbers, range 0-3, blank to clear)
   - prevented invalid or unchanged max-stat submits from dispatching receiver sync updates
   - expanded mutation and screen tests for max-stat save and out-of-range blocking

29. Mobile trades status-view parity shipped:
   - added status filter pills (`all/proposed/pending/completed/cancelled/denied/deleted`)
   - trades list now renders against selected status view rather than a single flat stream
   - preserved status summary card while adding per-view empty-state guidance
   - expanded `TradesScreen` coverage for status-view filtering behavior

30. Mobile partner reveal flow shipped:
   - added typed partner-reveal service adapter (`revealTradePartnerInfo`) using shared auth/trade contracts
   - added pending/completed trade reveal action with loading/error handling in `TradesScreen`
   - added partner detail card rendering (trainer code, pokemon-go name, location, coordinates)
   - added service-level unit coverage for shared-contract endpoint wiring

31. Mobile completed-trade satisfaction rating shipped:
   - added typed satisfaction mutation adapter (`setTradeSatisfaction`)
   - extended trade action rules with participant/status guards for satisfaction updates
   - added completed-trade satisfaction toggle action in `TradesScreen`
   - added mutation/rules/screen tests for proposer/accepter/outsider satisfaction behavior

32. Mobile re-propose lifecycle normalization hardening shipped:
   - re-propose now clears stale completion flags and satisfaction flags before re-opening trade
   - retained proposer/accepter swap semantics for re-propose-by-counterparty flows
   - expanded mutation tests to lock re-propose reset semantics

33. Mobile trades lifecycle audit detail expansion shipped:
   - lifecycle audit details now include proposer/accepter satisfaction lines when present
   - confirmation-copy support added for satisfaction updates
   - expanded lifecycle-message unit coverage for new confirmation path

34. Mobile events sync baseline shipped:
   - added mobile `EventsProvider` with persisted device identity + last-sync timestamp (`expo-secure-store`)
   - wired periodic `getUpdates` polling (30s cadence) with bootstrap missed-update fetch
   - normalized events payload handling for `pokemon`, `trade`, and `relatedInstances`
   - exposed event context (`eventVersion`, `latestUpdate`, `refreshNow`) for screen-level consumers
   - added unit coverage for events session persistence, service normalization/fetch, and provider refresh behavior

35. Mobile live-refresh integration shipped for core mutation surfaces:
   - `TradesScreen` now auto-refreshes when inbound trade deltas are detected
   - `PokemonCollectionScreen` now auto-refreshes own-collection views on inbound instance deltas
   - event-driven refresh is guarded against local sync/mutation in-flight states
   - existing screen-level mutation tests remain green with events integration

36. Mobile network resilience hardening shipped:
   - introduced `requestWithPolicy` in mobile `httpClient` with timeout + retry/backoff semantics
   - retriable status handling added (408/425/429/5xx) with bounded exponential delays
   - `requestJson` migrated to policy-driven transport for auth-bearing requests
   - read services (`search`, `location`, `userOverview`, `userSearch`) aligned to policy-based requests
   - added dedicated `httpClient` retry/timeout unit coverage

37. Mobile observability bootstrap shipped:
   - added structured mobile logger helpers with dev-focused verbosity
   - added one-time runtime observability bootstrap in app root
   - installed global error-handler hook where runtime supports `ErrorUtils`
   - integrated bootstrap into `apps/mobile/App.tsx`

38. Events-service auth interoperability shipped for mobile realtime:
   - updated `reader/events` JWT middleware to accept access token via cookie, `Authorization: Bearer`, or `access_token` query param
   - retained existing cookie behavior while enabling mobile-safe non-cookie auth paths
   - added middleware tests for header/query token acceptance in `reader/events/auth_test.go`
   - validated events service test suite remains green (`go test ./...` in `reader/events`)

39. Mobile SSE hybrid transport shipped:
   - `EventsProvider` now attempts SSE stream when runtime provides `EventSource`
   - SSE URL includes `device_id` and token fallback query for non-cookie clients
   - added reconnect scheduling and automatic fallback to polling on stream failures
   - inbound SSE messages now feed the same normalized update pipeline used by polling
   - added test coverage for SSE-mode activation and message-driven version bumps

40. Mobile sync-status UX + manual recovery shipped:
   - `HomeScreen` now surfaces realtime transport/status, last sync time, and sync error state
   - added explicit `Retry Realtime Sync` action for degraded/offline recovery
   - added screen-level test coverage for realtime status panel behavior

41. Device validation artifact shipped:
   - added `apps/mobile/DEVICE_VALIDATION_CHECKLIST.md` with Android/iOS live-service smoke criteria
   - checklist covers auth, collection/search/trade flows, realtime behavior, and network resilience recovery
   - aligns validation expectations with current hybrid realtime architecture

42. Mobile app-wide connectivity recovery UX shipped:
   - added transport-level connectivity state in mobile `httpClient` (online/offline, last check, last error)
   - added `NetworkProvider` to surface connectivity state across the app shell
   - added global `NetworkStatusBanner` with explicit `Retry Connection` action
   - wired app shell (`App.tsx`) so offline/degraded state is visible across all routes
   - added unit coverage for connectivity transitions and banner behavior

43. Events reconciliation hardening shipped:
   - added payload fingerprint deduplication in `EventsProvider` to prevent duplicate version bumps
   - added event-driven refresh cooldowns in `TradesScreen` and `PokemonCollectionScreen` to reduce burst reloads
   - retained hybrid SSE + polling transport and mutation-safety guards
   - expanded provider tests to lock dedupe behavior under repeated payload refreshes

44. Search edge-network recovery UX shipped:
   - added explicit `Retry Search` recovery path when search requests fail
   - preserved current query/filter state for immediate retry flows
   - added screen-level coverage for fail-then-retry behavior

45. Mobile pokemon physical-details parity shipped:
   - added typed physical-detail mutation adapter usage in `PokemonCollectionScreen`
   - expanded collection editor with `weight`, `height`, and `costume_id` controls
   - added validation guardrails (numeric parsing + non-negative checks)
   - prevented invalid/unchanged physical-detail submits from dispatching receiver sync updates
   - expanded mutation and screen tests for physical-detail save + invalid-value blocking

46. SSE stream-token auth hardening follow-up shipped:
   - shared events contract expanded with `/sse-token` endpoint and token response/query DTOs
   - events service now issues short-lived SSE tokens (`token_use=sse`) bound to `device_id`
   - events JWT middleware now validates `stream_token` usage + device consistency for SSE requests
   - mobile realtime flow now requests SSE stream token first and uses query `access_token` only when explicitly enabled
   - expanded backend and mobile tests for stream-token path and fallback behavior

47. Mobile crash pipeline baseline integration shipped:
   - added runtime-configurable crash reporting settings in Expo config (`observability` block)
   - added `reportCrash` transport with bounded session reporting guardrails
   - added `MobileErrorBoundary` and app-shell integration for render crash capture
   - extended runtime bootstrap to report global runtime and unhandled-rejection failures
   - added unit coverage for crash reporter and error boundary behavior

Remaining:

1. Validate first slices on real Android/iOS devices against live APIs.
2. Close functional parity gaps for:
   - final pokemon workflow polish (advanced interaction parity beyond current sectioned editor)
   - full search parity finish (advanced map interactions + remaining web-specific advanced interactions)
3. Optional hardening follow-up:
   - tighten production policy by disabling query-token fallback where SSE token path is fully available
   - optionally swap/augment crash webhook pipeline with Sentry/Crashlytics provider integration

## 5) Parity Snapshot (Web -> Mobile)

1. `/login`: `complete` (mobile auth shell + persisted session).
2. `/pokemon`: `partial` (catalog + collection read paths exist; advanced instance workflows pending).
3. `/pokemon/:username`: `partial` (foreign collection lookup/read implemented; deeper UI parity pending).
4. `/search`: `partial` (endpoint wired + baseline UI; full filter/map parity pending).
5. `/trades`: `partial` (read + mutation baseline implemented; reconciliation UX parity pending).
6. `/account`: `partial` (update/delete baseline implemented; full form parity pending).
7. `/register`: `partial` (register screen baseline implemented; full validation/error UX parity pending).

## 6) Next Phase (P2.4) — Detailed Plan

Objective: move from MVP to near-full parity with explicit tradeoffs documented.

### Parity Matrix (Web → Mobile)

| Route / Feature | Web | Mobile | Gap |
| --- | --- | --- | --- |
| `/login` | Complete | Complete | None |
| `/register` | Complete | Baseline shipped | Social auth (Auth0), location overlay |
| `/account` | Complete | Baseline shipped | Password change, location coordinate selector |
| `/pokemon` (catalog) | Complete | Complete | None |
| `/pokemon` (collection read) | Complete | Complete | None |
| `/pokemon` (instance editor) | Full (20+ fields) | Core + extended editor fields shipped (stats, moves, aura, caught details, max stats, physical details, tags) | Background catalog selector parity, final overlay UX polish |
| `/pokemon` (custom tags) | Full (create/color/manage) | System tags only | Custom tag creation, color management |
| `/pokemon` (Pokedex browser) | Full (shiny/shadow/costume info) | None | Full Pokedex view |
| `/pokemon` (batch ops) | Multi-select, bulk tag | None | Batch mutation UI |
| `/pokemon/:username` | Complete | Baseline shipped | Deeper UI parity for foreign view |
| `/search` (filters) | 15+ parameters | Full parameter set shipped | None — filter surface parity complete |
| `/search` (list view) | Complete | Complete | None |
| `/search` (map view) | OpenLayers full map | Canvas with viewport/filter/popup/autocomplete baseline shipped | Remaining native-appropriate map UX refinements |
| `/trades` (read) | Complete | Complete | None |
| `/trades` (lifecycle) | Full (all actions) | Core + advanced lifecycle actions shipped | None |
| `/trades` (status views) | Per-status filtered views | Per-status filtered views shipped | None |
| Real-time sync (SSE) | Complete | Hybrid shipped (SSE where available + polling fallback) | Deeper store-level reconciliation polish |
| Offline persistence | IndexedDB (6+ stores) | None | Platform storage adapter + sync strategy |
| Raid calculator | Complete | None | Entire feature |
| Theme (light/dark) | Complete | Dark only | Light mode + toggle |

### Iteration Plan (23 onward)

#### Iteration 23 — Real Device Validation

- Boot on Android + iOS emulator/device against live services.
- Short pass/fail checklist: login, view collection, run search, submit trade action.
- Document failures as follow-up items rather than blocking this iteration.

#### Iteration 24 — Search Map Advanced Interactions

- Add viewport-style filtering (only show results inside current map bounds).
- Richer marker detail: tapping a marker shows a summary popup with pokemon name + username + ownership mode.
- Location autocomplete input wired to location service (typeahead suggestions from `/location` API).
- Pan/zoom controls persisted across searches in the same session.
- Screen + model tests for viewport filter edge cases.

#### Iteration 25 — Instance Editor: Core Fields

- Expand the `PokemonCollectionScreen` instance editor with:
  - CP display + editable level (integer or slider, 1–50).
  - IV editing: Attack / Defense / Stamina (0–15 integers with validation).
  - Gender selector (based on gender-availability from variant).
  - Date caught (date picker with platform-native component).
  - Nickname enforces max 12 chars (sync with web validation, currently 50 on mobile).
- Wire all new fields through existing `instanceMutations` + `receiverService`.
- Unit tests for IV bounds, gender validity, date serialization.
- Screen tests for editor field submission paths.

#### Iteration 26 — Instance Editor: Extended Fields

- Background/location image selector: local enum list matching web's 40+ options.
- Lucky Pokemon toggle.
- Max Pokemon toggle with max-move selection (parallel to `MaxComponent` on web).
- Purify toggle (shadow/purified state).
- Moves editor: fast move + charged move(s) selectable from pokemon's move list (from shared pokemon data).
- Height/weight display (read-only; editable if API supports it).
- Editor sections reorganized into status / core stats / moves / cosmetics / tags.
- Tests for each new mutation type and the composite editor layout.

#### Iteration 27 — Trade Feature Completions

- Add per-status filtered views to `TradesScreen` (tabs or segment control: Proposed / Pending / Offers / Completed / Cancelled).
- Re-propose action: open a simple form pre-filled with current instance data.
- Satisfaction rating: thumbs up/down after trade completes.
- Partner reveal: after trade enters pending/completed, show "Reveal Partner" option backed by `revealPartnerInfo` service.
- Tests for each new action path and status-view rendering.

#### Iteration 28 — Custom Tagging System

- Custom tag creation: name + color picker (fixed palette matching web tokens).
- Tag membership management: assign tags to instances in the collection editor.
- Tag list view on collection screen with filter-by-tag capability.
- Tag deletion with confirmation (removes from all instances).
- Backed by a lightweight in-memory tag store (no offline persistence yet; that comes in P3).
- Unit tests for tag CRUD, membership mutations, and filter logic.
- Screen tests for tag UI flows.

#### Iteration 29 — Mega and Fusion

- Mega: when enabling the mega toggle in the instance editor, show a form selector for which mega form (if multiple exist per variant data). Wire into existing mega mutation path.
- Fusion: two-step selection modal — pick left parent + right parent from own caught instances. Call the existing instance creation flow with fusion fields populated.
- Tests for mega form validation and fusion parent eligibility logic.

#### Iteration 30 — SSE Real-Time Sync

- Add `EventSource`-based SSE connection in mobile (via `expo-modules` or native fetch polyfill).
- Wire `EventsContext` equivalent: subscribe to `/events` endpoint on auth, dispatch updates to instance + trade stores.
- Auto-reconnect with 30-second check interval (matches web).
- Missed-update fetch on session resume (call `/events?since=<lastTimestamp>`).
- Device ID tracking (stored in SecureStore).
- Tests for update dispatch, reconnect logic, and missed-update fetch.

#### Iteration 31 — Platform Hardening Pass 1 (Network Resilience)

- Exponential backoff for failed API requests (3 retries, 1s/2s/4s delays).
- Request timeout configuration (global via `httpClient`).
- Network connectivity detection with offline banner UI.
- Retry button on any screen that fails to load data.
- Tests for retry behavior and offline state rendering.

#### Iteration 32 — Platform Hardening Pass 2 (Observability + Release Prep)

- Integrate crash reporting (Sentry or Expo Crash Reporter).
- Add structured error logging (dev: console, prod: Sentry breadcrumbs).
- Performance: lazy-load heavy screen data (trades/instances only fetched when navigating to that screen).
- App icon, splash screen, and metadata finalized in `app.config.ts`.
- CI smoke test against staging environment.

### Deferred / Optional (P3)

1. **Offline persistence**: AsyncStorage or SQLite adapter wrapping the same contract shapes as IndexedDB stores. Sync strategy: optimistic local mutations, server reconcile on reconnect.
2. **Raid calculator**: DPS calculator with type effectiveness — self-contained feature, lowest parity impact.
3. **Pokedex browser**: shiny/shadow/costume info panels alongside the catalog screen.
4. **Batch operations**: multi-select instances for bulk status change or tag assignment.
5. **Light mode + theme toggle**: add light palette to `shared-ui-tokens` and wire theme context.
6. **Deep linking**: configure universal links + Expo linking so shared URLs open in app.
7. **Push notifications**: trade action notifications via Expo Notifications + server-side webhook.
8. **Social auth (Auth0)**: register/login with Google/Apple via Auth0 integration.
9. **Location services**: GPS permission + automatic coordinate detection on search screen.

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

1. Execute real-device validation (`android` and `ios`) against live services with a short pass/fail checklist.
2. Close remaining pokemon/search parity UX gaps with native-first interaction polish.
3. Finalize production policy for realtime/crash hardening (query-fallback policy + optional Sentry/Crashlytics provider choice).

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
   - richer audit details and status-specific help copy: shipped
4. Account/Register parity:
   - baseline parity shipped (validation + field hints + mapped server errors)
   - optional final pass for fully native form affordances (inline field focus helpers)
5. Platform hardening:
   - real device validation on Android and iOS against live services
   - resilience baseline shipped (timeouts/retries + policy-based transport + app-wide offline banner/retry UX)
   - observability bootstrap + baseline crash reporting pipeline shipped; optional: Sentry/Crashlytics provider integration
   - hybrid realtime transport + dedupe/reload-throttle reconciliation + stream-token auth hardening shipped

