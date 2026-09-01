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

`parity:routes:web:performance` applies that same production/minified mode to
the real-route browser harness. It remains a browser proxy rather than Android
frame evidence, but prevents React development overhead from being mistaken
for release-bundle latency.

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

- native Jest: 158 suites, 828 tests;
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

The final 2026-09-01 `/pokemon` architecture audit found that the previous
native optimization had moved away from Vite in an expensive direction. Vite
mounts three page panels but only one virtualized Pokémon grid. Native had begun
mounting as many as twelve independent image grids to prepaint tag results.
Because FlatList's multi-column batch counts represent rows rather than cards,
that could retain hundreds of hidden card/image views and make Android compose
them during every page slide. Native now mirrors Vite again: one grid receives
a cached immutable tag projection before the native-driven track starts moving.
No background timer can add hidden grids later.

Filtering, sorting, tag summaries, per-visible-row cards, and image source
objects remain cached. The canonical collection rows now enter FlatList
directly; Native no longer projects all 3,285 catalog entries into duplicate
card objects or constructs a full row-ID lookup map before virtualization can
take effect. Background work warms only the first eighteen plain card
projections and waits for the app-owned interaction scheduler; it never mounts
an offscreen list. The tag gallery loads the twelve phone-visible preview
images and, like Vite's eighteen-source preview, prefetches the six CSS-hidden
sources without mounting hidden native image views. The active FlatList keeps
a Vite-sized three-viewport window and six-row initial/batch budget. React
Native applies that budget after grouping columns, so this pins 18 rather than
the previous 36 phone cards while still covering a tall viewport. It also uses
a stable key extractor, stable card renderer, and React Native 0.86's renderer
memoization flag. The search/tag controls now sit outside the virtualized list,
matching Vite's fixed-header topology and keeping header cells out of every
data reconciliation. Tag changes reset the offscreen grid before changing its
data, while ordinary vertical movement persists session state only after drag
or momentum settles. Remote image source objects are reused across theme,
selection, and tag updates, use Android's force-cache policy, and downsample
only genuinely oversized badges and tiny type glyphs. The multi-column
FlatList keys its outer native rows by stable absolute slots, matching Vite's
`row-${row}` reconciliation instead of tearing down every visible row when
Pokémon IDs change during a tag swap. Static card layers and search/sort
controls are memoized, and tag cards no longer apply the non-Vite shrink
transform or alpha fade on press. The ownership glow now stays mounted on every
visible card, as Vite's pseudo-element does, and toggles opacity instead of
mounting an image layer during a catalog-to-tag transition. The delayed
Tags/Wishlist sublabel clock starts with the actual native-driven slide rather
than with the preceding data commit, keeping that header update off the final
motion frame.

The collection route now also preserves its navigation, retry, organizer, and
tag-mutation callback identities, while the Hub and three-panel slider are
memoized. The Hub passes a stable keyed panel array, so ordinary JSX child-array
allocation no longer defeats that memo. Cache-to-network query bookkeeping,
the action menu, notices, and unrelated dialog state can no longer invalidate
the active Pokémon grid or make all three panels reconcile.
Tag-mutation pending state still updates the controls that need it without
recreating the card renderer. A dedicated hook regression test pins those
callback identities across route rerenders.

The three-panel collection swipe continues to stream finger movement directly
from Gesture Handler into the native Animated graph, uses Vite's shared 30%
peek limit and 100 px threshold, and hands the exact drag position to the
settling animation so the current page cannot flash or reload first. The
Pokémon result and selected tab commit together before the canonical 300 ms
slide; only the offscreen Tags/Wishlist sublabel waits until that slide ends,
matching Vite. The current and destination panels are rasterized only after the
destination commit and while moving, avoiding a stale offscreen draw before the
grid changes, then are released afterward. React Native 0.86's deprecated InteractionManager is a stub, so an
app-owned scheduler tied to this real slider lifecycle protects animation
frames from projection warming.

