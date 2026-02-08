// consumer.go
package main

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/sirupsen/logrus"
)

var failedMessagesFile = "failed_messages.jsonl"

// These are package vars to make behavior testable without Kafka/DB.
var (
	handleMessageFn        = HandleMessage
	persistFailedMessageFn = saveFailedMessage
)

type messageCommitter interface {
	CommitMessages(ctx context.Context, msgs ...kafka.Message) error
}

func StartConsumer(ctx context.Context) {
	events := AppConfig.Events
	if events.Hostname == "" {
		logrus.Fatal("Kafka hostname is not configured")
	}
	if events.Topic == "" {
		logrus.Fatal("Kafka topic is not configured")
	}

	retryInterval := time.Duration(events.RetryInterval) * time.Second
	if retryInterval <= 0 {
		retryInterval = 3 * time.Second
	}
	maxRetries := events.MaxRetries
	if maxRetries <= 0 {
		maxRetries = 5
	}

	reader := newKafkaReader(events, retryInterval)
	defer reader.Close()
	setConsumerReady(true)
	defer setConsumerReady(false)

	logrus.Infof("Kafka consumer subscribed to topic: %s", events.Topic)

	consecutiveReadErrors := 0
	for {
		message, err := reader.FetchMessage(ctx)
		if err != nil {
			if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
				logrus.Info("Kafka consumer shutting down.")
				return
			}

			consecutiveReadErrors++
			logrus.Errorf("Failed to fetch message: %v (retry %d/%d)", err, consecutiveReadErrors, maxRetries)
			if consecutiveReadErrors >= maxRetries {
				logrus.Warn("Kafka read retries exhausted, recreating reader.")
				_ = reader.Close()
				reader = newKafkaReader(events, retryInterval)
				consecutiveReadErrors = 0
			}
			time.Sleep(retryInterval)
			continue
		}

		consecutiveReadErrors = 0
		if err := processMessage(ctx, reader, message); err != nil {
			logrus.Errorf("Error processing message (partition=%d offset=%d): %v", message.Partition, message.Offset, err)
		}
	}
}

func newKafkaReader(events EventsConfig, retryInterval time.Duration) *kafka.Reader {
	return kafka.NewReader(kafka.ReaderConfig{
		Brokers:          []string{fmt.Sprintf("%s:%s", events.Hostname, events.Port)},
		Topic:            events.Topic,
		GroupID:          "event_group",
		MinBytes:         10e3, // 10KB
		MaxBytes:         10e6, // 10MB
		CommitInterval:   0,    // Explicit commit only.
		StartOffset:      kafka.FirstOffset,
		ReadBackoffMin:   retryInterval,
		ReadBackoffMax:   retryInterval * 2,
		MaxWait:          500 * time.Millisecond,
		SessionTimeout:   10 * time.Second,
		RebalanceTimeout: 30 * time.Second,
	})
}

func processMessage(ctx context.Context, committer messageCommitter, message kafka.Message) error {
	start := time.Now()
	result := "processed"
	defer func() {
		observeKafkaMessage(result, time.Since(start))
	}()

	decompressed, err := decompressMessage(message.Value)
	if err != nil {
		result = "decompress_failed"
		return fmt.Errorf("decompress message: %w", err)
	}

	var data map[string]interface{}
	if err := json.Unmarshal(decompressed, &data); err != nil {
		result = "unmarshal_failed"
		return fmt.Errorf("unmarshal message: %w", err)
	}

	if err := handleMessageFn(data); err != nil {
		result = "handle_failed"
		// Persist-and-skip poison messages so they don't block the partition forever.
		persistFailedMessageFn(data)
		if commitErr := committer.CommitMessages(ctx, message); commitErr != nil {
			result = "handle_failed_commit_failed"
			return fmt.Errorf("handle message failed (%v) and commit-after-failure failed (%w)", err, commitErr)
		}
		result = "handle_failed_persisted"
		return fmt.Errorf("handle message failed and was persisted to retry file: %w", err)
	}

	if err := committer.CommitMessages(ctx, message); err != nil {
		result = "commit_failed"
		return fmt.Errorf("commit message: %w", err)
	}
	result = "processed"
	return nil
}

func decompressMessage(compressed []byte) ([]byte, error) {
	r, err := gzip.NewReader(bytes.NewReader(compressed))
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
