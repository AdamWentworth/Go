// logging.go
package main

import (
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// Logger variable accessible throughout the application
var logger = logrus.New()

// CustomFormatter for log messages
type CustomFormatter struct {
	TimestampFormat string
}

func (f *CustomFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	timestamp := entry.Time.Format(f.TimestampFormat)
	level := strings.ToUpper(entry.Level.String())
	message := entry.Message
	line := fmt.Sprintf("%s - %s - %s\n", timestamp, level, message)
	return []byte(line), nil
}

// FilteredWriter filters out unwanted logs from being written to the terminal
type FilteredWriter struct {
	Writer  io.Writer
	Filters []string
}

func (fw *FilteredWriter) Write(p []byte) (n int, err error) {
	s := string(p)
	for _, filter := range fw.Filters {
		if strings.Contains(s, filter) {
			// Don't write to Writer (terminal)
			return len(p), nil
		}
	}
	return fw.Writer.Write(p)
}

// Initialize the logger
func initLogger() {
	// Open the log file
	logFile, err := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		logger.Fatalf("Failed to open log file: %v", err)
	}

	// Force GIN to output color
	gin.ForceConsoleColor()

	// Create a filtered writer for the terminal
	filteredWriter := &FilteredWriter{
		Writer: os.Stdout,
		Filters: []string{
			"[GIN-debug]", // Filter out Gin debug logs from the terminal
		},
	}

	// Set up writers
	terminalWriter := filteredWriter
	appLogWriter := logFile

	// Set logger output to write to both terminal and app log
	loggerOutput := io.MultiWriter(terminalWriter, appLogWriter)
	logger.SetOutput(loggerOutput)

	// Set the logger's formatter
	logger.SetFormatter(&CustomFormatter{
		TimestampFormat: "2006-01-02 15:04:05",
	})

	// Set the logger's level
	logger.SetLevel(logrus.InfoLevel)

	// Configure Gin to write its default logs to both terminal and app.log
	gin.DefaultWriter = io.MultiWriter(terminalWriter, appLogWriter)
	gin.DefaultErrorWriter = io.MultiWriter(terminalWriter, appLogWriter)
}
