# Current Native Testing Status

Last revalidated: 2026-09-01

This is the short source of truth for continuing the Vite-to-native migration.
The canonical Vite application defines user-visible behavior. Native may use
different implementation details, but it must preserve the same content,
navigation outcomes, interaction order, terminology, and perceived motion.

## Which Android workflow to use

| Workflow | What is installed | Where the JavaScript comes from | QR behavior |
| --- | --- | --- | --- |
| Development client + Metro | The project-owned development-client APK, installed once | The currently running Metro server | Opens the installed client and loads the current bundle; it does not install an APK |
| Standalone preview/release APK | A specific APK build | Bundled inside that APK | An artifact link may download one APK; no Metro server is used |
| Expo Go | The generic Expo Go app | Metro | Not valid for this project because native-module behavior is part of parity |

The currently installed development client is the fastest path for testing JS,
TypeScript, layout, navigation, and animation changes. A new APK is needed only
when the native dependency set, Android project, Expo config plugin output, or
other compiled native code changes.

Use `start:native-preview` while instrumenting or using Fast Refresh. Use
`start:native-preview:performance` for release-like perceived-performance
checks on the same installed development client: it serves a production-mode,
minified bundle without compiling an APK. Development-only performance traces
are intentionally unavailable in that mode.

Never describe a Metro QR as installing an APK. Never combine multiple Android
artifacts behind one QR without explicitly identifying which single file the
user should install.

## Current artifact truth

The standalone APK evidence dated 2026-08-29 in
`DEVICE_VALIDATION_CHECKLIST.md` is historical evidence for that exact source
snapshot. It does not contain the latest Metro-served parity changes.

No new local Gradle build is authorized for the current checkpoint because the
previous local build exhausted the workstation and crashed VS Code. Use the
already-installed development client and Metro for current phone review. If a
new binary becomes necessary, prefer a cloud development-client or preview APK
when build quota is available.

## Current automated checkpoint

The current branch has shared Vite/native behavior contracts for Home
collection links, collection tabs and slide motion, tag clearing, action-menu
destinations and timing, theme-switch timing and geometry, and loader release
timing. Both implementations and their tests consume those contracts. Heavy
primary routes are single-instance in the native stack, and Home no longer
mounts complete collection and Pokédex route trees in the background.

Passing evidence for this checkpoint:

- native Jest: 154 suites, 809 tests;
- mobile and web TypeScript and ESLint;
- native real-route smoke: 92 guest/signed-in, light/dark route states;
- focused Vite mobile-Chromium browser coverage: 9 tests;
- all signed-in native real-route workflows, including Home summary links to
  Caught, Favorites, For Trade, and Wanted collection states, plus enforcement
  that repeated action-menu navigation cannot accumulate duplicate Home or
  collection screens;
- affected Home and collection visual/accessibility smoke in light and dark
  themes at phone and desktop widths.

The Home workflow requires the loader to clear and an interactive collection
card image to render within two seconds. This protects against the broken,
unresponsive filtered navigation previously seen on the phone, but it is not a
substitute for physical-device performance review.

The 2026-08-31 responsiveness pass also caches collection filtering/sorting,
virtualizes the trainer showcase picker, defers expensive battle/ranking/search
projections until controls can paint, removes Android's default image fade from
all 192 native image surfaces, and makes the action-menu close control respond
during its reveal. The real rendered collection workflow now enforces a 750 ms
tag-to-interactive-card ceiling. The 2026-09-01 transition-parity pass replaced
the competing ScrollView/body and indicator animations with one native-driven
three-panel track, keeps all three Vite-equivalent panels warm, and explicitly
slides from either side tag page back to Pokémon. Its final full-matrix run
measured 528 ms, including the canonical 300 ms page slide.

The follow-up tag-swap pass removed the offscreen layout/readiness wait because
the canonical Vite handler commits the selected filter and Pokémon destination
together. Native now does the same, starts the native-driven slide immediately
after that commit, keeps both tag galleries memoized, reuses card projections
for rows shared across tags, keeps card callbacks stable, and retains a
Vite-sized three-screen list window. Ownership glows use one precomputed tinted
bitmap per card instead of rebuilding a multi-node SVG gradient. The focused
real-route workflow measured 519 ms including the canonical 300 ms slide.

The 2026-09-01 exhaustive `/pokemon` fluidity audit now mirrors the remaining
Vite scheduling details more directly. Vite keeps its three page panels warm,
memoizes filtering/sorting/cards, virtualizes only the visible grid plus a row
buffer, changes the middle result before starting its compositor transform,
and delays side-panel tag-label synchronization until the 300 ms slide is over.
Native now keeps reusable tag result surfaces pre-painted, reuses sorted row,
row-id, card, and lookup-map projections, and reveals the destination surface
imperatively before reserving the middle page. It gives Android one frame to
paint that offscreen result, then starts the canonical native-driven slide;
React state catches up without changing the result partway through motion.
Animated multiply/interpolation nodes and gesture callbacks stay stable across
the tag commit, and a destination list is reset to the top while still
offscreen, matching Vite without waking two FlatLists. The three-screen track
is rasterized only during horizontal motion and released afterward, avoiding
the previous permanent giant texture invalidation during ordinary vertical
list scrolling. Automated coverage pins the pre-motion reveal and offscreen
scroll reset; the complete matrix remains 92 passing route/theme states.

The next renderer pass keeps that instant warmed-tag path without charging its
entire cost to route entry. Native paints only the active collection grid in
the first commit, then mounts one hidden tag destination per short background
slice. Sort changes update the visible surface first while hidden surfaces
consume deferred sort values, and stable per-surface refs avoid detaching and
reattaching every warmed list during a tag commit. Existing search text now
survives tag selection exactly as it does in Vite. Vertical FlatList movement
no longer calls session persistence throughout the gesture; it records the
offset only when drag or momentum settles, leaving scrolling frames native.
Coverage pins active-first warming, the one-frame tag-motion boundary, search
preservation, and settled-only scroll persistence.

The staged warm-up now prepares immutable tag rows/cards in short JS slices
before each hidden native list mounts, while ordered overlay IDs remain lazy
until an owned card is actually opened. Tag-card and region-filter backgrounds
use Expo's compiled native gradient view instead of mounting repeated SVG
definition trees. As in Vite, the destination Pokémon/tag chip is ready before
horizontal motion begins, but the offscreen Tags/Wishlist header sublabel waits
until the canonical 300 ms slide completes; this avoids a competing text/layout
mutation during the animation. Background preparation and mounted hidden grids
are capped at eleven destinations plus the active grid, so accounts with many
custom tags cannot accumulate an unbounded number of offscreen FlatLists. Each
background slice also waits for active gestures and page animations to finish;
fixed warm-up timers can no longer interrupt a swipe or compete with its native
300 ms transform. The collection page drag itself now streams finger movement
straight from Gesture Handler into the native Animated graph instead of
crossing to JavaScript on every frame. It uses Vite's shared 30% peek limit and
100 px navigation threshold, and transfers the exact drag position into the
settling animation so the current page cannot flash or reload before moving to
the next one.

The real-route collection budget measures the first interactive destination
card before separately asserting the deliberately delayed header sublabel. The
latest focused run measured 506 ms and then confirmed the header identity after
the slide; this avoids counting intentional Vite motion as result latency.

## Remaining approval gate

The latest bundle still needs a short physical-phone pass for perceived frame
rate and touch latency, especially the action menu, loading spinner, theme
switch, collection page swipe, and Home-to-filtered-collection links. Automated
browser timings cannot prove Android rendering smoothness.
