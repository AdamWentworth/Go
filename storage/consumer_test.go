package main

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"

	"github.com/segmentio/kafka-go"
)

type stubCommitter struct {
	commits int
	err     error
}

func (s *stubCommitter) CommitMessages(_ context.Context, _ ...kafka.Message) error {
	s.commits++
	return s.err
}

func TestProcessMessageSuccessCommits(t *testing.T) {
	origHandle := handleMessageFn
	origPersist := persistFailedMessageFn
	t.Cleanup(func() {
		handleMessageFn = origHandle
		persistFailedMessageFn = origPersist
	})

	handleMessageFn = func(map[string]interface{}) error { return nil }
	persistCount := 0
	persistFailedMessageFn = func(interface{}) { persistCount++ }

	payload := map[string]interface{}{"user_id": "u1", "trace_id": "t1"}
	msg := kafka.Message{Value: mustGzipJSON(t, payload)}
	committer := &stubCommitter{}

	err := processMessage(context.Background(), committer, msg)
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if committer.commits != 1 {
		t.Fatalf("expected 1 commit, got %d", committer.commits)
	}
	if persistCount != 0 {
		t.Fatalf("expected no failed-message persistence, got %d", persistCount)
	}
}

func TestProcessMessageHandlerFailurePersistsAndCommits(t *testing.T) {
	origHandle := handleMessageFn
	origPersist := persistFailedMessageFn
	t.Cleanup(func() {
		handleMessageFn = origHandle
		persistFailedMessageFn = origPersist
	})

	handleMessageFn = func(map[string]interface{}) error { return errors.New("handler failed") }
	persistCount := 0
	persistFailedMessageFn = func(interface{}) { persistCount++ }

	payload := map[string]interface{}{"user_id": "u1", "trace_id": "t1"}
	msg := kafka.Message{Value: mustGzipJSON(t, payload)}
	committer := &stubCommitter{}

	err := processMessage(context.Background(), committer, msg)
	if err == nil {
		t.Fatal("expected error from handler failure")
	}
	if !strings.Contains(err.Error(), "persisted to retry file") {
		t.Fatalf("expected retry-file error context, got %v", err)
	}
	if committer.commits != 1 {
		t.Fatalf("expected commit on handler failure, got %d", committer.commits)
	}
	if persistCount != 1 {
		t.Fatalf("expected failed-message persistence once, got %d", persistCount)
	}
}

func TestProcessMessageCommitFailureReturnsError(t *testing.T) {
	origHandle := handleMessageFn
	origPersist := persistFailedMessageFn
	t.Cleanup(func() {
		handleMessageFn = origHandle
		persistFailedMessageFn = origPersist
	})

	handleMessageFn = func(map[string]interface{}) error { return nil }
	persistFailedMessageFn = func(interface{}) {}

	payload := map[string]interface{}{"user_id": "u1", "trace_id": "t1"}
	msg := kafka.Message{Value: mustGzipJSON(t, payload)}
	committer := &stubCommitter{err: errors.New("commit failed")}

	err := processMessage(context.Background(), committer, msg)
	if err == nil {
		t.Fatal("expected commit error")
	}
	if !strings.Contains(err.Error(), "commit message") {
		t.Fatalf("expected commit error context, got %v", err)
	}
	if committer.commits != 1 {
		t.Fatalf("expected exactly one commit attempt, got %d", committer.commits)
	}
}

func TestParseUnownedFlag(t *testing.T) {
	if !parseUnownedFlag(map[string]interface{}{"is_unowned": true}) {
		t.Fatal("expected is_unowned=true to be true")
	}
	if !parseUnownedFlag(map[string]interface{}{"is_missing": "true"}) {
		t.Fatal("expected is_missing=true to be true")
	}
	if parseUnownedFlag(map[string]interface{}{"is_missing": "false"}) {
		t.Fatal("expected is_missing=false to be false")
	}
}

func mustGzipJSON(t *testing.T, payload map[string]interface{}) []byte {
	t.Helper()

	raw, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}

	var buf bytes.Buffer
	zw := gzip.NewWriter(&buf)
	if _, err := zw.Write(raw); err != nil {
		t.Fatalf("gzip write: %v", err)
	}
	if err := zw.Close(); err != nil {
		t.Fatalf("gzip close: %v", err)
	}
	return buf.Bytes()
}
