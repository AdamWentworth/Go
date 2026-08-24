# Mobile Device Validation Checklist

Use this checklist for Android and iOS device smoke validation against live services.

## Current native-preview milestone

There is currently no native replacement workflow ready for device approval.
The default application remains the stable canonical WebView experience. Running
`npm --workspace apps/mobile run start:native-preview` opens a clearly labelled
development parity lab and provides one path back to the canonical app. It must
not expose the earlier approximate collection grid or describe it as **Your
collection**.

The lab currently contains one deterministic, read-only **collection shell**
candidate. It has no account data or working collection actions. Compare it on
the Pixel against the canonical `/pokemon` page at the same width:

1. Confirm the three header tabs have the same order, density, type hierarchy,
   and active underline.
2. Confirm the idle search field and Favorites chip occupy the same perceived
   space and position.
3. Confirm exactly three compact Pokémon cards fit per row at Pixel portrait
   width, without dashboard-style card frames or status badges.
4. Compare CP, priority stars, image scale, Pokémon number, type icons, wrapped
   names, lucky/background layers, and Gigantamax badge placement.
5. Repeat in the Pixel's light and dark system themes.
6. Confirm Android Back returns to the parity lab and **Open canonical app**
   returns to the current application.

Any noticeable mismatch fails this candidate. Do not test live edits, caching,
or instance overlays yet; they are deliberately not connected.

## Preconditions

1. `EXPO_PUBLIC_*_API_URL` values point to production/staging endpoints.
2. Account exists for login and at least one trade + collection dataset is available.
3. Device has stable network and then a reproducible offline toggle path (airplane mode).

## Flow Checklist

The broader checklist below describes the destination architecture. Do not use
it as a claim that every workflow has already migrated from the current app.

1. Auth:
   - Login succeeds.
   - Logout succeeds.
   - Relaunch app restores session (secure store bootstrap).
2. Collection:
   - Load own collection.
   - Edit nickname/stats/moves/aura and verify persisted update after reload.
   - Confirm event-driven refresh updates list after external mutation.
3. Search:
   - Run query with filters.
   - Validate map/list toggle + sort + selection.
   - Open trainer collection from selected result.
4. Trades:
   - Load trades and status tabs.
   - Accept/deny/cancel/complete/re-propose/delete actions work as expected.
   - Reveal partner info works for pending/completed.
   - Satisfaction toggle updates completed trade.
5. Realtime:
   - Home screen shows transport/status.
   - SSE mode (if available) receives updates without manual refresh.
   - Polling fallback receives updates within expected window.
6. Resilience:
   - Disable network, verify degraded status and visible retry action.
   - Re-enable network, retry sync succeeds and state recovers.

## Pass Criteria

1. No crashes.
2. No stuck loading states.
3. No data corruption after mutation + refresh.
4. Realtime status recovers after transient network interruption.
