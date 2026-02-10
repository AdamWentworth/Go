package main

import (
	"log"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

var (
	metricsOnce sync.Once
	metricsReg  = prometheus.NewRegistry()

	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "users_http_requests_total",
			Help: "Total number of HTTP requests processed by users service.",
		},
		[]string{"method", "route", "status"},
	)

	httpRequestDurationSeconds = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "users_http_request_duration_seconds",
			Help:    "HTTP request duration in seconds for users service.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "route", "status"},
	)
)

func registerMetrics() {
	metricsOnce.Do(func() {
		tryRegister(metricsReg, prometheus.NewProcessCollector(prometheus.ProcessCollectorOpts{}))
		tryRegister(metricsReg, prometheus.NewGoCollector())
		tryRegister(metricsReg, httpRequestsTotal)
		tryRegister(metricsReg, httpRequestDurationSeconds)
	})
}

func tryRegister(reg prometheus.Registerer, c prometheus.Collector) {
	if err := reg.Register(c); err != nil {
		if _, ok := err.(prometheus.AlreadyRegisteredError); !ok {
			logrus.Warnf("prometheus register collector failed: %v", err)
		}
	}
}

func metricsMiddleware(c *fiber.Ctx) error {
	start := time.Now()
	err := c.Next()

	route := "_unmatched"
	if r := c.Route(); r != nil && r.Path != "" && r.Path != "/*" {
		route = r.Path
	}

	// Normalize labels to avoid pathological / invalid values from unmatched paths.
	methodLabel := normalizeMetricLabel(c.Method(), "_unknown_method", 16)
	routeLabel := normalizeMetricLabel(route, "_unknown_route", 128)
	statusLabel := normalizeMetricLabel(strconv.Itoa(c.Response().StatusCode()), "000", 3)

	defer func() {
		if rec := recover(); rec != nil {
			logrus.Warnf("metrics label panic suppressed: %v", rec)
		}
	}()

	httpRequestsTotal.WithLabelValues(methodLabel, routeLabel, statusLabel).Inc()
	httpRequestDurationSeconds.WithLabelValues(methodLabel, routeLabel, statusLabel).Observe(time.Since(start).Seconds())

	return err
}

func normalizeMetricLabel(value, fallback string, maxLen int) string {
	clean := strings.TrimSpace(strings.ToValidUTF8(value, "?"))
	if clean == "" {
		clean = fallback
	}
	if maxLen > 0 && len(clean) > maxLen {
		clean = clean[:maxLen]
	}
	return clean
}

func metricsHandler() fiber.Handler {
	// Use an isolated registry so unrelated default collectors cannot break /metrics.
	handler := promhttp.HandlerFor(metricsReg, promhttp.HandlerOpts{
		ErrorHandling: promhttp.ContinueOnError,
		ErrorLog:      log.New(logrus.StandardLogger().Writer(), "promhttp: ", 0),
	})
	return adaptor.HTTPHandler(handler)
}
