// logging.go

package main

import (
	"fmt"
	"io"
	"net/url"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

// CustomFormatter is a logrus formatter similar to the Python logging format
type CustomFormatter struct{}

func (f *CustomFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	timestamp := entry.Time.Format("2006-01-02 15:04:05")
	level := entry.Level.String()

	// Uppercase format for log level
	levelUpper := level
	switch level {
	case "info":
		levelUpper = "INFO"
	case "error":
		levelUpper = "ERROR"
	case "fatal":
		levelUpper = "FATAL"
	case "warn":
		levelUpper = "WARN"
	default:
		// For debug, trace, etc. just keep uppercase
		levelUpper = level
	}

	message := fmt.Sprintf("%s - %s - %s\n", timestamp, levelUpper, entry.Message)
	return []byte(message), nil
}

func initLogging() {
	file, err := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		fmt.Printf("Failed to open log file: %v", err)
		return
	}

	logrus.SetFormatter(&CustomFormatter{})

	multiWriter := io.MultiWriter(os.Stdout, file)
	logrus.SetOutput(multiWriter)
	logrus.SetLevel(logrus.TraceLevel)
}

// Custom error handler for Fiber
func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	logrus.Errorf("Error %d: %v", code, err)
	return c.Status(code).JSON(fiber.Map{
		"error": err.Error(),
	})
}

// Custom request logging middleware
func requestLogger(c *fiber.Ctx) error {
	start := time.Now()
	err := c.Next() // Capture the error from c.Next()
	stop := time.Now()
	latency := stop.Sub(start)

	ip := c.IP()
	method := c.Method()
	rawPath := c.OriginalURL() // Includes the raw query string

	// Decode the URL for human-readable logging
	decodedPath, decodeErr := url.QueryUnescape(rawPath)
	if decodeErr != nil {
		logrus.Warnf("Failed to decode URL path: %s, using raw path instead", rawPath)
		decodedPath = rawPath // Fallback to the original raw path
	}

	status := c.Response().StatusCode()

	// Log the decoded URL
	logMessage := fmt.Sprintf("%s - %s %s - %d - %dms", ip, method, decodedPath, status, latency.Milliseconds())
	logrus.Info(logMessage)

	// Return the error captured from c.Next()
	return err
}
