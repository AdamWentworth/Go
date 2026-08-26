# Mobile Device Validation Checklist

This is the release checklist for the React Native parity implementation. The
canonical web application remains the product specification and the stable
default. Native parity is enabled only with
`EXPO_PUBLIC_MOBILE_EXPERIENCE=native-preview` until the physical-device review
at the end of this document is approved.

## Current native-preview scope

The native preview now provides native routes for the complete current product
surface rather than a collection-only lab:

- public Home, Getting Started, Help, FAQ, About, Safety, Terms, Privacy, and
  data-deletion information;
- login, registration, OAuth registration continuation, password recovery, and
  email-change verification;
- signed-in Home, collection, tags, foreign catalogs, Pokémon detail/edit
  workflows, custom tags, search, trainer profiles, friends, settings, and
  account security;
- trade preferences, proposal review, authoritative trade activity, external
  coordination details, and the shareable Trade Board;
- Pokédex, raids, Max Battles, PvP, rankings, and methodology routes;
- native action-menu navigation, deep links, not-found recovery, theme control,
  offline collection cache, Receiver-backed pending sync, retry, and canonical
  reconciliation.

No native-preview route may redirect to the canonical WebView as a substitute
for missing parity. Unknown paths must land on the recoverable native not-found
screen. The default experience must remain the canonical WebView until the
manual approval gate passes.

## Automated evidence

The deterministic Android suite lives in `.maestro/` and is run with:

```bash
npm run device:smoke:android
```

The runner starts a clean Expo Go process for each fixture and supports these
matrix controls:

```bash
POKEGONEXUS_SMOKE_COLOR_SCHEME=dark \
POKEGONEXUS_SMOKE_FONT_SCALE=1.3 \
POKEGONEXUS_SMOKE_REDUCE_MOTION=true \
POKEGONEXUS_SMOKE_DENSITY=520 \
npm run device:smoke:android
```

Before physical-device approval, retain passing evidence for:

1. all `.maestro/*.yaml` fixtures in light mode;
2. all `.maestro/*.yaml` fixtures in dark mode;
3. the high-risk collection, search, trade, auth, social, settings, Home, and
   action-menu fixtures with enlarged text and reduced motion;
4. collection and action-menu fixtures at narrow phone, wider phone/tablet, and
   desktop-reference logical widths;
5. the sync-resilience fixture covering cached, offline, pending, accepted,
   failed, retried, and canonically confirmed states.

The local static and bundle gates are:

```bash
npm run typecheck
npm run lint
npm run lint:dead-code
npm test
npm run test:browsers:web
npm --workspace apps/mobile exec expo-doctor
npm --workspace apps/mobile exec expo export --platform android
npm --workspace apps/mobile exec expo export --platform ios
```

Performance-budget tests must be rerun without an emulator, browser suite, or
other CPU-heavy job competing for the host. Resource contention is not valid
performance evidence.

## Automated validation record — 2026-08-26

The current `mobile/native-migration` candidate has completed the executable
pre-review gates below. This record establishes a review-ready candidate; it
does not replace the physical-device approval gate.

- Every checked-in Android Maestro workflow passed in light mode.
- Every checked-in Android Maestro workflow passed in dark mode.
- The accessibility matrix passed with 1.3x text and reduced motion, including
  the collection, account, custom-tag, search, action-menu, trade, and trainer
  tool workflows.
- Collection density passed at the narrow, wider-phone/tablet, and desktop
  reference widths; the action menu also passed at each reference width.
- Mobile Jest passed 647 tests. Canonical web Vitest passed 1,717 tests with two
  intentional skips.
- The full web browser matrix passed 735 tests with zero failures across
  Chromium, Firefox, desktop WebKit, mobile Safari, and mobile Chrome. Its 390
  skips are deliberate project gating for browser-specific visual,
  accessibility, PWA, or capture cases.
- TypeScript, ESLint, Stylelint, dead-code detection, shared-contract
  verification, Expo Doctor (21/21), and Android and iOS exports passed.
- The canonical web startup bundle remained within budget at 158.95 kB gzip
  against a 180 kB budget, with every individual chunk below its 130 kB budget.

Still unproven by automation: perceptual comparison on the physical Pixel,
real-provider and process-relaunch behavior on that device, a real
two-account/two-device trade, and physical iOS safe-area/input behavior. Do not
describe the candidate as absolute or production-approved parity until those
manual checks pass.

## Physical-device preconditions

1. Use a preview or release build with the native-preview flag enabled. Do not
   compare against a stale Expo Go bundle.
2. Point `EXPO_PUBLIC_*_API_URL` values at the intended production or staging
   endpoints.
3. Use an account with collection, custom-tag, friend, profile, search, trade,
   and settings data representative of the canonical application.
4. Keep the canonical PWA/WebView available on the same Pixel for side-by-side
   comparison.
5. Have reproducible online, airplane-mode, and reconnect paths.

