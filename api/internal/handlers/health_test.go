package handlers_test

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"jonathanmcclement.com/playground/internal/handlers"
)

func TestHealthHandler_Check(t *testing.T) {
	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))
	handler := handlers.NewHealthHandler(logger)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	handler.Check(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	body := rec.Body.String()
	expected := "ok"
	if body != expected {
		t.Errorf("expected body %q, got %q", expected, body)
	}
}
