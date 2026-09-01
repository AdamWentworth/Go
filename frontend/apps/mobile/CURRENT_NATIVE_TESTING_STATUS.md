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

- native Jest: 154 suites, 802 tests;
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

## Remaining approval gate

The latest bundle still needs a short physical-phone pass for perceived frame
rate and touch latency, especially the action menu, loading spinner, theme
switch, collection page swipe, and Home-to-filtered-collection links. Automated
browser timings cannot prove Android rendering smoothness.
