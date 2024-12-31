// consumer.go
package main

import (
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/sirupsen/logrus"
)

var failedMessagesFile = "failed_messages.jsonl"

func StartConsumer(ctx context.Context) {
	// Use Kafka details from the loaded configuration
	kafkaHost := os.Getenv("HOST_IP")
	if kafkaHost == "" {
		logrus.Fatal("Required Kafka HOST_IP environment variable is not set")
	}

	kafkaPort := AppConfig.Events.Port
	topic := AppConfig.Events.Topic
	maxRetries := AppConfig.Events.MaxRetries
	retryInterval := time.Duration(AppConfig.Events.RetryInterval) * time.Second

	if topic == "" {
		logrus.Fatal("Kafka topic is not configured in app_conf.yml")
	}

	var reader *kafka.Reader
	retryAttempt := 0

	for retryAttempt < maxRetries {
		// Create a new Kafka reader
		reader = kafka.NewReader(kafka.ReaderConfig{
			Brokers:           []string{fmt.Sprintf("%s:%s", kafkaHost, kafkaPort)},
			Topic:             topic,
			GroupID:           "event_group",
			MinBytes:          10e3, // 10KB
			MaxBytes:          10e6, // 10MB
			CommitInterval:    0,    // Commit manually
			StartOffset:       kafka.FirstOffset,
			ReadBackoffMin:    retryInterval,
			ReadBackoffMax:    retryInterval * 2,
			MaxWait:           500 * time.Millisecond,
			SessionTimeout:    10 * time.Second,
			RebalanceTimeout:  30 * time.Second,
		})

		// Test connection
		_, err := reader.FetchMessage(ctx)
		if err == nil {
			break
		}

		logrus.Infof("Failed to connect to Kafka (attempt %d/%d): %v", retryAttempt+1, maxRetries, err)
		retryAttempt++
		if retryAttempt < maxRetries {
			time.Sleep(retryInterval)
		}
		reader.Close()
	}

	if reader == nil {
		logrus.Fatal("Failed to establish Kafka connection after maximum retries")
	}
	defer reader.Close()

	logrus.Infof("Kafka consumer subscribed to topic: %s", topic)

	for {
		select {
		case <-ctx.Done():
			logrus.Info("Kafka consumer shutting down.")
			return
		default:
			message, err := reader.ReadMessage(ctx)
			if err != nil {
				if err == context.Canceled {
					return
				}
				logrus.Errorf("Failed to read message: %v", err)
				continue
			}

			if err := processMessage(ctx, reader, message); err != nil {
				logrus.Errorf("Error processing message: %v", err)
			}
		}
	}
}

func processMessage(ctx context.Context, reader *kafka.Reader, message kafka.Message) error {
	decompressed, err := decompressMessage(message.Value)
	if err != nil {
		logrus.Errorf("Failed to decompress message: %v", err)
		return err
	}

	var data map[string]interface{}
	if err := json.Unmarshal(decompressed, &data); err != nil {
		logrus.Errorf("Failed to unmarshal JSON: %v", err)
		return err
	}

	if err := HandleMessage(data); err != nil {
		logrus.Errorf("Error handling message: %v", err)
		saveFailedMessage(data)
		return err
	}

	if err := reader.CommitMessages(ctx, message); err != nil {
		logrus.Errorf("Failed to commit message: %v", err)
		return err
	}

	return nil
}

func decompressMessage(compressed []byte) ([]byte, error) {
	r, err := gzip.NewReader(strings.NewReader(string(compressed)))
	if err != nil {
		return nil, err
	}
	defer r.Close()

	return io.ReadAll(r)
}

func saveFailedMessage(data interface{}) {
	f, err := os.OpenFile(failedMessagesFile, os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0644)
	if err != nil {
		logrus.Errorf("Failed to open failedMessagesFile: %v", err)
		return
	}
	defer f.Close()

	b, _ := json.Marshal(data)
	_, _ = f.WriteString(string(b) + "\n")
	logrus.Infof("Message saved to %s for later reprocessing.", failedMessagesFile)
}