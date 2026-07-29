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
				kafkaMessagesTotal.WithLabelValues("fetch_error").Inc()
				retryCount++
				if retryCount > config.Events.MaxRetries {
					logrus.Errorf("Max retries reached while reading from Kafka; continuing retry loop")
					retryCount = 0
				}
				time.Sleep(time.Duration(config.Events.RetryInterval) * time.Second)
				continue
			}

			retryCount = 0 // Reset retry count on success

			// Decompress the message if necessary
			decompressedValue, err := decompressData(m.Value)
			if err != nil {
				logrus.Errorf("Error decompressing Kafka message: %v", err)
				kafkaMessagesTotal.WithLabelValues("invalid_payload").Inc()
				continue
			}

			var data map[string]interface{}
			if err := json.Unmarshal(decompressedValue, &data); err != nil {
				logrus.Errorf("Error unmarshalling Kafka message: %v", err)
				kafkaMessagesTotal.WithLabelValues("invalid_payload").Inc()
				continue
			}

			// Extract the "initiating" user
			userID, userIDExists := data["user_id"].(string)
			if !userIDExists {
				logrus.Errorf("user_id not found or not a string in Kafka message")
				kafkaMessagesTotal.WithLabelValues("invalid_payload").Inc()
				continue
			}

			// Extract the device_id from the message
			deviceIDInterface, deviceIDExists := data["device_id"]
			if !deviceIDExists {
				logrus.Errorf("device_id not found in Kafka message")
				kafkaMessagesTotal.WithLabelValues("invalid_payload").Inc()
				continue
			}
			deviceID, ok := deviceIDInterface.(string)
			if !ok {
				deviceID = fmt.Sprintf("%v", deviceIDInterface)
				logrus.Warnf("device_id was not a string, converted to %s", deviceID)
			}

			username, err := getUsernameByUserID(userID)
			if err != nil {
				logrus.Errorf("Failed to fetch username for user_id %s: %v", userID, err)
				kafkaMessagesTotal.WithLabelValues("lookup_error").Inc()
				continue
			}

			logrus.Infof("Kafka message received for user=%s (username=%s), deviceID=%s",
				userID, username, deviceID)

			// ---------------------------------------------------------
			// 1) Transform "pokemonUpdates" into an instance-keyed map
			// ---------------------------------------------------------
			transformed := make(map[string]interface{})
			pokemonMap := transformPokemonUpdates(data["pokemonUpdates"])
			transformed["pokemon"] = pokemonMap

			broadcastUserIDs := map[string]bool{userID: true}

			// ---------------------------------------------------
			// 4) Marshal the final data we want to send via SSE
			// ---------------------------------------------------
			messageBytes, err := json.Marshal(transformed)
			if err != nil {
				logrus.Errorf("Error marshalling transformed message: %v", err)
				continue
			}

			// -------------------------------------------------------------------
			// 5) Broadcast to all userIDs in "broadcastUserIDs"
			//    except the same deviceID that triggered the update
			// -------------------------------------------------------------------
			sentCount, droppedCount := broadcastToClients(broadcastUserIDs, deviceID, messageBytes)
			if sentCount == 0 && droppedCount == 0 {
				sseBroadcastsTotal.WithLabelValues("no_recipient").Inc()
			}
			if sentCount > 0 {
				sseBroadcastsTotal.WithLabelValues("sent").Add(float64(sentCount))
				logrus.Infof("Sent update to %d connected client(s)", sentCount)
			}
			if droppedCount > 0 {
				sseBroadcastsTotal.WithLabelValues("dropped").Add(float64(droppedCount))
				logrus.Warnf("Dropped update for %d saturated client channel(s)", droppedCount)
			}

			// Manually commit the message after successful processing
			if err := r.CommitMessages(context.Background(), m); err != nil {
				logrus.Errorf("Failed to commit message: %v", err)
				kafkaMessagesTotal.WithLabelValues("commit_error").Inc()
				continue
			}
			kafkaMessagesTotal.WithLabelValues("processed").Inc()
		}
	}()
}

func transformPokemonUpdates(rawUpdates interface{}) map[string]interface{} {
	pokemonMap := make(map[string]interface{})
	updates, ok := rawUpdates.([]interface{})
	if !ok {
		return pokemonMap
	}

	for _, raw := range updates {
		item, ok := raw.(map[string]interface{})
		if !ok {
			continue
		}

		// Current receiver contract: each update is the instance snapshot itself.
		if instanceID, ok := item["instance_id"].(string); ok && instanceID != "" {
			pokemonMap[instanceID] = item
			continue
		}

		// Retain compatibility with updates queued by older frontend builds.
		key, ok := item["key"].(string)
		if !ok || key == "" {
			continue
		}
		if nested, ok := item["pokemonData"].(map[string]interface{}); ok {
			if _, exists := nested["instance_id"]; !exists {
				nested["instance_id"] = key
			}
			pokemonMap[key] = nested
			continue
		}
		pokemonMap[key] = item
	}

	return pokemonMap
}

// decompressData decompresses GZIP data from Kafka if needed.
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
