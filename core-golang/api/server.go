package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"vigil-core/logger"
	"vigil-core/notifier"
	"vigil-core/store"
)

// Server holds the HTTP server dependencies.
type Server struct {
	db       *store.DB
	tgCfg    notifier.TelegramConfig
	emailCfg notifier.EmailConfig
	startAt  time.Time
	mux      *http.ServeMux
}

// NewServer creates a new API server with all dependencies wired.
func NewServer(db *store.DB, tgCfg notifier.TelegramConfig, emailCfg notifier.EmailConfig) *Server {
	s := &Server{
		db:       db,
		tgCfg:    tgCfg,
		emailCfg: emailCfg,
		startAt:  time.Now(),
		mux:      http.NewServeMux(),
	}
	s.registerRoutes()
	return s
}

// ServeHTTP implements http.Handler.
func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// CORS headers for dashboard
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Request logging
	log := logger.Get()
	start := time.Now()
	log.Info(fmt.Sprintf("%s %s", r.Method, r.URL.Path))

	s.mux.ServeHTTP(w, r)

	log.Info(fmt.Sprintf("%s %s completed in %v", r.Method, r.URL.Path, time.Since(start)))
}

func (s *Server) registerRoutes() {
	s.mux.HandleFunc("POST /event", s.handlePostEvent)
	s.mux.HandleFunc("POST /sites", s.handlePostSites)
	s.mux.HandleFunc("POST /test-notification", s.handleTestNotification)
	s.mux.HandleFunc("GET /health", s.handleHealth)
	s.mux.HandleFunc("GET /sites", s.handleGetSites)
	s.mux.HandleFunc("GET /status", s.handleStatus)
	s.mux.HandleFunc("GET /logs", s.handleLogs)
	s.mux.HandleFunc("GET /screenshots/", s.handleScreenshot)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