Route entry is now cache-first and network-authoritative. A durable collection
snapshot, including retained offline edits, can paint while the canonical
network refresh continues. A slower SQLite read can never overwrite an already
completed network response, and writing a replaceable refreshed snapshot no
longer delays the first interactive grid. This closes a separate cold/open
latency gap with Vite's already-populated client store.

The real-route collection budget measures the first interactive destination
card before separately asserting the deliberately delayed header sublabel. The
latest complete matrix passed all 92 route/theme states and measured 509 ms for
the For Trade workflow, including the canonical 300 ms slide.

The next transition-frame pass now supplies FlatList with the exact deterministic
card-row geometry, mirroring Vite's explicit virtualizer row-height model rather
than waiting for Yoga measurements. It starts the native-driven track from the
destination grid's layout commit instead of inserting another animation frame;
development traces moved touch-to-motion from roughly 81–85 ms to 57–71 ms.
Card dimensions, image-stage styles, theme text styles, and ownership-glow styles
are stable objects across data swaps, and the CP label/value use one native text
surface. Tag previews also warm the first result window's type glyphs, while a
tag reset no longer emits a redundant session update when the grid is already
at the top.

The production/minified harness now measures from the browser-dispatched pointer
event separately from Playwright's pre-click actionability wait. Its focused For
Trade run painted the first destination result in 72 ms, began track movement in
4 ms, produced 20 distinct sampled positions, and kept its largest sampled frame
gap to 33.3 ms. The harness enforces 150 ms response/start ceilings, at least 12
visual steps, and no sampled gap above 80 ms. These generous CI thresholds catch
regressions without pretending a headless browser proves physical Android fps.

The latest input-latency pass found another native-only lifecycle mismatch:
focusing search unmounted its TextInput and FlatList, then the first character
rebuilt both. The search control now remains mounted like Vite's SearchUI, owns
an urgent local value, and sends the collection update through one React
transition rather than transition plus deferred-value commits. The grid remains
warm and inaccessible beneath the filter overlay. Search expressions are
compiled once per update and normalized row tokens/words are cached instead of
repeating that string work for every Pokémon. A new production guardrail
requires a dispatched catalog search to paint its matching card within 150 ms;
repeat runs measured 88–120 ms, down from the initial measured 231 ms.

Android page motion no longer rasterizes the entire three-screen-wide track as
one texture. Only the current and destination panels receive temporary hardware
textures during programmatic slides (with adjacent candidates covered during a
finger drag), and all are released when motion ends. This preserves the single
native-driven Vite timing/transform while reducing the normal tag-to-Pokémon
snapshot area by one third and avoiding an unnecessarily wide GPU surface. The
post-change production proxy measured the tag result at 74–81 ms, motion start
at 5–8 ms, 20–21 distinct positions, and a 16.7–33.5 ms largest sampled gap.

The follow-up interaction pass removes the remaining redundant work on common
paths. Tapping the already-selected tab is now a true no-op, matching React's
same-state behavior in Vite instead of starting another 300 ms animation and
allocating panel textures. After the visible tag-card window is prepared, the
idle interaction scheduler also warms normalized search projections in bounded
128-row slices. Exact searches reuse reference-stable results, while ordinary
positive typing narrows the preceding prefix result rather than rescanning all
3,285 catalog rows for every key. The production guard now sends real sequential
key events through that path. It measured the final-key-to-Charizard paint at
81 ms. The filtered count is committed with the visible result window before
paint, restoring Vite's count behavior without adding state work to the
empty-query tag-swap path. The same run began track motion in 2.5 ms, painted the
tag result in 92 ms, produced 19 sampled positions, and kept the largest sampled
gap to 33.3 ms.

## Remaining approval gate

The latest bundle still needs a short physical-phone pass for perceived frame
rate and touch latency, especially the action menu, loading spinner, theme
switch, collection page swipe, and Home-to-filtered-collection links. Automated
browser timings cannot prove Android rendering smoothness.
