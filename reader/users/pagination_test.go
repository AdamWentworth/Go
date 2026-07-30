package main

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"
)

func TestRequestedPageSize(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c fiber.Ctx) error {
		limit, paginated, err := requestedPageSize(c)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).SendString(err.Error())
		}
		return c.JSON(fiber.Map{"limit": limit, "paginated": paginated})
	})

	for _, testCase := range []struct {
		query      string
		wantStatus int
	}{
		{"", fiber.StatusOK},
		{"?limit=1", fiber.StatusOK},
		{"?limit=100", fiber.StatusOK},
		{"?limit=0", fiber.StatusBadRequest},
		{"?limit=101", fiber.StatusBadRequest},
		{"?limit=nope", fiber.StatusBadRequest},
	} {
		response, err := app.Test(httptest.NewRequest("GET", "/"+testCase.query, nil))
		if err != nil {
			t.Fatalf("request %q failed: %v", testCase.query, err)
		}
		if response.StatusCode != testCase.wantStatus {
			t.Fatalf("request %q returned %d; want %d", testCase.query, response.StatusCode, testCase.wantStatus)
		}
	}
}

func TestCursorRoundTripAndRejectsMalformedValues(t *testing.T) {
	want := friendshipCursor{
		UpdatedAt:    time.Date(2026, 7, 29, 12, 0, 0, 0, time.UTC),
		FriendshipID: "friendship-42",
	}
	var got friendshipCursor
	if err := decodeCursor(encodeCursor(want), &got); err != nil {
		t.Fatalf("decode cursor: %v", err)
	}
	if !got.UpdatedAt.Equal(want.UpdatedAt) || got.FriendshipID != want.FriendshipID {
		t.Fatalf("cursor round trip = %#v; want %#v", got, want)
	}
	if err := decodeCursor("not-base64!", &got); err == nil {
		t.Fatal("malformed cursor was accepted")
	}
}
