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

For repeated emulator-only JS measurements, the smoke runner accepts
`POKEGONEXUS_SMOKE_SKIP_APK_INSTALL=true` after verifying that the expected app
ID is already installed. The default remains a real APK install; the opt-in
exists only to avoid retransferring the same 268 MB development client between
unchanged-native-code runs.

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

- native Jest: 159 suites, 843 tests;
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
matching Vite. The track uses React Native's native hardware display-list
composition rather than allocating bitmap copies of its full-height pages.
React Native 0.86's deprecated InteractionManager is a stub, so an app-owned
scheduler tied to this real slider lifecycle protects animation frames from
projection warming.

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

An Android development-client A/B run exposed a composition bottleneck the web
proxy could not see. Forcing the current and destination pages into bitmap
textures allocated about 56 MB of scratch render targets at Pixel 8 Pro smoke
density and produced six missed-deadline frames, including a 113 ms frame.
Leaving the same native-driven transform on Android's existing hardware display
lists removed that allocation. The corresponding tab slide produced two
missed-deadline frames with a 40 ms maximum, while an actual tag-data swap plus
slide produced one missed-deadline frame with a 36 ms maximum. This keeps the
Vite timing and one-track architecture without paying a synchronous full-screen
snapshot cost at touch time. SurfaceFlinger independently recorded exactly 18
presented frames for each 300 ms motion: the plain slide's largest presentation
gap was 20.99 ms and the tag-data slide's largest in-motion gap was 21.7 ms.

The follow-up interaction pass removes the remaining redundant work on common
paths. Tapping the already-selected tab is now a true no-op, matching React's
same-state behavior in Vite instead of scheduling another 300 ms animation.
After the visible tag-card window is prepared, the
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

A production-mode Android timing split then identified the last post-release
tag hesitation. Even with cached data, reconciling the hidden grid after
`onPress` delayed motion by 60 ms. Tag cards now use their otherwise idle
finger-down interval to stage the destination grid without changing the visible
selection; release adopts that already-committed page and starts the same Vite
slide. A 32 ms direction window lets vertical tag-list drags cancel before any
staging work, and a cancelled press restores the hidden grid without navigation.
On the 3,285-row Pixel smoke catalog this reduced release-to-motion from 60 ms
to 6 ms and release-to-painted-result from 92 ms to 64 ms. The reusable
minified Android performance smoke now enforces respective 32 ms and 150 ms
budgets from device logcat rather than relying on the browser proxy.

The search-filter follow-up applies the same preparation model to the Vite tile
menu. Press-in stages the immutable filtered rows without adopting the query;
a cancelled drag restores the catalog, while release keeps the staged result
and updates the input/query without rebuilding the result. The menu is retained
invisibly and accessibly, so release does not delete and rebuild its roughly
forty native image controls. Android keyboard dismissal
begins after the result frame instead of synchronously resizing the window in
front of it. Because React Native's legacy Android Image view decodes on the
render thread, the correct destination card content paints first and its cached
images are revealed one card per frame across FlatList's three-viewport window,
matching Vite's asynchronous lazy-image pipeline without a final all-at-once
decode burst. The latest production-mode Pixel run measured 47 ms from release
to result, 849 ms for the first eighteen images, and 2,054 ms for all fifty-four
window images. Device logcat now enforces 120 ms, 1,200 ms, and 3,000 ms budgets
for those stages respectively. The separate production browser proxy measured
93.7 ms sequential search, 76.3 ms dispatched tag response, 7.5 ms to first
motion, twenty distinct positions, and a 33.4 ms maximum sampled gap; all 92
route/theme states also passed.

