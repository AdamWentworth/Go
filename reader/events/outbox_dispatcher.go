package main

import (
	"encoding/json"
	"os"
	"strconv"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type ApplicationOutbox struct {
	EventID          string     `gorm:"column:event_id;primaryKey"`
	RecipientUserIDs string     `gorm:"column:recipient_user_ids"`
	SourceDeviceID   *string    `gorm:"column:source_device_id"`
	Payload          string     `gorm:"column:payload"`
	ProcessedAt      *time.Time `gorm:"column:processed_at"`
	Attempts         uint       `gorm:"column:attempts"`
	NextAttemptAt    time.Time  `gorm:"column:next_attempt_at"`
	LastError        *string    `gorm:"column:last_error"`
	CreatedAt        time.Time  `gorm:"column:created_at"`
}

func (ApplicationOutbox) TableName() string { return "application_outbox" }

func outboxPollInterval() time.Duration {
	raw := os.Getenv("OUTBOX_POLL_INTERVAL_MS")
	if raw == "" {
		return 200 * time.Millisecond
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value < 50 {
		return 200 * time.Millisecond
	}
	return time.Duration(value) * time.Millisecond
}

func outboxBroadcastData(event ApplicationOutbox) (map[string]bool, string, []byte, error) {
	var recipients []string
	if err := json.Unmarshal([]byte(event.RecipientUserIDs), &recipients); err != nil {
		return nil, "", nil, err
	}
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(event.Payload), &payload); err != nil {
		return nil, "", nil, err
	}
	userIDs := make(map[string]bool, len(recipients))
	for _, userID := range recipients {
		if userID != "" {
			userIDs[userID] = true
		}
	}
	sourceDeviceID := ""
	if event.SourceDeviceID != nil {
		sourceDeviceID = *event.SourceDeviceID
	}
	return userIDs, sourceDeviceID, []byte(event.Payload), nil
}

func startOutboxDispatcher() {
	go func() {
		ticker := time.NewTicker(outboxPollInterval())
		defer ticker.Stop()
		for range ticker.C {
			dispatchOutboxBatch()
		}
	}()
}

func dispatchOutboxBatch() {
	now := time.Now().UTC()
	var candidates []ApplicationOutbox
	if err := db.Where("processed_at IS NULL AND next_attempt_at <= ?", now).
		Order("created_at ASC").Limit(50).Find(&candidates).Error; err != nil {
		logrus.Errorf("Failed to load application outbox: %v", err)
		return
	}
	for _, candidate := range candidates {
		claimUntil := now.Add(30 * time.Second)
		result := db.Model(&ApplicationOutbox{}).
			Where("event_id = ? AND processed_at IS NULL AND next_attempt_at <= ?", candidate.EventID, now).
			Updates(map[string]interface{}{
				"attempts":        gorm.Expr("attempts + 1"),
				"next_attempt_at": claimUntil,
			})
		if result.Error != nil || result.RowsAffected != 1 {
			continue
		}

		userIDs, sourceDeviceID, payload, err := outboxBroadcastData(candidate)
		if err != nil {
			message := err.Error()
			_ = db.Model(&ApplicationOutbox{}).Where("event_id = ?", candidate.EventID).
				Updates(map[string]interface{}{
					"last_error":      message,
					"next_attempt_at": time.Now().UTC().Add(time.Minute),
				}).Error
			logrus.Errorf("Invalid outbox event %s: %v", candidate.EventID, err)
			continue
		}
		sent, dropped := broadcastToClients(userIDs, sourceDeviceID, payload)
		if dropped > 0 {
			sseBroadcastsTotal.WithLabelValues("dropped").Add(float64(dropped))
		}
		if sent > 0 {
			sseBroadcastsTotal.WithLabelValues("sent").Add(float64(sent))
		} else if dropped == 0 {
			sseBroadcastsTotal.WithLabelValues("no_recipient").Inc()
		}
		processedAt := time.Now().UTC()
		if err := db.Model(&ApplicationOutbox{}).Where("event_id = ?", candidate.EventID).
			Updates(map[string]interface{}{
				"processed_at": processedAt,
				"last_error":   nil,
			}).Error; err != nil {
			logrus.Errorf("Failed to mark outbox event %s processed: %v", candidate.EventID, err)
		}
	}
}
