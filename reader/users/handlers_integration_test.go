package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/gofiber/fiber/v2"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func setupMockDB(t *testing.T) (sqlmock.Sqlmock, func()) {
	t.Helper()

	sqlDB, mock, err := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherRegexp))
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}

	gdb, err := gorm.Open(mysql.New(mysql.Config{
		Conn:                      sqlDB,
		SkipInitializeWithVersion: true,
	}), &gorm.Config{})
	if err != nil {
		_ = sqlDB.Close()
		t.Fatalf("failed to open gorm over sqlmock: %v", err)
	}

	prevDB := db
	db = gdb

	cleanup := func() {
		db = prevDB
		_ = sqlDB.Close()
	}

	return mock, cleanup
}

func newHandlerTestApp(authUserID string) *fiber.App {
	app := fiber.New(fiber.Config{ErrorHandler: errorHandler})

	app.Use(func(c *fiber.Ctx) error {
		c.Locals("user_id", authUserID)
		return c.Next()
	})

	// Protected endpoints used in tests.
	app.Put("/api/users/:user_id", UpdateUserHandler)
	app.Put("/api/update-user/:user_id", UpdateUserHandler)
	app.Put("/api/users/update-user/:user_id", UpdateUserHandler)
	app.Get("/api/users/:user_id/overview", GetUserOverviewHandler)
	app.Get("/api/instances/by-username/:username", GetInstancesByUsername)
	app.Get("/api/users/instances/by-username/:username", GetInstancesByUsername)

	// Public endpoints used in tests.
	app.Get("/api/public/users/:username", GetPublicSnapshotByUsername)
	app.Get("/api/users/public/users/:username", GetPublicSnapshotByUsername)

	return app
}

func makeJSONRequest(t *testing.T, method, path string, body any) *http.Request {
	t.Helper()
	var payload []byte
	switch v := body.(type) {
	case nil:
		payload = nil
	default:
		b, err := json.Marshal(v)
		if err != nil {
			t.Fatalf("failed to marshal request body: %v", err)
		}
		payload = b
	}

	req := httptest.NewRequest(method, path, bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	return req
}

func TestUpdateUserHandler_ForbiddenWhenAuthUserMismatch(t *testing.T) {
	app := newHandlerTestApp("different-user")
	req := makeJSONRequest(t, http.MethodPut, "/api/update-user/user-123", map[string]any{
		"username": "adam",
	})

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("unexpected status: got %d, want %d", resp.StatusCode, http.StatusForbidden)
	}
}

func TestUpdateUserHandler_UpdatesExistingUser(t *testing.T) {
	mock, cleanup := setupMockDB(t)
	defer cleanup()

	app := newHandlerTestApp("user-123")

	mock.ExpectQuery(regexp.QuoteMeta("SELECT * FROM `users` WHERE username = ? AND user_id <> ? ORDER BY `users`.`user_id` LIMIT ?")).
		WithArgs("adam", "user-123", 1).
		WillReturnRows(sqlmock.NewRows([]string{"user_id"}))

	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta("UPDATE `users` SET")).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	mock.ExpectQuery(regexp.QuoteMeta("SELECT * FROM `users` WHERE user_id = ? ORDER BY `users`.`user_id` LIMIT ?")).
		WithArgs("user-123", 1).
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "username", "allow_location", "app_joined_at"}).
			AddRow("user-123", "adam", false, time.Now()))

	req := makeJSONRequest(t, http.MethodPut, "/api/users/user-123", map[string]any{
		"username": "adam",
	})

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("unexpected status: got %d, want %d", resp.StatusCode, http.StatusOK)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sqlmock expectations: %v", err)
	}
}

func TestUpdateUserHandler_InsertsWhenNoExistingRow(t *testing.T) {
	mock, cleanup := setupMockDB(t)
	defer cleanup()

	app := newHandlerTestApp("user-999")

	mock.ExpectQuery(regexp.QuoteMeta("SELECT * FROM `users` WHERE username = ? AND user_id <> ? ORDER BY `users`.`user_id` LIMIT ?")).
		WithArgs("new_user", "user-999", 1).
		WillReturnRows(sqlmock.NewRows([]string{"user_id"}))

	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta("UPDATE `users` SET")).
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectCommit()

	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta("INSERT INTO `users`")).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	mock.ExpectQuery(regexp.QuoteMeta("SELECT * FROM `users` WHERE user_id = ? ORDER BY `users`.`user_id` LIMIT ?")).
		WithArgs("user-999", 1).
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "username", "allow_location", "app_joined_at"}).
			AddRow("user-999", "new_user", false, time.Now()))

	req := makeJSONRequest(t, http.MethodPut, "/api/users/update-user/user-999", map[string]any{
		"username": "new_user",
	})

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("unexpected status: got %d, want %d", resp.StatusCode, http.StatusOK)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sqlmock expectations: %v", err)
	}
}

