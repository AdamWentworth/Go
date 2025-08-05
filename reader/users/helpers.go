// helpers.go
package main

import "time"

// lastUpdateToTime converts an epoch value (seconds or milliseconds) to time.Time.
// Heuristic: >= 1e12 => milliseconds; otherwise seconds.
func lastUpdateToTime(v int64) time.Time {
	if v <= 0 {
		return time.Time{}
	}
	if v > 1_000_000_000_000 {
		return time.UnixMilli(v)
	}
	return time.Unix(v, 0)
}
