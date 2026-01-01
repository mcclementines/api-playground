package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"jonathanmcclement.com/playground/internal/proxy"
)

// ProxyHandler handles proxy requests
type ProxyHandler struct {
	logger      *slog.Logger
	proxyClient *proxy.Client
}

// NewProxyHandler creates a new proxy handler
func NewProxyHandler(logger *slog.Logger, proxyClient *proxy.Client) *ProxyHandler {
	return &ProxyHandler{
		logger:      logger,
		proxyClient: proxyClient,
	}
}

// Handle handles POST /api/proxy
func (h *ProxyHandler) Handle(w http.ResponseWriter, r *http.Request) {
	var req proxy.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Warn("invalid request body", "error", err)
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	h.logger.Info("proxying request", "service", req.Service, "method", req.Method, "path", req.Path)

	resp, err := h.proxyClient.Forward(&req)
	if err != nil {
		h.logger.Error("proxy failed", "error", err, "service", req.Service, "method", req.Method, "path", req.Path)
		http.Error(w, "proxy request failed", http.StatusBadGateway)
		return
	}

	h.logger.Info("proxy successful", "service", req.Service, "status", resp.StatusCode)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		h.logger.Error("failed to encode response", "error", err)
	}
}
