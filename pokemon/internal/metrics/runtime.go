package metrics

import (
	"log/slog"
	"sync"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
)

var registerRuntimeOnce sync.Once

// RegisterRuntimeCollectors registers Go runtime + process metrics with Prometheus.
//
// Safe to call multiple times. It tolerates collectors that are already registered
// (common in tests or when multiple packages register default collectors).
//
// NOTE: This function does not panic on registration failures; it logs errors and continues.
// A metrics registration failure should not crash the service.
func RegisterRuntimeCollectors() {
	registerRuntimeOnce.Do(func() {
		tryRegister(collectors.NewGoCollector())
		tryRegister(collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}))
	})
}

func init() {
	RegisterRuntimeCollectors()
}

func tryRegister(c prometheus.Collector) {
	if err := prometheus.Register(c); err != nil {
		// Avoid failing when already registered.
		if _, ok := err.(prometheus.AlreadyRegisteredError); ok {
			return
		}
		slog.Default().Error("prometheus collector registration failed", slog.String("err", err.Error()))
	}
}
