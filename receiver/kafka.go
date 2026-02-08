// kafka.go
package main

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"bytes"
	"compress/gzip"

	"github.com/segmentio/kafka-go"
)

const maxMessageSize = 3145728 // 3 MB in bytes

var writer *kafka.Writer
var writerMu sync.RWMutex

// Initialize Kafka Producer using kafka-go
func initializeKafkaProducer() {
	logger.Info("Attempting to connect to Kafka...")

	// Configure the Kafka transport with custom timeouts
	transport := &kafka.Transport{
		DialTimeout: 10 * time.Second,
		IdleTimeout: 5 * time.Minute,
	}

	// Create the Kafka writer with optimized settings
	writerMu.Lock()
	defer writerMu.Unlock()

	writer = &kafka.Writer{
		Addr:         kafka.TCP(kafkaConfig.Hostname + ":" + kafkaConfig.Port),
		Topic:        kafkaConfig.Topic,
		Balancer:     &kafka.LeastBytes{},
		BatchTimeout: 10 * time.Millisecond,
		RequiredAcks: 1,
		Async:        false,
		Transport:    transport,
	}

	logger.Infof("Kafka client configured to connect to %s:%s", kafkaConfig.Hostname, kafkaConfig.Port)
	logger.Infof("Configured to write to topic %s", kafkaConfig.Topic)
}

// Compress the data before sending it to Kafka
func compressData(data []byte) ([]byte, error) {
	var buf bytes.Buffer
	gz := gzip.NewWriter(&buf)
	if _, err := gz.Write(data); err != nil {
		return nil, err
	}
	if err := gz.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func produceToKafka(data []byte) error {
	// Compress the data
	compressedData, err := compressData(data)
	if err != nil {
		logger.Errorf("Failed to compress data: %v", err)
		return err
	}

	if len(compressedData) > maxMessageSize {
		err := fmt.Errorf("compressed message too large: %d bytes (max %d)", len(compressedData), maxMessageSize)
		logger.Error(err)
		saveToLocalStorage(data)
		return err
	}

	msg := kafka.Message{
		Key:   []byte("Key"),
		Value: compressedData,
		Time:  time.Now().UTC(),
	}

	maxRetries := kafkaConfig.MaxRetries
	if maxRetries < 1 {
		maxRetries = 1
	}
	retryDelay := time.Duration(kafkaConfig.RetryInterval) * time.Second

	var writeErr error
	for attempt := 1; attempt <= maxRetries; attempt++ {
		writerMu.RLock()
		w := writer
		writerMu.RUnlock()
		if w == nil {
			writeErr = errors.New("kafka writer not initialized")
			break
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		writeErr = w.WriteMessages(ctx, msg)
		cancel()
		if writeErr == nil {
			return nil
		}
		if attempt < maxRetries {
			logger.Warnf("Kafka write attempt %d/%d failed: %v", attempt, maxRetries, writeErr)
			time.Sleep(retryDelay)
		}
	}

	logger.Errorf("Failed to write message to Kafka: %v", writeErr)
	saveToLocalStorage(data)
	return writeErr
}

func kafkaProducerReady() bool {
	writerMu.RLock()
	defer writerMu.RUnlock()
	return writer != nil
}

func closeKafkaProducer() error {
	writerMu.Lock()
	defer writerMu.Unlock()
	if writer == nil {
		return nil
	}
	err := writer.Close()
	writer = nil
	return err
}
