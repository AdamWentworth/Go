package main

import (
	"encoding/json"
	"testing"
)

func TestOutboxBroadcastData(t *testing.T) {
	source := "device-1"
	payload := map[string]interface{}{
		"trade": map[string]interface{}{
			"trade-1": map[string]interface{}{"trade_status": "pending"},
		},
	}
	rawPayload, _ := json.Marshal(payload)
	event := ApplicationOutbox{
		RecipientUserIDs: `["user-1","user-2"]`,
		SourceDeviceID:   &source,
		Payload:          string(rawPayload),
	}

	recipients, deviceID, gotPayload, err := outboxBroadcastData(event)
	if err != nil {
		t.Fatalf("outboxBroadcastData: %v", err)
	}
	if !recipients["user-1"] || !recipients["user-2"] || len(recipients) != 2 {
		t.Fatalf("unexpected recipients: %#v", recipients)
	}
	if deviceID != source {
		t.Fatalf("unexpected source device: %q", deviceID)
	}
	if string(gotPayload) != string(rawPayload) {
		t.Fatalf("unexpected payload: %s", gotPayload)
	}
}

func TestOutboxBroadcastDataRejectsMalformedJSON(t *testing.T) {
	_, _, _, err := outboxBroadcastData(ApplicationOutbox{
		RecipientUserIDs: `["user-1"]`,
		Payload:          `{`,
	})
	if err == nil {
		t.Fatal("expected malformed payload to fail")
	}
}