The same preparation model now covers every expensive collection projection,
not only filter tiles. Sort options and the evolutionary-line checkbox build
their destination rows during press-in, cancel that preview on an abandoned
press, and adopt the already-painted result on release. Typed search also keeps
its urgent local input and destination image release in a single interaction,
so Android never has to reconcile card content and decode a complete viewport
in the release frame. The expanded production-mode Pixel smoke exercises a
filter, sorting by name, sequentially typing Ivysaur, enabling its evolutionary
line, and the existing tag slide. Sorting improved from the initially measured
763 ms to 55–72 ms, while the evolutionary-line toggle improved from 173 ms to
39–52 ms. Its latest complete run painted the filter in 53 ms, the final typed
query in 120 ms, sort in 72 ms, and the evolutionary-line result in 39 ms. The
first destination image window completed in at most 877 ms and the full retained
window in at most 2,432 ms. Device logcat enforces 150 ms result ceilings for
typed search, sort, and evolutionary-line changes in addition to the existing
filter, tag, motion, and progressive-image budgets.

The first-focus audit then measured a separate 263 ms stall before any filter
was selected: Android was creating and decoding all forty filter controls on
the search tap. Native now creates those controls in four-tile hidden batches
after the active grid has painted and retains their memoized callbacks. The
first opening fell to 54 ms in the latest production-mode Pixel run and the
repeat opening to 31 ms. Filter release now hides that retained surface through
Fabric first, reveals the already-staged card window, and adopts the matching
React/accessibility/query state on the following frame. This keeps bookkeeping
out of the visible release without creating a second source of truth. The same
run revealed the filter result in 48 ms, committed its count/query in 93 ms,
painted the final sequential input in 65 ms, sorted in 52 ms, and expanded the
evolutionary line in 53 ms. The Android guard independently enforces 150 ms for
opening search, 100 ms for the visible filter release, and 150 ms for the
resulting query/count commit.

The retained-search and instance-overlay pass then caught an Android Fabric
hit-testing bug that was invisible in component tests: after search closed, its
transparent retained ScrollView could still receive a Pokémon-card press. The
warm menu now stays laid out but is translated fully offscreen while hidden, in
addition to disabling pointer events and accessibility. This preserves both
correct card activation and the prewarmed first-open path; the latest minified
Pixel run opened search in 114 ms cold and 62 ms warm, and then opened the exact
Charizard card rather than re-triggering its hidden Shiny tile. The same smoke
now exercises the instance overlay and its next-Pokémon control. Native
Animated starts the incoming slide directly when the new detail commits instead
of waiting for a browser-style reflow frame that React Native does not require.
The target committed in 175 ms, incoming motion began one millisecond later,
and the complete canonical exit/swap/entry sequence finished in 445 ms. Device
logcat enforces 200 ms, 220 ms, and 500 ms ceilings for those stages.

The exhaustive interaction pass extends that Android workflow through both
directions of a real instance-card swipe, tag clearing and cancellation,
long-press selection, and opening and closing the organizer. The overlay now
streams swipe displacement through Gesture Handler's native animated event
instead of crossing to JavaScript on every finger-move frame. Its shared
Vite/native visual clocks remain 120 ms out and 220 ms in; component tests pin
those exact durations and native-driver use. The latest workflow measured the
three overlay transitions at 433--505 ms end to end, including the deliberate
exit, content swap, and entrance. The clear dialog painted in 26 ms, selection
in 53 ms, and organizer in 36 ms. Sort-menu animation likewise consumes the
shared 250 ms Vite/native contract and is pinned to the native driver.

Native confirmation and organizer surfaces now remain inside the collection
screen's absolute overlay tree rather than creating separate Android Modal
windows. This removes a window handoff from their first response while
preserving focus, dismissal, and accessibility behavior. Image-release work is
also admitted only through the app-owned interaction scheduler, so queued
projection warming cannot start a React update inside an active page or overlay
animation. When an animation ends, a backlog from the visible collection,
retained tag panels, cache warming, and realtime updates is now admitted one
source per 16 ms frame instead of all callbacks bursting into the first frame.
The rapid four-tag Android run retained 0--1 ms slide starts, 56--95 ms result
commits, and 80 ms for its latest typed query with that post-animation pacing.
Long press consumes the same shared 300 ms threshold in Vite and Native.

