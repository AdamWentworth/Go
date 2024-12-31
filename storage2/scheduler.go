// scheduler.go

package main

import (
    "encoding/json"
    "errors"
    "github.com/sirupsen/logrus"
    "os"
    "strings"
)

func ReprocessFailedMessages() {
    bytes, err := os.ReadFile(failedMessagesFile) // re-use the variable from consumer.go
    if err != nil {
        if !errors.Is(err, os.ErrNotExist) {
            logrus.Info("Failed to read failed messages file: %v\n", err)
        }
        return
    }
    lines := strings.Split(strings.TrimSpace(string(bytes)), "\n")
    if len(lines) == 0 || lines[0] == "" {
        return
    }

    logrus.Info("Reprocessing %d failed messages.\n", len(lines))
    var kept []string
    for _, line := range lines {
        line = strings.TrimSpace(line)
        if line == "" {
            continue
        }
        var data map[string]interface{}
        if err := json.Unmarshal([]byte(line), &data); err != nil {
            logrus.Info("Failed to unmarshal message: %v\n", err)
            kept = append(kept, line)
            continue
        }
        // Instead of handlers.HandleMessage(data):
        if err := HandleMessage(data); err != nil {
            logrus.Info("Failed to reprocess message: %v\n", err)
            kept = append(kept, line)
        }
    }

    if len(kept) > 0 {
        f, err := os.Create(failedMessagesFile)
        if err != nil {
            logrus.Info("Failed to re-create failed_messages file: %v\n", err)
            return
        }
        defer f.Close()

        for _, line := range kept {
            _, _ = f.WriteString(line + "\n")
        }
        logrus.Info("Retained %d messages for future attempts.\n", len(kept))
    } else {
        _ = os.Remove(failedMessagesFile)
        logrus.Println("All failed messages reprocessed successfully.")
    }
}
