// kafka.go
package main

import (
	"context"
	"fmt"
	"time"

	"bytes"
	"compress/gzip"

	"github.com/segmentio/kafka-go"
)

const maxMessageSize = 3145728 // 3 MB in bytes

var writer *kafka.Writer

// Initialize Kafka Producer using kafka-go
func initializeKafkaProducer() {
	logger.Info("Attempting to connect to Kafka...")

	// Configure the Kafka transport with custom timeouts
	transport := &kafka.Transport{
		DialTimeout: 10 * time.Second,
		IdleTimeout: 5 * time.Minute,
	}

	// Create the Kafka writer with optimized settings
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

	// Check the compressed message size
	maxChunkSize := maxMessageSize - 1024 // leave some buffer
	if len(compressedData) > maxChunkSize {
		logger.Warnf("Splitting large compressed message of size %d bytes", len(compressedData))

		// Split the message into chunks if it's too large
		for i := 0; i < len(compressedData); i += maxChunkSize {
			end := i + maxChunkSize
			if end > len(compressedData) {
				end = len(compressedData)
			}

			chunk := compressedData[i:end]
			msg := kafka.Message{
				Key:   []byte(fmt.Sprintf("Key-%d", i)),
				Value: chunk,
			}

			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()

			err := writer.WriteMessages(ctx, msg)
			if err != nil {
				logger.Errorf("Failed to write chunked message to Kafka: %v", err)
				saveToLocalStorage(data) // Save original data for retry, in case it fails
				return err
			}
		}
	} else {
		// Send the compressed message if it's under the size limit
		msg := kafka.Message{
			Key:   []byte("Key"),
			Value: compressedData,
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		err := writer.WriteMessages(ctx, msg)
		if err != nil {
			logger.Errorf("Failed to write message to Kafka: %v", err)
			saveToLocalStorage(data) // Save original data for retry, in case it fails
			return err
		}
	}

	return nil
}
