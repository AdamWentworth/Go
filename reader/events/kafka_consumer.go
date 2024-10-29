// kafka_consumer.go

package main

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/sirupsen/logrus"
)

func startKafkaConsumer() {
	// Build the Kafka broker address
	kafkaAddress := fmt.Sprintf("%s:%s", config.Events.Hostname, config.Events.Port)

	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        []string{kafkaAddress},
		Topic:          config.Events.Topic,
		GroupID:        "sse_consumer_group", // Use a unique GroupID
		MinBytes:       10e3,                 // 10KB
		MaxBytes:       10e6,                 // 10MB
		CommitInterval: 0,                    // Disable auto-commit
	})

	go func() {
		retryCount := 0
		for {
			m, err := r.FetchMessage(context.Background())
			if err != nil {
				logrus.Errorf("Error fetching message from Kafka: %v", err)
				retryCount++
				if retryCount > config.Events.MaxRetries {
					logrus.Fatalf("Max retries reached while reading from Kafka")
				}
				time.Sleep(time.Duration(config.Events.RetryInterval) * time.Second)
				continue
			}

			retryCount = 0 // Reset retry count on success

			// Decompress the message if necessary
			decompressedValue, err := decompressData(m.Value)
			if err != nil {
				logrus.Errorf("Error decompressing Kafka message: %v", err)
				continue
			}

			var data map[string]interface{}
			if err := json.Unmarshal(decompressedValue, &data); err != nil {
				logrus.Errorf("Error unmarshalling Kafka message: %v", err)
				continue
			}

			// Extract necessary fields
			userID, userIDExists := data["user_id"].(string)
			if !userIDExists {
				logrus.Errorf("user_id not found or not a string in Kafka message")
				continue
			}

			deviceIDInterface, deviceIDExists := data["device_id"]
			if !deviceIDExists {
				logrus.Errorf("device_id not found in Kafka message")
				continue
			}

			deviceID, ok := deviceIDInterface.(string)
			if !ok {
				deviceID = fmt.Sprintf("%v", deviceIDInterface)
				logrus.Warnf("device_id was not a string, converted to %s", deviceID)
			}

			logrus.Infof("Kafka message: userID=%s, deviceID=%s", userID, deviceID)

			// Prepare the message to send to clients
			messageBytes, err := json.Marshal(data)
			if err != nil {
				logrus.Errorf("Error marshalling message: %v", err)
				continue
			}

			// Send the message to all connected clients for the user except the originating device
			clientsMutex.Lock()
			for _, client := range clients {
				if client.UserID == userID && client.DeviceID != deviceID && client.Connected {
					select {
					case client.Channel <- messageBytes:
						logrus.Infof("Sent update to user %s device %s", userID, client.DeviceID)
					default:
						logrus.Warnf("Client channel full for user %s device %s", userID, client.DeviceID)
					}
				}
			}
			clientsMutex.Unlock()

			// Manually commit the message after successful processing
			if err := r.CommitMessages(context.Background(), m); err != nil {
				logrus.Errorf("Failed to commit message: %v", err)
			}
		}
	}()
}

func decompressData(data []byte) ([]byte, error) {
	reader, err := gzip.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	defer reader.Close()

	decompressedData, err := ioutil.ReadAll(reader)
	if err != nil {
		return nil, err
	}
	return decompressedData, nil
}