## Pixel parity pass

### App shell and navigation

- Every current action-menu destination opens a native route without showing
  the previous route underneath while it loads.
- Android Back closes only the topmost modal, selector, or overlay before
  leaving its route.
- Adjacent Tags/Pokémon/Wishlist, Search modes, and Trades modes preserve the
  canonical slide relationship, swipe behavior, header indicator, and reduced
  motion behavior.
- Returning with Back restores the prior list/tag/search context and scroll
  position.
- The action-menu anchor, close actions, keyboards, and sticky controls respect
  safe areas and gesture navigation.

### Authentication and account

- Email/password and Google, Discord, and Facebook login reach the same account
  when the verified email is the same.
- Registration continuation, duplicate-account behavior, password recovery,
  and verification-link errors provide explicit feedback.
- Account username, email verification, password changes, provider linking and
  unlinking, session revocation, and account-deletion confirmation match the
  canonical workflow.
- An OAuth-only account requires a recent provider sign-in—not a nonexistent
  password field—to disconnect its last provider.
- Relaunch restores the secure session; logout isolates account-scoped cache and
  pending collection mutations.

### Collection and tags

- The default Pokémon view opens the entire catalog rather than a mixed tag
  subset.
- Tags, Pokémon, and Wishlist preserve the canonical header, counts, selected
  tag sublabel, sliding indicator, ordering, search, sort, selection, and
  organizer workflows.
- System and custom tags preserve their semantic colors, memberships, previews,
  reordering, edit/delete/create feedback, and inventory/wishlist ownership.
- The grid shows 3/6/9 columns at the canonical responsive boundaries and stays
  virtualized for a realistically large collection.
- Favorite/For Trade, lucky/trade, Wanted/Most Wanted, custom-tag, create-copy,
  and caught-transition constraints match the shared domain rules.
- Ordinary, shiny, shadow, purified, lucky, location-background, costume, form,
  gender, Mega, fusion, crown, Dynamax, and Gigantamax presentation matches the
  canonical helpers.
- Caught, For Trade, and Wanted overlays preserve every applicable field,
  target grid, editor, child selector, swipe navigation, stacked-close behavior,
  server feedback, and safe-area relationship.

### Search and social

- Pokémon search supports all canonical filters, preview image updates,
  background/costume normalization feedback, list/map modes, matching priority,
  result pagination/scrolling, cached return context, and correct listing
  overlays.
- Trainer search matches both Nexus username and Pokémon GO name.
- Own and foreign profile cards, showcase editing, friendship transitions,
  blocking, privacy, and external coordination fields match the canonical
  behavior without exposing private location data.

### Trades

- Preferences preserve per-Pokémon Wanted/For Trade semantics and every matching
  rule.
- Proposal review always shows the current user on the left, the other trainer
  on the right, and validates ownership, targets, active trades, friendship,
  special-trade, lucky-friend, and five-heart remote-trade rules.
- Accept, deny, cancel, dual confirmation, complete, satisfaction, re-propose,
  delete, and partner-information actions reconcile from canonical server
  responses and provide visible success or failure feedback.
- No trade command is queued offline or presented as successful before commit.

### Home, information, and tools

- Guest and signed-in Home match their canonical content, branding, imagery,
  action-menu hint, workflow links, dashboard states, and footer/legal paths.
- Public information, legal, recovery, not-found, methodology, and help routes
  remain readable and navigable in both themes.
- Pokédex, raid, Max, PvP, rankings, and Trade Board workflows preserve their
  canonical data, controls, result states, and responsive layouts.

### Theme, accessibility, and resilience

- Repeat every high-risk workflow in light and dark mode.
- Repeat with enlarged system text and with Android animations disabled; no
  label may clip, overlap, or become unreachable.
- Screen-reader labels describe every interactive control and state; focus order
  follows visual order; touch targets remain usable.
- Offline startup uses the account-scoped cached collection, pending mutations
  survive restart, retries are idempotent, and reconnect distinguishes Receiver
  acceptance from final canonical confirmation.
- No crash, blank route, stuck loading state, horizontal overflow, silent
  mutation, or cross-account cache leak is acceptable.

## Manual approval gate

Automation does not authorize cutover. Before native becomes the default:

1. Compare the Pixel native build beside the current PWA/WebView from the same
   account, theme, tag, sort, search, overlay, and scroll state.
2. Run the complete checklist in light and dark mode, including errors, offline
   recovery, keyboard entry, system Back, gestures, and process relaunch.
3. Verify that familiar information, actions, terminology, imagery, density,
   colors, and workflow step counts did not noticeably change.
4. Perform a two-account/two-device trade from proposal through dual
   confirmation and canonical collection reconciliation.
5. Perform an iOS simulator/build smoke and a physical iOS review before an iOS
   production release; shared React Native tests and an iOS export are necessary
   but not a substitute for device input and safe-area validation.
6. Record explicit approval before changing the default experience flag.
