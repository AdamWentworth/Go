// logging.go
package main

import (
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

// Logger variable accessible throughout the application
var logger = logrus.New()

// TerminalFormatter for log messages
type TerminalFormatter struct {
	TimestampFormat string
}

func (f *TerminalFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	timestamp := entry.Time.Format(f.TimestampFormat)
	level := strings.ToUpper(entry.Level.String())
	message := entry.Message
	line := fmt.Sprintf("%s - %s - %s\n", timestamp, level, message)
	return []byte(line), nil
}

// DetailedFormatter formats logs with additional contextual information.
type DetailedFormatter struct {
	TimestampFormat string
}

// Format implements the logrus.Formatter interface.
func (f *DetailedFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	timestamp := entry.Time.Format(f.TimestampFormat)
	level := strings.ToUpper(entry.Level.String())
	message := entry.Message

	// Integrate all fields into the message
	if len(entry.Data) > 0 {
		// Create a slice to hold field representations
		fields := make([]string, 0, len(entry.Data))
		for key, value := range entry.Data {
			fields = append(fields, fmt.Sprintf("%s=%v", key, value))
		}
		// Join all fields with a space separator
		message = fmt.Sprintf("%s - %s - %s - %s\n", timestamp, level, strings.Join(fields, " "), message)
	} else {
		// If no additional fields, maintain the simple format
		message = fmt.Sprintf("%s - %s - %s\n", timestamp, level, message)
	}

	return []byte(message), nil
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

	// Create terminal logger
	terminalLogger := logrus.New()
	terminalLogger.SetFormatter(&TerminalFormatter{
		TimestampFormat: "2006-01-02 15:04:05",
	})
	terminalLogger.SetOutput(&FilteredWriter{
		Writer: os.Stdout,
		Filters: []string{
			"[Fiber]",
		},
	})

	// Create file logger
	fileLogger := logrus.New()
	fileLogger.SetFormatter(&DetailedFormatter{
		TimestampFormat: "2006-01-02 15:04:05",
	})
	fileLogger.SetOutput(logFile)

	// Create a hook to write to both loggers
	logger.AddHook(&MultiLoggerHook{
		TerminalLogger: terminalLogger,
		FileLogger:     fileLogger,
	})

	// Set default logger properties
	logger.SetOutput(io.Discard) // Prevent double logging
	logger.SetLevel(logrus.InfoLevel)
}

// MultiLoggerHook implements logrus.Hook
type MultiLoggerHook struct {
	TerminalLogger *logrus.Logger
	FileLogger     *logrus.Logger
}

func (h *MultiLoggerHook) Levels() []logrus.Level {
	return logrus.AllLevels
}

func (h *MultiLoggerHook) Fire(entry *logrus.Entry) error {
	// Clone the entry to avoid modifying the original
	terminalEntry := logrus.NewEntry(h.TerminalLogger)
	terminalEntry.Message = entry.Message
	terminalEntry.Level = entry.Level
	terminalEntry.Time = entry.Time

	fileEntry := logrus.NewEntry(h.FileLogger)
	fileEntry.Message = entry.Message
	fileEntry.Level = entry.Level
	fileEntry.Time = entry.Time
	fileEntry.Data = entry.Data

	// Log to terminal (simplified)
	terminalEntry.Log(entry.Level, entry.Message)

	// Log to file (detailed)
	fileEntry.Log(entry.Level, entry.Message)

	return nil
}

// Custom request logger middleware for Fiber
func requestLogger(c *fiber.Ctx) error {
	start := time.Now()
	err := c.Next()
	stop := time.Now()

	// Skip logging for OPTIONS requests
	if c.Method() == "OPTIONS" {
		return err
	}

	latency := stop.Sub(start).Milliseconds()
	method := c.Method()
	path := c.OriginalURL()
	status := c.Response().StatusCode()
	ip := c.IP()

	// Create detailed log fields
	logger.WithFields(logrus.Fields{
		"ip":         ip,
		"method":     method,
		"path":       path,
		"status":     status,
		"latency_ms": latency,
		"trace_id":   c.Locals("trace_id"),
		"user_id":    c.Locals("user_id"),
	}).Infof("%s - %s %s - %d - %dms", ip, method, path, status, latency)

	return err
}

// Recovery middleware for Fiber to handle panics
func recoverMiddleware(c *fiber.Ctx) error {
	defer func() {
		if r := recover(); r != nil {
			logger.Errorf("Panic recovered: %v", r)
			c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"message": "Internal Server Error",
			})
		}
	}()
	return c.Next()
}

// Custom error handler for Fiber
func errorHandler(c *fiber.Ctx, err error) error {
	// Default 500 status code
	code := fiber.StatusInternalServerError

	// Retrieve the custom status code if it's a *fiber.Error
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	// Log the error
	logger.WithFields(logrus.Fields{
		"trace_id": c.Locals("trace_id"),
		"user_id":  c.Locals("user_id"),
	}).Errorf("Error %d: %v", code, err)

	// Send JSON response
	return c.Status(code).JSON(fiber.Map{
		"message": err.Error(),
	})
}
