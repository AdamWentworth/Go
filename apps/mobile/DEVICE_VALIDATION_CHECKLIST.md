# Mobile Device Validation Checklist

Use this checklist for Android and iOS device smoke validation against live services.

## Preconditions

1. `EXPO_PUBLIC_*_API_URL` values point to production/staging endpoints.
2. Account exists for login and at least one trade + collection dataset is available.
3. Device has stable network and then a reproducible offline toggle path (airplane mode).

## Flow Checklist

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