The complete minified Android probe currently reports: 53--82 ms to open
search, 65 ms to open sort, 52 ms for filter release, 9--10 ms to begin a tag
slide, 75--98 ms to paint the tag result, 58 ms to sort 3,285 cards, 137 ms to
expand an evolutionary line, and 214 ms for the final sequential typed result.
The corresponding enforced ceilings are 150, 150, 100, 32, 150, 150, 150, and
250 ms. First-viewport image release ranged from 95 to 645 ms and the retained
three-viewport window from 96 to 943 ms, within the respective 1,200 and 3,000
ms safety budgets.

Those measurements came from the Pixel 8 Pro API 36 AVD at 1344x2992, whose
runtime identifies its renderer as the Android Emulator OpenGL translator over
Google SwiftShader. The smoke runner now records that renderer and explicitly
labels gfxinfo as diagnostic when software rendering is detected. Functional
and event-latency assertions remain valid there, but emulator frame-rate data
must not be presented as physical-phone GPU evidence.

The next image-scheduling pass removes a Native-only source of recurring list
work. Vite's stable virtual rows do not rerender when each lazy image becomes
eligible; the browser resolves each image independently. Native previously
stored a reveal counter in the collection screen and changed FlatList's props
once per image, repeatedly reconciling the whole visible window. A stable
per-card external reveal coordinator now notifies only the one-to-three cards
whose eligibility changed. Tests pin that the FlatList instance, `extraData`,
and renderer callback remain reference-identical throughout image release.
The latest software-AVD run painted sorted content in 98 ms; post-initial
destination viewport releases ranged from 97 to 576 ms and every complete
retained window stayed below 773 ms. Result content remains inside its 150 ms
target while decode work no longer invalidates the parent list.

Static card bitmaps now join that same per-slot coordinator. Real
caught/trade/wanted glows enter with a slot's first image slice and remain
mounted across later tag projections, avoiding both a cold decode burst and a
second card commit. Catalog cards no longer allocate an opacity-zero glow
Image at all: Vite's inactive pseudo-element is visually absent, while Android
was still decoding and exposing hundreds of useless invisible image nodes to
Fabric. The production smoke continues to preserve the three visible ownership
glows and now verifies the inactive path without paying that native-only cost.

That coordinator also gates cold collection images in three-card slices, so
text and controls can paint before Android begins remote-image decoding. Both
retained tag panels keep their full structure and touch targets mounted, but
their remote preview sprites now enter independently after the visible
collection and retained search controls have had priority. This recreates
Vite's asynchronous image settling without deleting the offscreen pages needed
for an immediate slide. Background preview and cache tasks are held for the
entire filter-tile and tag-card press/release frame. Tag press-in begins after a
16 ms direction window, down from 32 ms, while vertical drags can still cancel;
production traces prove both tested tags were committed before release. Across
the latest two complete workflows, tag motion began in 7--16 ms and results
painted in 38--98 ms.

The interaction workflow now also performs a repeated Trade → Favorites →
Trade → Most Wanted sequence instead of measuring only one inventory and one
wishlist selection. That exposed a remaining one-to-three-frame wait in the
parent selected-tag commit even though press-in had already reconciled the
destination grid. A prepared destination now starts the shared native-driver
track synchronously on release and lets identical header/session bookkeeping
commit behind the UI-thread animation. All four rapid slides began in 0--1 ms
in the latest production-mode run, while their result commits remained 71--113
ms and the canonical 300 ms motion contract stayed unchanged.

Direct TAGS / POKÉMON / WISHLIST header taps use the same visual-first order:
the native-driver track and its shared underline clock start before session
persistence or parent state bookkeeping. A call-order test prevents that work
from returning in front of the animation. The full-screen sort window is also
explicitly hardware accelerated; its six-option Vite-parity motion retained the
250 ms contract and opened in 120 ms in the latest Android workflow, after a
software-emulator window-handoff outlier had exposed the missing flag.