func TestUpdateUserHandler_UsernameConflict(t *testing.T) {
	mock, cleanup := setupMockDB(t)
	defer cleanup()

	app := newHandlerTestApp("user-123")

	mock.ExpectQuery(regexp.QuoteMeta("SELECT * FROM `users` WHERE username = ? AND user_id <> ? ORDER BY `users`.`user_id` LIMIT ?")).
		WithArgs("taken_name", "user-123", 1).
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "username"}).AddRow("other-user", "taken_name"))

	req := makeJSONRequest(t, http.MethodPut, "/api/update-user/user-123", map[string]any{
		"username": "taken_name",
	})

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusConflict {
		t.Fatalf("unexpected status: got %d, want %d", resp.StatusCode, http.StatusConflict)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sqlmock expectations: %v", err)
	}
}

func TestGetPublicSnapshotByUsername_UsesUserIDForInstanceLookup(t *testing.T) {
	mock, cleanup := setupMockDB(t)
	defer cleanup()

	app := newHandlerTestApp("irrelevant")

	mock.ExpectQuery("SELECT user_id, username, pokemon_go_name, team, trainer_level, total_xp,").
		WithArgs("adam").
		WillReturnRows(sqlmock.NewRows([]string{
			"user_id", "username", "pokemon_go_name", "team", "trainer_level", "total_xp",
			"pogo_started_on", "app_joined_at",
			"highlight1", "highlight2", "highlight3", "highlight4", "highlight5", "highlight6",
		}).AddRow("user-abc", "Adam", nil, nil, nil, nil, nil, time.Now(), nil, nil, nil, nil, nil, nil))

	mock.ExpectQuery(regexp.QuoteMeta("SELECT * FROM `instances` WHERE user_id = ?")).
		WithArgs("user-abc").
		WillReturnRows(sqlmock.NewRows([]string{"instance_id", "user_id", "pokemon_id", "shiny", "lucky", "shadow", "purified", "date_added", "last_update", "disabled", "is_traded", "mega", "dynamax", "gigantamax", "crown", "is_fused", "is_caught", "is_for_trade", "is_wanted", "most_wanted", "mirror", "pref_lucky", "registered", "favorite"}))

	req := makeJSONRequest(t, http.MethodGet, "/api/public/users/adam", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("unexpected status: got %d, want %d", resp.StatusCode, http.StatusOK)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sqlmock expectations: %v", err)
	}
}

func TestGetUserOverviewHandler_RejectsMissingDeviceID(t *testing.T) {
	app := newHandlerTestApp("user-1")
	req := makeJSONRequest(t, http.MethodGet, "/api/users/user-1/overview", nil)

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("unexpected status: got %d, want %d", resp.StatusCode, http.StatusBadRequest)
	}
}

func TestGetUserOverviewHandler_RejectsUserMismatch(t *testing.T) {
	app := newHandlerTestApp("user-auth")
	req := makeJSONRequest(t, http.MethodGet, "/api/users/user-other/overview?device_id=dev-1", nil)

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("unexpected status: got %d, want %d", resp.StatusCode, http.StatusForbidden)
	}
}

func TestGetInstancesByUsername_Found_CaseInsensitive(t *testing.T) {
	mock, cleanup := setupMockDB(t)
	defer cleanup()

	app := newHandlerTestApp("auth-user")

	mock.ExpectQuery(regexp.QuoteMeta("SELECT user_id, username FROM `users` WHERE LOWER(username)=? ORDER BY `users`.`user_id` LIMIT ?")).
		WithArgs("fakeuser0632", 1).
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "username"}).AddRow("user-42", "fakeUser0632"))

	mock.ExpectQuery(regexp.QuoteMeta("SELECT * FROM `instances` WHERE user_id = ?")).
		WithArgs("user-42").
		WillReturnRows(sqlmock.NewRows([]string{
			"instance_id", "user_id", "variant_id", "pokemon_id", "shiny", "lucky", "shadow", "purified",
			"date_added", "last_update", "disabled", "is_traded", "mega", "dynamax", "gigantamax", "crown",
			"is_fused", "is_caught", "is_for_trade", "is_wanted", "most_wanted", "mirror", "pref_lucky",
			"registered", "favorite",
		}).AddRow(
			"inst-1", "user-42", "0001-default", 1, false, false, false, false,
			time.Now(), int64(1770686000000), false, false, false, false, false, false,
			false, true, false, false, false, false, false, true, false,
		))

	req := makeJSONRequest(t, http.MethodGet, "/api/users/instances/by-username/FakeUser0632", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("unexpected status: got %d, want %d", resp.StatusCode, http.StatusOK)
	}

	var body map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode body failed: %v", err)
	}
	if got := body["username"]; got != "fakeUser0632" {
		t.Fatalf("unexpected canonical username: got %v, want %q", got, "fakeUser0632")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sqlmock expectations: %v", err)
	}
}

func TestGetInstancesByUsername_NotFound(t *testing.T) {
	mock, cleanup := setupMockDB(t)
	defer cleanup()

	app := newHandlerTestApp("auth-user")

	mock.ExpectQuery(regexp.QuoteMeta("SELECT user_id, username FROM `users` WHERE LOWER(username)=? ORDER BY `users`.`user_id` LIMIT ?")).
		WithArgs("missinguser", 1).
		WillReturnError(gorm.ErrRecordNotFound)

	req := makeJSONRequest(t, http.MethodGet, "/api/instances/by-username/missinguser", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("unexpected status: got %d, want %d", resp.StatusCode, http.StatusNotFound)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sqlmock expectations: %v", err)
	}
}
