package api

import (
	"context"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// ipRateLimiter keeps an in-memory rate limiter per client key (typically IP).
// It also does periodic cleanup so the map doesn't grow forever.
type ipRateLimiter struct {
	rps   rate.Limit
	burst int
	ttl   time.Duration

	mu    sync.Mutex
	items map[string]*ipLimiterItem
}

type ipLimiterItem struct {
	lim      *rate.Limiter
	lastSeen time.Time
}

func NewIPRateLimiter(rps float64, burst int, ttl time.Duration) *ipRateLimiter {
	if rps <= 0 {
		rps = 1
	}
	if burst <= 0 {
		burst = 1
	}
	if ttl <= 0 {
		ttl = 5 * time.Minute
	}
	return &ipRateLimiter{
		rps:   rate.Limit(rps),
		burst: burst,
		ttl:   ttl,
		items: make(map[string]*ipLimiterItem),
	}
}

func (l *ipRateLimiter) get(key string) *rate.Limiter {
	now := time.Now()

	l.mu.Lock()
	defer l.mu.Unlock()

	if it, ok := l.items[key]; ok {
		it.lastSeen = now
		return it.lim
	}

	lim := rate.NewLimiter(l.rps, l.burst)
	l.items[key] = &ipLimiterItem{lim: lim, lastSeen: now}
	return lim
}

func (l *ipRateLimiter) cleanup() {
	cutoff := time.Now().Add(-l.ttl)

	l.mu.Lock()
	for k, it := range l.items {
		if it.lastSeen.Before(cutoff) {
			delete(l.items, k)
		}
	}
	l.mu.Unlock()
}

// startCleanup runs a periodic cleanup loop until ctx is done.
// Safe to call multiple times; callers should generally call it once per limiter.
func (l *ipRateLimiter) startCleanup(ctx context.Context, interval time.Duration) {
	if interval <= 0 {
		interval = 1 * time.Minute
	}
	ticker := time.NewTicker(interval)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				l.cleanup()
			}
		}
	}()
}

// RateLimitMiddleware applies a token bucket limiter per client key.
// When limited, it returns HTTP 429.
//
// IMPORTANT: This middleware starts a background cleanup goroutine that stops when ctx is done.
func RateLimitMiddleware(ctx context.Context, l *ipRateLimiter, keyFn func(*http.Request) string) func(http.Handler) http.Handler {
	if ctx == nil {
		ctx = context.Background()
	}
	// Light background cleanup tied to ctx lifetime.
	l.startCleanup(ctx, 1*time.Minute)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := ""
			if keyFn != nil {
				key = keyFn(r)
			}
			if key == "" {
				key = "unknown"
			}
			if !l.get(key).Allow() {
				w.WriteHeader(http.StatusTooManyRequests)
				_, _ = w.Write([]byte("rate limited"))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
