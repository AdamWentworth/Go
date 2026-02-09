package main

import (
	"strconv"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/sirupsen/logrus"
)

var (
	metricsOnce sync.Once

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

func registerMetrics() {
	metricsOnce.Do(func() {
		tryRegister(httpRequestsTotal)
		tryRegister(httpRequestDurationSeconds)
	})
}

func tryRegister(c prometheus.Collector) {
	if err := prometheus.Register(c); err != nil {
		if _, ok := err.(prometheus.AlreadyRegisteredError); !ok {
			logrus.Warnf("prometheus register collector failed: %v", err)
		}
	}
}

func metricsMiddleware(c *fiber.Ctx) error {
	start := time.Now()
	err := c.Next()

	route := c.Path()
	if r := c.Route(); r != nil && r.Path != "" {
		route = r.Path
	}
	status := strconv.Itoa(c.Response().StatusCode())
	httpRequestsTotal.WithLabelValues(c.Method(), route, status).Inc()
	httpRequestDurationSeconds.WithLabelValues(c.Method(), route, status).Observe(time.Since(start).Seconds())

	return err
}
