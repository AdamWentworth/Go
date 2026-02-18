# Performance Baseline Workflow

This workflow standardizes how we capture and compare frontend performance for changes that can affect rendering, data loading, or image behavior.

## Scope

Runtime metrics captured from the in-app perf panel:

- `FP` / `FCP`
- variants pipeline (`fetch`, `transform`, `queue persist`, `commit write`, `queue->commit`, `total`, `count`)
- image timing (`loads`, `errors`, `last`, `avg`, `p95`)

Build-time companion metrics from CI:

- startup JS gzip total
- largest JS chunks (gzip)

## Local Capture (Runtime)

1. Enable the panel in local env:
   - set `VITE_SHOW_PERF_PANEL=true` in `frontend/.env.development`
   - restart `npm run dev`
2. Open DevTools:
   - Network tab: enable `Disable cache`
   - keep CPU throttling disabled unless you are doing a dedicated throttled run
3. Hard refresh the app (`Ctrl+Shift+R`) on the page under test.
4. Execute the same interaction path for every run (example):
   - boot app
   - load variants
   - open Pokemon page and let above-the-fold images settle
5. Open `Perf telemetry [+]`.
6. Export snapshot:
   - `Copy JSON` for quick paste into PR notes, or
   - `Download JSON` to keep a file artifact.
7. Save snapshots under:
   - `frontend/tests/reports/perf/local/<label>.json` (recommended naming below)

Recommended file names:

- `baseline-main-<date>.json`
- `candidate-<branch>-<date>.json`

## CI Capture (Build-Time Companion)

`ci-frontend` writes and uploads:

- `frontend/tests/reports/perf/bundle-budget.json`
- artifact name: `frontend-perf-snapshots`

This does not replace runtime metrics; it complements them for bundle-level drift tracking.

## Comparison Template (PR)

Use this format for any perf-impacting PR:

```text
Scenario: <flow name>
Device/Browser: <machine + browser>

Baseline:
- FP/FCP: <...>
- Variants total: <...>
- Images avg/p95: <...>
- Startup gzip: <...>

Candidate:
- FP/FCP: <...>
- Variants total: <...>
- Images avg/p95: <...>
- Startup gzip: <...>

Delta:
- FP/FCP: <...>
- Variants total: <...>
- Images avg/p95: <...>
- Startup gzip: <...>

Notes:
- cache mode / network conditions / throttling
```
