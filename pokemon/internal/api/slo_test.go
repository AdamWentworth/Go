package api_test

import (
	"net/http"
	"net/http/httptest"
	"sort"
	"testing"
	"time"
)

// TestPokemonPokemons_WarmCacheSLO is a lightweight SLO proxy gate for CI.
// It measures warm-cache request latency and error rate via httptest.
func TestPokemonPokemons_WarmCacheSLO(t *testing.T) {
	t.Helper()

	r := newTestRouter(t)

	// Warm up cache once before sampling latency.
	warmReq := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	warmReq.Header.Set("Origin", "http://localhost:3000")
	warmRR := httptest.NewRecorder()
	r.ServeHTTP(warmRR, warmReq)
	if warmRR.Code != http.StatusOK {
		t.Fatalf("warmup request failed: status=%d body=%q", warmRR.Code, warmRR.Body.String())
	}

	const samples = 200
	durations := make([]time.Duration, 0, samples)
	failures := 0

	for i := 0; i < samples; i++ {
		req := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
		req.Header.Set("Origin", "http://localhost:3000")
		rr := httptest.NewRecorder()

		start := time.Now()
		r.ServeHTTP(rr, req)
		durations = append(durations, time.Since(start))

		if rr.Code != http.StatusOK {
			failures++
		}
	}

	errorRate := float64(failures) / float64(samples)
	if errorRate > 0 {
		t.Fatalf("error rate too high: %.4f (failures=%d/%d)", errorRate, failures, samples)
	}

	p95 := percentileDuration(durations, 95)
	// CI gate target for in-process warm cache path.
	if p95 > 100*time.Millisecond {
		t.Fatalf("p95 latency too high: %s (max allowed 100ms)", p95)
	}
}

func percentileDuration(durations []time.Duration, pct int) time.Duration {
	if len(durations) == 0 {
		return 0
	}

	cp := make([]time.Duration, len(durations))
	copy(cp, durations)
	sort.Slice(cp, func(i, j int) bool { return cp[i] < cp[j] })

	if pct <= 0 {
		return cp[0]
	}
	if pct >= 100 {
		return cp[len(cp)-1]
	}

	// Nearest-rank percentile.
	rank := (pct*len(cp) + 99) / 100
	if rank <= 0 {
		rank = 1
	}
	if rank > len(cp) {
		rank = len(cp)
	}
	return cp[rank-1]
}
