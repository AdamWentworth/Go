package main

import (
	"bytes"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

func TestRequestLogger_QuietHealthPaths(t *testing.T) {
	origOut := logrus.StandardLogger().Out
	origLevel := logrus.GetLevel()
	defer func() {
		logrus.SetOutput(origOut)
		logrus.SetLevel(origLevel)
	}()

	var buf bytes.Buffer
	logrus.SetOutput(&buf)
	logrus.SetLevel(logrus.InfoLevel)

	app := fiber.New()
	app.Use(requestLogger)
	app.Get("/healthz", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })
	app.Get("/readyz", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })
	app.Get("/other", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })

	for _, path := range []string{"/healthz", "/readyz"} {
		req := httptest.NewRequest(fiber.MethodGet, path, nil)
		resp, err := app.Test(req, -1)
		if err != nil {
			t.Fatalf("request failed for %s: %v", path, err)
		}
		if resp.StatusCode != fiber.StatusOK {
			t.Fatalf("expected status 200 for %s, got %d", path, resp.StatusCode)
		}
	}

	if got := buf.String(); got != "" {
		t.Fatalf("expected no request log entries for quiet paths, got %q", got)
	}

	req := httptest.NewRequest(fiber.MethodGet, "/other", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed for /other: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected status 200 for /other, got %d", resp.StatusCode)
	}

	if !strings.Contains(buf.String(), "GET /other") {
		t.Fatalf("expected request log entry for /other, got %q", buf.String())
	}
}

func TestInitLogging_RespectsEnvLevel(t *testing.T) {
	origOut := logrus.StandardLogger().Out
	origLevel := logrus.GetLevel()
	defer func() {
		logrus.SetOutput(origOut)
		logrus.SetLevel(origLevel)
	}()

	t.Setenv("LOG_LEVEL", "warn")

	// ensure app.log can be opened in test working directory
	_ = os.Remove("app.log")
	initLogging()

	if logrus.GetLevel() != logrus.WarnLevel {
		t.Fatalf("expected warn level, got %s", logrus.GetLevel().String())
	}
}
