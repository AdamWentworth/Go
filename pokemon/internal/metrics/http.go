package metrics

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/prometheus/client_golang/prometheus"
)

// Keep labels low-cardinality: method + route pattern + status.
// Do NOT use raw URL paths as labels.
var (
	unmatchedRouteLabel = "_unmatched"

	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests processed.",
		},
		[]string{"method", "route", "status"},
	)

	httpRequestDurationSeconds = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request duration in seconds.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "route", "status"},
	)
)

var registerHTTPOnce sync.Once

// RegisterHTTPCollectors registers HTTP metrics collectors.
//
// Safe to call multiple times. It tolerates collectors that are already registered.
// A metrics wiring issue should not crash the service.
func RegisterHTTPCollectors() {
	registerHTTPOnce.Do(func() {
		tryRegister(httpRequestsTotal)
		tryRegister(httpRequestDurationSeconds)
	})
}

func init() {
	RegisterHTTPCollectors()
}

func Middleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			ww := &statusWriter{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(ww, r)

			dur := time.Since(start).Seconds()

			route := unmatchedRouteLabel
			if rc := chi.RouteContext(r.Context()); rc != nil {
				if p := rc.RoutePattern(); p != "" {
					route = p
				}
			}

			status := strconv.Itoa(ww.status)
			httpRequestsTotal.WithLabelValues(r.Method, route, status).Inc()
			httpRequestDurationSeconds.WithLabelValues(r.Method, route, status).Observe(dur)
		})
	}
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}
