package proxy

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"jonathanmcclement.com/playground/internal/storage"
)

// Request represents an incoming proxy request
type Request struct {
	Service string            `json:"service"`
	Method  string            `json:"method"`
	Path    string            `json:"path"`
	Headers map[string]string `json:"headers"`
	Body    json.RawMessage   `json:"body"` // Raw JSON to forward as-is
}

// Response represents a proxied response
type Response struct {
	StatusCode int                 `json:"statusCode"`
	Headers    map[string][]string `json:"headers"`
	Body       json.RawMessage     `json:"body"`
}

// Client handles proxying requests to backend services
type Client struct {
	httpClient *http.Client
	store      storage.SpecStore
}

// NewClient creates a new proxy client
func NewClient(store storage.SpecStore) *Client {
	return &Client{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		store: store,
	}
}

// Forward sends the request to the appropriate backend service
// Adds auth headers from config, merges with request headers
func (c *Client) Forward(req *Request) (*Response, error) {
	// Validate method
	if !isValidHTTPMethod(req.Method) {
		return nil, fmt.Errorf("invalid HTTP method: %s", req.Method)
	}

	// Get service config
	config, err := c.store.GetConfig(req.Service)
	if err != nil {
		return nil, fmt.Errorf("service not found: %s", req.Service)
	}

	// Construct target URL
	targetURL := config.BaseURL + req.Path

	// Create HTTP request
	var bodyReader io.Reader
	if len(req.Body) > 0 {
		bodyReader = bytes.NewReader(req.Body)
	}

	httpReq, err := http.NewRequest(req.Method, targetURL, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set auth headers from config first
	if config.AuthHeaders != nil {
		for key, value := range config.AuthHeaders {
			httpReq.Header.Set(key, value)
		}
	}

	// Overlay request headers (allows override)
	if req.Headers != nil {
		for key, value := range req.Headers {
			httpReq.Header.Set(key, value)
		}
	}

	// Set Content-Type if body is present and not already set
	if len(req.Body) > 0 && httpReq.Header.Get("Content-Type") == "" {
		httpReq.Header.Set("Content-Type", "application/json")
	}

	// Execute request
	httpResp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer httpResp.Body.Close()

	// Read response body
	respBody, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Build response
	resp := &Response{
		StatusCode: httpResp.StatusCode,
		Headers:    httpResp.Header,
		Body:       json.RawMessage(respBody),
	}

	return resp, nil
}

// isValidHTTPMethod checks if the method is a valid HTTP method
func isValidHTTPMethod(method string) bool {
	validMethods := map[string]bool{
		http.MethodGet:     true,
		http.MethodPost:    true,
		http.MethodPut:     true,
		http.MethodPatch:   true,
		http.MethodDelete:  true,
		http.MethodHead:    true,
		http.MethodOptions: true,
	}
	return validMethods[method]
}
