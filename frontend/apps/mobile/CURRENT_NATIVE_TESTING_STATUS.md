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

- native Jest: 158 suites, 821 tests;
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

Filtering, sorting, tag summaries, per-row cards, image source objects, row-ID
projections, and lookup maps remain cached. Background work warms only those
plain projections and waits for the app-owned interaction scheduler; it never
mounts an offscreen list. The actual tag gallery already loads the destination's
preview images before a user can tap it, matching Vite's useful image warm-up
without retaining duplicate grids. The active FlatList keeps a Vite-sized
three-viewport window and twelve-row initial/batch budget, a stable key
extractor, stable header and card renderers, and React Native 0.86's renderer
memoization flag. Its search/tag header is sticky and opaque like Vite's fixed
search header. Tag changes reset scroll in a layout effect before paint, while
ordinary vertical movement persists session state only after drag or momentum
settles. Remote image source objects are reused across theme, selection, and
tag updates, use Android's force-cache policy, and downsample only genuinely
oversized badges and tiny type glyphs. The multi-column FlatList now keys its
outer native rows by stable absolute slots, matching Vite's `row-${row}`
reconciliation instead of tearing down every visible row when Pokémon IDs
change during a tag swap. Static card layers are memoized, and tag cards no
longer apply the non-Vite shrink transform on press.

The collection route now also preserves its navigation, retry, organizer, and
tag-mutation callback identities, while the Hub and three-panel slider are
memoized. Cache-to-network query bookkeeping and unrelated overlay state can no
longer invalidate the active Pokémon grid or make all three panels reconcile.
Tag-mutation pending state still updates the controls that need it without
recreating the card renderer. A dedicated hook regression test pins those
callback identities across route rerenders.

The three-panel collection swipe continues to stream finger movement directly
from Gesture Handler into the native Animated graph, uses Vite's shared 30%
peek limit and 100 px threshold, and hands the exact drag position to the
settling animation so the current page cannot flash or reload first. The
Pokémon result and selected tab commit together before the canonical 300 ms
slide; only the offscreen Tags/Wishlist sublabel waits until that slide ends,
matching Vite. The track is rasterized only while moving and released
afterward. React Native 0.86's deprecated InteractionManager is a stub, so an
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
latest complete matrix passed all 92 route/theme states and measured 541 ms for
the For Trade workflow, including the canonical 300 ms slide.

## Remaining approval gate

The latest bundle still needs a short physical-phone pass for perceived frame
rate and touch latency, especially the action menu, loading spinner, theme
switch, collection page swipe, and Home-to-filtered-collection links. Automated
browser timings cannot prove Android rendering smoothness.
