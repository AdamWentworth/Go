package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestAutocomplete_RejectsShortQuery(t *testing.T) {
	app := fiber.New()
	app.Get("/autocomplete", AutocompleteHandler(nil))

	req := httptest.NewRequest(http.MethodGet, "/autocomplete?query=ab", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestGeocode_MissingQueryReturnsBadRequest(t *testing.T) {
	app := fiber.New()
	app.Get("/geocode", GeocodeHandler(nil))

	req := httptest.NewRequest(http.MethodGet, "/geocode", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestReverse_MissingLatLonReturnsBadRequest(t *testing.T) {
	app := fiber.New()
	app.Get("/reverse", ReverseGeocodeHandler(nil))

	req := httptest.NewRequest(http.MethodGet, "/reverse", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestReverse_OutOfRangeReturnsBadRequest(t *testing.T) {
	app := fiber.New()
	app.Get("/reverse", ReverseGeocodeHandler(nil))

	req := httptest.NewRequest(http.MethodGet, "/reverse?lat=95&lon=200", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestViewer_LongPathParamsRejected(t *testing.T) {
	app := fiber.New()
	app.Get("/city/:country/:state?/:name?", ViewerHandler(nil))

	long := "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
	req := httptest.NewRequest(http.MethodGet, "/city/"+long, nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}
