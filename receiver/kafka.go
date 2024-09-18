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
	writer = &kafka.Writer{
		Addr:     kafka.TCP(kafkaConfig.Hostname + ":" + kafkaConfig.Port),
		Topic:    kafkaConfig.Topic,
		Balancer: &kafka.LeastBytes{},
	}
	logger.Infof("Kafka client connected to %s:%s", kafkaConfig.Hostname, kafkaConfig.Port)
	logger.Infof("Connected to topic %s", kafkaConfig.Topic)
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