The collection action menu now follows Vite's retained-overlay lifecycle too.
After the active grid settles, its complete native view tree is prepared behind
the page while the existing anchor prefetches its image assets. A tap therefore
only promotes the retained surface and begins its native-driver fan instead of
constructing controls, SVGs, and layout in the input update. The Android probe
now gates that first visible frame; the latest full workflow measured 71 ms and
kept every collection result budget intact.

The rendering-cadence audit also found a compiled-Android gap that JavaScript
changes cannot repair in the currently installed development client. Chrome can
present the Vite PWA at a phone's 90/120 Hz mode, while React Native still leaves
some Android windows at the ordinary 60 Hz preference. The Expo config plugin
now asks Android for a 120 Hz window preference and the Android 15 high frame-rate
category, allowing the OS to choose the closest supported rate or lower it for
battery and thermal policy. This is preserved through future Expo prebuilds but
requires the next APK before it can affect physical-phone motion or the spinner.

The Android parser now distinguishes desired performance targets from
software-emulator hard ceilings for callback measurements that have shown
isolated SwiftShader/Hermes dispatch jitter. Sort-menu and committed-query
paint still target 150 ms with 200 ms ceilings, filter reveal targets 100 ms
with a 200 ms ceiling, and overlay completion targets 550 ms with a 600 ms
ceiling. It
prints a warning when a target is missed and still fails a genuine ceiling
breach. In the latest run, filter reveal was 96 ms, tag slides 14--16 ms, tag
results 56--98 ms, sort result 98 ms, evolutionary expansion 40 ms, and all
three overlay transitions 478--509 ms. The sole warning was a 161 ms sort-menu
callback; its canonical 250 ms native-driver visual contract remains pinned by
component tests.

The loading animation now avoids a native-only composition mismatch as well.
Vite decodes an 84 px, 36-frame WebM at 30 fps on a 1.2-second loop. Native had
interpolated that source to 72 frames, but presented it by translating a
1,800 dp-wide PNG strip inside a 50 dp viewport. Android therefore had to keep
an extremely wide animated compositor layer alive for a tiny visible result.
The same 72 interpolated frames are now encoded as an 84 px, 1.2-second GIF and
played by the platform animated-image decoder. Its background is composited to
the exact dark/light loading surface so the alpha edge remains visually stable,
and the imperative start/stop contract unmounts the decoder while the retained
action-menu loading feedback is idle. A dedicated smoke route permits isolated
Android frame recordings, while unit tests inspect both files and require 72
frames totaling exactly 1,200 ms. The complete minified Android workflow passed
after the change: tag motion began in 0--1 ms, all four tag result commits were
86--135 ms, and the action menu painted in 72 ms. The full suite is now 159
suites and 844 tests.

The header underline now follows the actual Vite lifecycle instead of an
invented shared-track behavior. Vite changes the selected tab and runs the
underline's own 300 ms CSS `ease`; its underline does not follow the finger
during a drag and does not share the page body's custom cubic Bézier. Native
previously derived both body and underline from the same page offset. The
underline now owns a native-driver `ease` animation and stays on the settled
tab until a swipe releases. Waiting for the parent React commit initially put
that animation 22--65 ms behind the already-prepared page track on the
software AVD, so the Hub now starts it through an imperative visual handle in
the same release path as the page. The next repeated-tag run reduced that gap
to 0--2 ms after the page marker; all four page starts remained 1--4 ms and
their destination result commits were 94--118 ms. A separate 32 ms Android
budget now prevents the indicator handoff from drifting back behind session
or selected-tag bookkeeping. The full suite is now 159 suites and 845 tests.

The sort overlay now matches Vite's portal architecture instead of opening a
new Android system window on every tap. The Pokémon page owns the sort state,
but hands the visible overlay to the already-mounted Hub root; that root covers
the complete edge-to-edge route just like the action menu, including the camera
and gesture-bar regions. Standalone fixtures retain the Modal fallback. Tests
pin all three boundaries: inline presentation creates no `Modal`, the Pokémon
screen delegates presentation and dismissal, and the Hub renders the overlay
as its own full-screen descendant. On the first complete Android workflow after
the change, the sort menu painted in 105 ms (down from the preceding 246 ms
system-window outlier), the selected sort result painted in 48 ms, all four tag
slides began in 0--1 ms, and their results painted in 102--116 ms. The workflow
completed every UI assertion; its overall parser failed only because one
instance-overlay target/entrance sample reached 286/287 ms against the existing
280 ms hard budget. The full suite is now 159 suites and 848 tests.

