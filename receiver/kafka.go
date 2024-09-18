// kafka.go
package main

import (
	"context"
	"time"

	"github.com/segmentio/kafka-go"
)

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

func produceToKafka(data []byte) error {
	msg := kafka.Message{
		Key:   []byte("Key"),
		Value: data,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := writer.WriteMessages(ctx, msg)

	if err != nil {
		logger.Errorf("Failed to write message to Kafka: %v", err)
		// If Kafka fails, save the message to local storage
		saveToLocalStorage(data)
		return err
	}
	return nil
}
