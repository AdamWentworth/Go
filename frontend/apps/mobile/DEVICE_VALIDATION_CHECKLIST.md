# Mobile Device Validation Checklist

Use this checklist for Android and iOS device smoke validation against live services.

## Current native-preview milestone

This is the device check to run before migrating additional collection edits.
The default application remains the stable WebView experience. Install the
Pokémon Go Nexus Android development APK, then run
`npm --workspace apps/mobile run start:native-preview` to expose these routes.

1. Open **Pokémon Go Nexus** (the development build, not Expo Go) while the phone
   and development computer are on the same local network, then connect to the
   local development server.
2. Sign in with email and password. Native social sign-in is not part of this
   milestone; the current app remains available as a fallback.
3. Open **Your collection**, confirm the grid loads, search/filter it, and open
   a caught Pokémon that is not currently For Trade.
4. Toggle Favorite while online. Confirm the detail and collection grid update,
   and that any Receiver-accepted state is distinguished from final server
   reconciliation.
5. Let the collection load online once, disable the phone's network, and keep
   the preview open. Confirm the cached collection remains usable and is clearly
   labelled as an offline copy.
6. Toggle Favorite while offline. Confirm the change appears immediately and
   the sync card says that one change is safely retained on the device.
7. Restore the network. Confirm automatic retry begins, then progresses from
   local/pending to Receiver-accepted and finally disappears after the users
   service observes the committed snapshot. Use **Retry** or **Check** if needed.
8. Reopen the Pokémon and confirm the final Favorite value remains correct.

This preview uses the live APIs by default, so choose a harmless caught Pokémon
and restore its original Favorite value before finishing. Use the standalone
`device-preview` APK—not the Metro-backed development client—for a definitive
force-stop/relaunch test while fully offline.

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
