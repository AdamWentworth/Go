package cache

import (
	"context"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestEnsureBuiltSingleflight(t *testing.T) {
	var builds int32

	c := NewJSONGzipCache(JSONGzipCacheConfig{
		Name: "/x",
		BuildPayload: func(ctx context.Context) (any, error) {
			atomic.AddInt32(&builds, 1)
			time.Sleep(50 * time.Millisecond)
			return map[string]any{"ok": true}, nil
		},
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if err := c.EnsureBuilt(ctx); err != nil {
				t.Errorf("EnsureBuilt err: %v", err)
			}
		}()
	}
	wg.Wait()

	if got := atomic.LoadInt32(&builds); got != 1 {
		t.Fatalf("expected 1 build, got %d", got)
	}
}

func TestSendNotReadyReturns503(t *testing.T) {
	c := NewJSONGzipCache(JSONGzipCacheConfig{
		Name:         "/x",
		BuildPayload: func(ctx context.Context) (any, error) { return map[string]any{"ok": true}, nil },
	})

	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	rr := httptest.NewRecorder()

	status, _, _, _, _ := c.Send(rr, req)
	if status != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", status)
	}
}
