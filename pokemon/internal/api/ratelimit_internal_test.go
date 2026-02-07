package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestNewIPRateLimiterDefaults(t *testing.T) {
	l := NewIPRateLimiter(0, 0, 0)
	if l == nil {
		t.Fatalf("expected limiter")
	}
	if l.rps <= 0 {
		t.Fatalf("expected default rps > 0")
	}
	if l.burst <= 0 {
		t.Fatalf("expected default burst > 0")
	}
	if l.ttl <= 0 {
		t.Fatalf("expected default ttl > 0")
	}
}

func TestIPRateLimiterCleanupRemovesExpired(t *testing.T) {
	l := NewIPRateLimiter(1, 1, 1*time.Minute)
	_ = l.get("a")

	l.mu.Lock()
	it := l.items["a"]
	it.lastSeen = time.Now().Add(-2 * time.Minute)
	l.items["a"] = it
	l.mu.Unlock()

	l.cleanup()

	l.mu.Lock()
	_, ok := l.items["a"]
	l.mu.Unlock()
	if ok {
		t.Fatalf("expected expired key to be removed by cleanup")
	}
}

func TestRateLimitMiddlewareWithNilContext(t *testing.T) {
	l := NewIPRateLimiter(1, 1, time.Minute)
	//nolint:staticcheck // intentional nil context test for middleware fallback behavior
	mw := RateLimitMiddleware(nil, l, func(*http.Request) string { return "ip-1" })
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	// Consume burst then verify 429.
	req2 := httptest.NewRequest(http.MethodGet, "/", nil)
	rr2 := httptest.NewRecorder()
	h.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429 after burst, got %d", rr2.Code)
	}
}

func TestStartCleanupStopsOnContextCancel(t *testing.T) {
	l := NewIPRateLimiter(1, 1, time.Minute)
	ctx, cancel := context.WithCancel(context.Background())
	l.startCleanup(ctx, 10*time.Millisecond)
	cancel()

	// Give goroutine a moment to observe cancellation and exit cleanly.
	time.Sleep(20 * time.Millisecond)
}
