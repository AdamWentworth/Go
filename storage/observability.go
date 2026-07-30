package main

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

var (
	obsMetricsOnce sync.Once
	consumerReady  atomic.Bool

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

	kafkaMessagesTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "storage_kafka_messages_total",
			Help: "Kafka messages observed by storage worker, labeled by outcome.",
		},
		[]string{"result"},
	)

	kafkaMessageDurationSeconds = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "storage_kafka_message_processing_duration_seconds",
			Help:    "Kafka message processing duration in seconds by outcome.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"result"},
	)

	kafkaConsumerReady = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "storage_kafka_consumer_ready",
			Help: "Kafka consumer readiness (1=ready, 0=not ready).",
		},
	)

	syncBatchesTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "storage_sync_batches_total",
			Help: "Pokémon synchronization batches by outcome.",
		},
		[]string{"result"},
	)

	instanceMutationsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "storage_instance_mutations_total",
			Help: "Pokémon instance mutations by outcome.",
		},
		[]string{"result"},
	)

	kafkaLastSuccessUnixtime = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "storage_kafka_last_success_unixtime",
			Help: "Unix timestamp of the last successfully processed Kafka message.",
		},
	)

	failedMessagesPending = prometheus.NewGaugeFunc(
		prometheus.GaugeOpts{
			Name: "storage_failed_messages_pending",
			Help: "Number of poison messages currently retained for reprocessing.",
		},
		func() float64 {
			file, err := os.Open(failedMessagesFile)
			if err != nil {
				return 0
			}
			defer file.Close()
			count := 0
			scanner := bufio.NewScanner(file)
			for scanner.Scan() {
				if strings.TrimSpace(scanner.Text()) != "" {
					count++
				}
			}
			return float64(count)
		},
	)
)

func registerObservabilityMetrics() {
	obsMetricsOnce.Do(func() {
		registerCollector(httpRequestsTotal)
		registerCollector(httpRequestDurationSeconds)
		registerCollector(kafkaMessagesTotal)
		registerCollector(kafkaMessageDurationSeconds)
		registerCollector(kafkaConsumerReady)
		registerCollector(syncBatchesTotal)
		registerCollector(instanceMutationsTotal)
		registerCollector(kafkaLastSuccessUnixtime)
		registerCollector(failedMessagesPending)
		syncConsumerReadyGauge()
	})
}

func registerCollector(c prometheus.Collector) {
	if err := prometheus.Register(c); err != nil {
		if _, ok := err.(prometheus.AlreadyRegisteredError); !ok {
			logrus.Warnf("prometheus register collector failed: %v", err)
		}
	}
}

func setConsumerReady(ready bool) {
	consumerReady.Store(ready)
	syncConsumerReadyGauge()
}

func syncConsumerReadyGauge() {
	if consumerReady.Load() {
		kafkaConsumerReady.Set(1)
		return
	}
	kafkaConsumerReady.Set(0)
}

func observeKafkaMessage(result string, dur time.Duration) {
	if strings.TrimSpace(result) == "" {
		result = "unknown"
	}
	kafkaMessagesTotal.WithLabelValues(result).Inc()
	kafkaMessageDurationSeconds.WithLabelValues(result).Observe(dur.Seconds())
	if result == "processed" {
		kafkaLastSuccessUnixtime.SetToCurrentTime()
	}
}

func startObservabilityServer(ctx context.Context) {
	registerObservabilityMetrics()

	port := observabilityPort()
	addr := ":" + port

	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.Handler())
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})
	})
	mux.HandleFunc("/readyz", func(w http.ResponseWriter, _ *http.Request) {
		dbReady := isDatabaseReady()
		consumerIsReady := consumerReady.Load()
		ready := dbReady && consumerIsReady

		status := http.StatusOK
		if !ready {
			status = http.StatusServiceUnavailable
		}
		writeJSON(w, status, map[string]any{
			"ok":            ready,
			"dbReady":       dbReady,
			"consumerReady": consumerIsReady,
		})
	})

	server := &http.Server{
		Addr:              addr,
		Handler:           instrumentHTTP(mux),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdownCtx)
	}()

	logrus.Infof("Observability server listening on http://0.0.0.0:%s", port)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logrus.Errorf("Observability server failed: %v", err)
	}
}

func observabilityPort() string {
	for _, key := range []string{"STORAGE_HTTP_PORT", "PORT"} {
		raw := strings.TrimSpace(os.Getenv(key))
		if raw == "" {
			continue
		}
		if p, err := strconv.Atoi(raw); err == nil && p > 0 && p < 65536 {
			return strconv.Itoa(p)
		}
	}
	return "3004"
}

func isDatabaseReady() bool {
	if DB == nil {
		return false
	}
	sqlDB, err := DB.DB()
	if err != nil {
		return false
	}
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()
	return sqlDB.PingContext(ctx) == nil
}

func instrumentHTTP(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r)

		route := normalizeRoute(r.URL.Path)
		status := strconv.Itoa(rw.status)
		httpRequestsTotal.WithLabelValues(r.Method, route, status).Inc()
		httpRequestDurationSeconds.WithLabelValues(r.Method, route, status).Observe(time.Since(start).Seconds())
	})
}

func normalizeRoute(path string) string {
	switch path {
	case "/metrics", "/healthz", "/readyz":
		return path
	default:
		return "_other"
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}
