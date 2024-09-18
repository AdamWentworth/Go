// retry.go
package main

import (
	"os"
	"time"
)

const retryFile = "pending_kafka_data.json"

func saveToLocalStorage(data []byte) {
	err := os.WriteFile(retryFile, data, 0644)
	if err != nil {
		logger.Errorf("Failed to write to local storage: %v", err)
		return
	}
	logger.Info("Data saved to local storage for retry")
}

func retrySendingToKafka() {
	for {
		if _, err := os.Stat(retryFile); err == nil {
			data, err := os.ReadFile(retryFile)
			if err == nil {
				err = produceToKafka(data)
				if err == nil {
					logger.Info("Successfully sent pending data to Kafka")
					os.Remove(retryFile)
				} else {
					logger.Warnf("Failed to resend data to Kafka: %v", err)
				}
			} else {
				logger.Errorf("Failed to read from local storage: %v", err)
			}
		}
		time.Sleep(60 * time.Second) // Retry every 60 seconds
	}
}

func init() {
	go retrySendingToKafka() // Start the retry goroutine
}
