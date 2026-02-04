package metrics

import (
	"sync"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
)

var registerRuntimeOnce sync.Once

// RegisterRuntimeCollectors registers Go runtime + process metrics with Prometheus.
//
// Safe to call multiple times. It avoids panics by tolerating collectors that
// are already registered (common in tests or when multiple packages register
// default collectors).
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
		// Avoid panicking if the same (or an equivalent) collector was already
		// registered.
		if _, ok := err.(prometheus.AlreadyRegisteredError); ok {
			return
		}
		// For other errors, keep the previous "fail fast" behavior.
		panic(err)
	}
}
