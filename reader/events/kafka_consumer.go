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

			// Extract the "initiating" user
			userID, userIDExists := data["user_id"].(string)
			if !userIDExists {
				logrus.Errorf("user_id not found or not a string in Kafka message")
				continue
			}

			// Extract the device_id from the message
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

			username, err := getUsernameByUserID(userID)
			if err != nil {
				logrus.Errorf("Failed to fetch username for user_id %s: %v", userID, err)
				continue
			}

			logrus.Infof("Kafka message received for user=%s (username=%s), deviceID=%s",
				userID, username, deviceID)

			// ---------------------------------------------------------
			// 1) Transform "pokemonUpdates" into a nested map (if any)
			// ---------------------------------------------------------
			transformed := make(map[string]interface{})
			var pokemonMap map[string]interface{}
			{
				pokemonMap = make(map[string]interface{})
				if pUpdates, ok := data["pokemonUpdates"].([]interface{}); ok && len(pUpdates) > 0 {
					for _, raw := range pUpdates {
						if item, castOk := raw.(map[string]interface{}); castOk {
							if pk, pkOk := item["key"].(string); pkOk && pk != "" {
								pokemonMap[pk] = item
							}
						}
					}
				}
				transformed["pokemon"] = pokemonMap
			}

			// ---------------------------------------------
			// 2) Process tradeUpdates from nested tradeData
			//     and collect affected user IDs.
			// ---------------------------------------------
			tradeMap := make(map[string]interface{})
			affectedTradeUserIDs := make(map[string]bool)

			// We'll look for "completed" trades
			if tUpdates, ok := data["tradeUpdates"].([]interface{}); ok && len(tUpdates) > 0 {
				for _, raw := range tUpdates {
					if item, castOk := raw.(map[string]interface{}); castOk {
						keyVal, keyOk := item["key"].(string)
						_, opOk := item["operation"].(string) // Check existence of operation
						td, tdOk := item["tradeData"].(map[string]interface{})
						if keyOk && opOk && tdOk {
							tradeMap[keyVal] = td

							// Gather userIDs for SSE broadcast
							if proposingUsername, pOk := td["username_proposed"].(string); pOk && proposingUsername != "" {
								if proposedID, err := getUserIDByUsername(proposingUsername); err == nil {
									affectedTradeUserIDs[proposedID] = true
								} else {
									logrus.Errorf("Failed to get userID for proposed username %s: %v", proposingUsername, err)
								}
							}
							if acceptingUsername, aOk := td["username_accepting"].(string); aOk && acceptingUsername != "" {
								if acceptingID, err := getUserIDByUsername(acceptingUsername); err == nil {
									affectedTradeUserIDs[acceptingID] = true
								} else {
									logrus.Errorf("Failed to get userID for accepting username %s: %v", acceptingUsername, err)
								}
							}

							// -------------------------------------------------------
							// NEW LOGIC: If trade_status == "completed", do in-memory swap
							// -------------------------------------------------------
							if statusStr, sOk := td["trade_status"].(string); sOk && statusStr == "completed" {
								doCompletedTradeSwap(td, &pokemonMap)
							}
						}
					}
				}
			}
			transformed["trade"] = tradeMap

			// --------------------------------------------------
			// 2a) (Optional) Fetch relatedInstance for reference
			// --------------------------------------------------
			relatedInstance := make(map[string]interface{})
			for _, tdRaw := range tradeMap {
				td, ok := tdRaw.(map[string]interface{})
				if !ok {
					continue
				}

				// Attempt to fetch instance for user_accepting
				if pidAccepting, ok := td["pokemon_instance_id_user_accepting"].(string); ok && pidAccepting != "" {
					var instance PokemonInstance
					if err := db.Where("instance_id = ?", pidAccepting).First(&instance).Error; err != nil {
						logrus.Errorf("Failed to fetch instance %s: %v", pidAccepting, err)
					} else {
						var instanceMap map[string]interface{}
						if b, err := json.Marshal(instance); err != nil {
							logrus.Errorf("Error marshalling instance %s: %v", pidAccepting, err)
						} else if err := json.Unmarshal(b, &instanceMap); err != nil {
							logrus.Errorf("Error unmarshalling instance %s: %v", pidAccepting, err)
						} else {
							relatedInstance[pidAccepting] = instanceMap
						}
					}
				}

				// Attempt to fetch instance for user_proposed
				if pidProposed, ok := td["pokemon_instance_id_user_proposed"].(string); ok && pidProposed != "" {
					var instance PokemonInstance
					if err := db.Where("instance_id = ?", pidProposed).First(&instance).Error; err != nil {
						logrus.Errorf("Failed to fetch instance %s: %v", pidProposed, err)
					} else {
						var instanceMap map[string]interface{}
						if b, err := json.Marshal(instance); err != nil {
							logrus.Errorf("Error marshalling instance %s: %v", pidProposed, err)
						} else if err := json.Unmarshal(b, &instanceMap); err != nil {
							logrus.Errorf("Error unmarshalling instance %s: %v", pidProposed, err)
						} else {
							relatedInstance[pidProposed] = instanceMap
						}
					}
				}
			}
			transformed["relatedInstance"] = relatedInstance

			// --------------------------------------------------
			// 3) Combine userID + trade userIDs into one set
			//    so we do a single broadcast pass.
			// --------------------------------------------------
			broadcastUserIDs := make(map[string]bool)
			// Always include the user who triggered the update
			broadcastUserIDs[userID] = true

			// Include any other users affected by trades
			for uid := range affectedTradeUserIDs {
				broadcastUserIDs[uid] = true
			}

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
			clientsMutex.Lock()
			for _, client := range clients {
				if broadcastUserIDs[client.UserID] && client.DeviceID != deviceID && client.Connected {
					select {
					case client.Channel <- messageBytes:
						logrus.Infof("Sent update to user=%s device=%s", client.UserID, client.DeviceID)
					default:
						logrus.Warnf("Client channel full for user=%s device=%s", client.UserID, client.DeviceID)
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

// doCompletedTradeSwap is the "new logic" that handles trade_status="completed"
// *** DOES NOT *** update the DB; only modifies the instances in memory.
func doCompletedTradeSwap(tradeData map[string]interface{}, pokemonMapPtr *map[string]interface{}) {
	// tradeData should contain "username_proposed", "username_accepting",
	// "pokemon_instance_id_user_proposed", "pokemon_instance_id_user_accepting"
	usernameProposed, _ := tradeData["username_proposed"].(string)
	usernameAccepting, _ := tradeData["username_accepting"].(string)

	propInstanceID, _ := tradeData["pokemon_instance_id_user_proposed"].(string)
	accInstanceID, _ := tradeData["pokemon_instance_id_user_accepting"].(string)

	if propInstanceID == "" || accInstanceID == "" {
		logrus.Warnf("Cannot swap ownership because instance IDs are missing.")
		return
	}
	if usernameProposed == "" || usernameAccepting == "" {
		logrus.Warnf("Cannot swap ownership because one or both usernames are missing.")
		return
	}

	// 1) Attempt to fetch from DB to get full details
	var propInstance, accInstance PokemonInstance
	if err := db.Where("instance_id = ?", propInstanceID).First(&propInstance).Error; err != nil {
		logrus.Errorf("Failed to load proposed instance %s: %v", propInstanceID, err)
		return
	}
	if err := db.Where("instance_id = ?", accInstanceID).First(&accInstance).Error; err != nil {
		logrus.Errorf("Failed to load accepting instance %s: %v", accInstanceID, err)
		return
	}

	// 2) In memory, mark them as "owned" by the opposite user
	//    but do NOT save to DB. This is purely so the SSE shows them.
	nowTs := time.Now().Unix()

	// Proposed instance -> belongs to username_accepting
	propInstance.UserID = "FAKE-" + usernameAccepting // or just keep the old user_id if you prefer
	propInstance.LastUpdate = &nowTs
	propInstance.IsOwned = true
	propInstance.IsUnowned = false
	propInstance.IsForTrade = false
	propInstance.IsWanted = false

	// Accepting instance -> belongs to username_proposed
	accInstance.UserID = "FAKE-" + usernameProposed
	accInstance.LastUpdate = &nowTs
	accInstance.IsOwned = true
	accInstance.IsUnowned = false
	accInstance.IsForTrade = false
	accInstance.IsWanted = false

	// 3) Marshal each updated instance to JSON so we can attach all fields
	propInstanceJson, err := json.Marshal(propInstance)
	if err != nil {
		logrus.Errorf("Failed to marshal propInstance %s: %v", propInstanceID, err)
		return
	}
	accInstanceJson, err := json.Marshal(accInstance)
	if err != nil {
		logrus.Errorf("Failed to marshal accInstance %s: %v", accInstanceID, err)
		return
	}

	// 4) Convert each back into a generic map, and add "username" for clarity
	var propPayload map[string]interface{}
	if err := json.Unmarshal(propInstanceJson, &propPayload); err != nil {
		logrus.Errorf("Failed to unmarshal propInstance JSON: %v", err)
		return
	}
	propPayload["username"] = usernameAccepting

	var accPayload map[string]interface{}
	if err := json.Unmarshal(accInstanceJson, &accPayload); err != nil {
		logrus.Errorf("Failed to unmarshal accInstance JSON: %v", err)
		return
	}
	accPayload["username"] = usernameProposed

	// 5) Place them into the SSE "pokemon" map
	pokemonMap := *pokemonMapPtr
	pokemonMap[propInstanceID] = propPayload
	pokemonMap[accInstanceID] = accPayload

	logrus.Infof("[IN-MEMORY ONLY] Completed trade swap for propInst=%s -> user=%s, accInst=%s -> user=%s",
		propInstanceID, usernameAccepting, accInstanceID, usernameProposed)
}

func getUserIDByUsername(username string) (string, error) {
	var user User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		return "", err
	}
	return user.UserID, nil
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
