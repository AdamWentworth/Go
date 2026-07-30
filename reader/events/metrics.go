package main

import (
	"strconv"
	"sync"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/adaptor"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
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

	sseActiveClients = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "events_sse_active_clients",
			Help: "Current number of authenticated SSE client connections.",
		},
	)

	sseBroadcastsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "events_sse_broadcasts_total",
			Help: "Total SSE broadcast delivery attempts by result.",
		},
		[]string{"result"},
	)

	kafkaMessagesTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "events_kafka_messages_total",
			Help: "Total Kafka messages handled by the events consumer by result.",
		},
		[]string{"result"},
	)

	outboxDispatchTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "events_outbox_dispatch_total",
			Help: "Application outbox dispatch attempts by result.",
		},
		[]string{"result"},
	)

	outboxPending = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "events_outbox_pending",
			Help: "Number of unprocessed application outbox events.",
		},
	)

	outboxOldestPendingAgeSeconds = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "events_outbox_oldest_pending_age_seconds",
			Help: "Age in seconds of the oldest unprocessed application outbox event.",
		},
	)
)

func registerMetrics() {
	metricsOnce.Do(func() {
		tryRegister(httpRequestsTotal)
		tryRegister(httpRequestDurationSeconds)
		tryRegister(sseActiveClients)
		tryRegister(sseBroadcastsTotal)
		tryRegister(kafkaMessagesTotal)
		tryRegister(outboxDispatchTotal)
		tryRegister(outboxPending)
		tryRegister(outboxOldestPendingAgeSeconds)
	})
}

func tryRegister(c prometheus.Collector) {
	if err := prometheus.Register(c); err != nil {
		if _, ok := err.(prometheus.AlreadyRegisteredError); !ok {
			logrus.Warnf("prometheus register collector failed: %v", err)
		}
	}
}

func metricsMiddleware(c fiber.Ctx) error {
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

func metricsHandler() fiber.Handler {
	return adaptor.HTTPHandler(promhttp.Handler())
}
