package main

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"jonathanmcclement.com/playground/internal/config"
	"jonathanmcclement.com/playground/internal/handlers"
	"jonathanmcclement.com/playground/internal/proxy"
	"jonathanmcclement.com/playground/internal/storage"
)

type Server struct {
	logger      *slog.Logger
	specStore   storage.SpecStore
	proxyClient *proxy.Client
}

func main() {
	logger := setupLogging()

	// Load configuration
	cfg, err := config.LoadFromEnv()
	if err != nil {
		logger.Error("config load failed", "error", err)
		os.Exit(1)
	}

	// Initialize spec store
	specStore, err := storage.NewFileSpecStore(cfg.SpecsDir)
	if err != nil {
		logger.Error("spec store init failed", "error", err)
		os.Exit(1)
	}

	// Initialize proxy client
	proxyClient := proxy.NewClient(specStore)

	server := &Server{
		logger:      logger,
		specStore:   specStore,
		proxyClient: proxyClient,
	}

	srv := &http.Server{
		Addr:              ":8080",
		Handler:           server.routes(),
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	ln, err := net.Listen("tcp", srv.Addr)
	if err != nil {
		logger.Error("listen failed", "error", err)
	}

	go func() {
		logger.Info("server listening", "addr", srv.Addr)
		if err := srv.Serve(ln); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("serve failed", "error", err)
		}
	}()

	<-ctx.Done()
	logger.Info("shutdown signal received")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown failed, forcing close", "error", err)
		_ = srv.Close()
	}

	logger.Info("server stopped")
}

func (s *Server) routes() http.Handler {
	mux := http.NewServeMux()

	// Health endpoint
	healthHandler := handlers.NewHealthHandler(s.logger)
	mux.HandleFunc("GET /health", healthHandler.Check)

	// Specs endpoints
	specsHandler := handlers.NewSpecsHandler(s.logger, s.specStore)
	mux.HandleFunc("GET /api/specs", specsHandler.List)
	mux.HandleFunc("GET /api/specs/{service}", specsHandler.Get)

	// Proxy endpoint
	proxyHandler := handlers.NewProxyHandler(s.logger, s.proxyClient)
	mux.HandleFunc("POST /api/proxy", proxyHandler.Handle)

	return s.cors(s.logging(mux))
}

func (s *Server) logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)

		s.logger.Info("request", "method", r.Method, "path", r.URL.Path, "pattern", r.Pattern, "duration", time.Since(start))
	})
}

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "86400") // 24 hours

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
