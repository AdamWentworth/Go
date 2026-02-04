package logging

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"strings"
	"sync"
	"time"
)

// NodeFmtHandler prints logs like the Node service:
//
// 2006-01-02 15:04:05 - INFO - message
//
// This handler intentionally ignores structured attrs; callers should embed details
// directly into the message string if they need node-identical output.
type NodeFmtHandler struct {
	w     io.Writer
	level slog.Level
	mu    sync.Mutex
}

func NewNodeFmtHandler(w io.Writer, level slog.Level) *NodeFmtHandler {
	return &NodeFmtHandler{w: w, level: level}
}

func (h *NodeFmtHandler) Enabled(_ context.Context, l slog.Level) bool {
	return l >= h.level
}

func (h *NodeFmtHandler) Handle(_ context.Context, r slog.Record) error {
	ts := r.Time
	if ts.IsZero() {
		ts = time.Now()
	}
	// Match Node: local time, no timezone offset
	stamp := ts.Local().Format("2006-01-02 15:04:05")

	level := strings.ToUpper(r.Level.String())

	// Node’s logger prints message only; ignore attrs for byte-for-byte similarity.
	line := fmt.Sprintf("%s - %s - %s\n", stamp, level, r.Message)

	h.mu.Lock()
	_, err := io.WriteString(h.w, line)
	h.mu.Unlock()
	return err
}

func (h *NodeFmtHandler) WithAttrs(_ []slog.Attr) slog.Handler {
	// Ignore attrs to keep output node-like.
	return h
}

func (h *NodeFmtHandler) WithGroup(_ string) slog.Handler {
	return h
}
