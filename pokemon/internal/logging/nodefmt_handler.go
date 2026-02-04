package logging

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"sort"
	"strings"
	"sync"
	"time"
)

// NodeFmtHandler prints logs like:
// 2006-01-02 15:04:05 - INFO - message key=value key2=value2
//
// It also renders slog attrs as key=value pairs (stable-sorted).
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

	attrs := recordAttrs(r)

	line := fmt.Sprintf("%s - %s - %s", stamp, level, r.Message)
	if len(attrs) > 0 {
		line += " " + strings.Join(attrs, " ")
	}
	line += "\n"

	h.mu.Lock()
	_, err := io.WriteString(h.w, line)
	h.mu.Unlock()
	return err
}

func (h *NodeFmtHandler) WithAttrs(_ []slog.Attr) slog.Handler {
	return h
}

func (h *NodeFmtHandler) WithGroup(_ string) slog.Handler {
	return h
}

func recordAttrs(r slog.Record) []string {
	pairs := make([]string, 0, 8)
	r.Attrs(func(a slog.Attr) bool {
		k := strings.TrimSpace(a.Key)
		if k == "" {
			return true
		}
		v := formatAttrValue(a.Value)
		pairs = append(pairs, k+"="+v)
		return true
	})

	sort.Strings(pairs)
	return pairs
}

func formatAttrValue(v slog.Value) string {
	s := v.String()
	s = strings.ReplaceAll(s, "\n", "\\n")
	s = strings.ReplaceAll(s, "\r", "\\r")
	s = strings.ReplaceAll(s, "\t", "\\t")
	return s
}
