// retry.go
package main

import (
	"context"
	"os"
	"time"
)

const retryFile = "pending_kafka_data.json"

func saveToLocalStorage(data []byte) {
	tmpFile := retryFile + ".tmp"
	err := os.WriteFile(tmpFile, data, 0o600)
	if err != nil {
		logger.Errorf("Failed to write to local storage: %v", err)
		return
	}
	if err := os.Rename(tmpFile, retryFile); err != nil {
		logger.Errorf("Failed to rotate retry storage file: %v", err)
		return
	}
	logger.Info("Data saved to local storage for retry")
}

func startRetryWorker(ctx context.Context) {
	interval := time.Duration(kafkaConfig.RetryInterval) * time.Second
	if interval <= 0 {
		interval = 60 * time.Second
	}

	ticker := time.NewTicker(interval)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				retrySendingToKafka()
			}
		}
	}()
}

func retrySendingToKafka() {
	if _, err := os.Stat(retryFile); err != nil {
		return
	}
	data, err := os.ReadFile(retryFile)
	if err != nil {
		logger.Errorf("Failed to read from local storage: %v", err)
		return
	}

	err = produceToKafka(data)
	if err == nil {
		logger.Info("Successfully sent pending data to Kafka")
		_ = os.Remove(retryFile)
		return
	}
	logger.Warnf("Failed to resend data to Kafka: %v", err)
}