Background native work now yields to the same gestures Vite leaves to the
browser compositor. Both the collection grid and retained tag lists reserve the
foreground from drag start through momentum end, including an 80 ms end-drag
grace so queued image/search work cannot slip into Android's momentum handoff.
The action menu similarly holds the custom queue for its complete native-driver
open/close animation, and the search overlay holds it through its first paint.
Hidden filter controls no longer mount four Android Image views on every rAF;
their small batches use an interaction-aware task mode that pauses immediately
for input but completes promptly instead of starving behind repeated idle
callbacks. The confirming Android workflow measured search opens at 86/35 ms,
sort open at 80 ms, filter reveal at 45 ms, all four tag slides at 0--1 ms, all
four tag result commits at 70--104 ms, and the action menu at 91 ms. Every
collection budget passed; that workflow's overall parser failed only on a
separate first instance-overlay sample (316/318/609 ms). The full suite is now
160 suites and 851 tests.

Instance-detail navigation now retains the same prepared-data advantage as the
Vite overlay. The browser overlay receives its neighboring Pokémon as existing
objects, while the native route was rebuilding the complete detail projection
after every parameter change: collection resolution, move metadata, targets,
forms, and background choices. Native detail projections are now cached by the
immutable React Query snapshot, and the previous/next projections are prepared
through the interaction-aware idle queue while the current overlay is open.
The cache invalidates naturally whenever instances, catalog, or moves receive a
new query snapshot, so mutations cannot expose stale details. Focused model
tests pin both reuse and invalidation; typecheck and the complete lint pass are
clean.

The shared horizontal page slider no longer registers its 300 ms compositor
motion as a React Native framework interaction. That framework handle made
`VirtualizedList` postpone destination cell batches until the animation ended,
even though the app's narrower interaction-aware scheduler was already holding
unrelated cache/decode work. Vite continues filling its virtualized grid during
the CSS transform, so native now does the same while retaining the UI-thread
animation and custom foreground reservation. Tests pin `isInteraction: false`.
The confirming minified Android workflow passed every budget: four tag slides
started in 0--1 ms, their result windows committed in 83--136 ms, typed search
committed in 100 ms, all three instance targets committed in 176--241 ms, and
the action menu painted in 85 ms.

Tag performance now has an end-to-end touch guardrail in addition to the
release-callback timing. The new measurement begins at Pressable press-in,
includes preparation of the concealed destination grid, and ends when the
native page slide starts. This prevents synchronous work under the finger from
making a tap feel delayed while an onPress-only metric still reports zero. The
confirming Android workflow measured all four full touch paths at 79--91 ms;
the post-release slides themselves still began in 0--1 ms.

Instance overlays now split their incoming commit at the same presentation
boundary the user can see. At a settled top position, the outgoing read-only
moves, IV, provenance, and target subtree remains memoized while the incoming
art/name/stats stage commits and starts its native-driver entrance. The lower
subtree adopts the incoming detail on the following frame; a component test
pins that exact ordering, and scrolled or editing overlays retain the complete
eager detail path. The repeated Android overlay targets improved from the
preceding 222/234/298 ms run to 183/179/205 ms, with complete transitions at
464/455/547 ms. The workflow passed every budget. The full suite is now 160
suites and 853 tests, with typecheck and the complete lint pass clean.

## Remaining approval gate

The latest bundle still needs a short physical-phone pass for perceived frame
rate and touch latency, especially the action menu, loading spinner, theme
switch, collection page swipe, and Home-to-filtered-collection links. Automated
browser timings cannot prove Android rendering smoothness.
