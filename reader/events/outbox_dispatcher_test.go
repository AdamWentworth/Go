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

func TestTradeOutboxEventReachesCounterpartAndActorsOtherDevice(t *testing.T) {
	clientsMutex.Lock()
	originalClients := clients
	clients = map[string]*Client{
		"actor-source": {
			UserID: "user-1", DeviceID: "device-source",
			Channel: make(chan []byte, 1), Connected: true,
		},
		"actor-other": {
			UserID: "user-1", DeviceID: "device-other",
			Channel: make(chan []byte, 1), Connected: true,
		},
		"counterpart": {
			UserID: "user-2", DeviceID: "device-counterpart",
			Channel: make(chan []byte, 1), Connected: true,
		},
		"unrelated": {
			UserID: "user-3", DeviceID: "device-unrelated",
			Channel: make(chan []byte, 1), Connected: true,
		},
	}
	clientsMutex.Unlock()
	t.Cleanup(func() {
		clientsMutex.Lock()
		clients = originalClients
		clientsMutex.Unlock()
	})

	source := "device-source"
	event := ApplicationOutbox{
		RecipientUserIDs: `["user-1","user-2"]`,
		SourceDeviceID:   &source,
		Payload:          `{"trade":{"trade-1":{"trade_status":"completed"}},"affectedInstances":{"pokemon-a":{"user_id":"user-2"},"pokemon-b":{"user_id":"user-1"}}}`,
	}
	recipients, sourceDeviceID, payload, err := outboxBroadcastData(event)
	if err != nil {
		t.Fatalf("outboxBroadcastData: %v", err)
	}
	sent, dropped := broadcastToClients(recipients, sourceDeviceID, payload)
	if sent != 2 || dropped != 0 {
		t.Fatalf("expected two successful deliveries, got sent=%d dropped=%d", sent, dropped)
	}
	if len(clients["actor-source"].Channel) != 0 {
		t.Fatal("source device should rely on its canonical HTTP response")
	}
	if got := <-clients["actor-other"].Channel; string(got) != event.Payload {
		t.Fatalf("actor's other device received unexpected payload: %s", got)
	}
	if got := <-clients["counterpart"].Channel; string(got) != event.Payload {
		t.Fatalf("counterpart received unexpected payload: %s", got)
	}
	if len(clients["unrelated"].Channel) != 0 {
		t.Fatal("unrelated user must not receive the trade event")
	}
}
