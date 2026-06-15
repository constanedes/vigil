package api

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"vigil-core/logger"
	"vigil-core/store"
)

// handleHealth returns the server health status and uptime.
// GET /health
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	uptime := time.Since(s.startAt).Round(time.Second)
	writeJSON(w, http.StatusOK, map[string]any{
		"status": "ok",
		"uptime": uptime.String(),
	})
}

// handleStatus returns the list of sites with their last event.
// GET /status
func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	log := logger.Get()

	sites, err := s.db.GetAllSites()
	if err != nil {
		log.Error(fmt.Sprintf("Error getting sites: %v", err))
		writeError(w, http.StatusInternalServerError, "failed to get sites")
		return
	}

	type SiteStatus struct {
		store.Site
		LastEvent *store.Event `json:"last_event,omitempty"`
		Status    string       `json:"status"`
	}

	var result []SiteStatus
	for _, site := range sites {
		ss := SiteStatus{Site: site, Status: "OK"}

		events, err := s.db.GetEventsBySite(site.ID, 1)
		if err == nil && len(events) > 0 {
			ss.LastEvent = &events[0]
			// If last event was within the last interval, mark as changed
			if time.Since(events[0].DetectedAt) < time.Duration(site.IntervalSeconds)*time.Second {
				ss.Status = "CAMBIO DETECTADO"
			}
		}

		result = append(result, ss)
	}

	if result == nil {
		result = []SiteStatus{}
	}
	writeJSON(w, http.StatusOK, result)
}

// handleLogs returns the last N events from history.
// GET /logs?limit=50
func (s *Server) handleLogs(w http.ResponseWriter, r *http.Request) {
	log := logger.Get()

	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}

	events, err := s.db.GetRecentEvents(limit)
	if err != nil {
		log.Error(fmt.Sprintf("Error getting events: %v", err))
		writeError(w, http.StatusInternalServerError, "failed to get events")
		return
	}

	if events == nil {
		events = []store.Event{}
	}
	writeJSON(w, http.StatusOK, events)
}

// handleScreenshot serves screenshot images from the data/screenshots directory.
// GET /screenshots/{filename}
func (s *Server) handleScreenshot(w http.ResponseWriter, r *http.Request) {
	filename := strings.TrimPrefix(r.URL.Path, "/screenshots/")
	if filename == "" || strings.Contains(filename, "..") {
		writeError(w, http.StatusBadRequest, "invalid filename")
		return
	}

	screenshotDir := os.Getenv("SCREENSHOT_DIR")
	if screenshotDir == "" {
		screenshotDir = "./data/screenshots"
	}

	path := filepath.Join(screenshotDir, filename)
	if _, err := os.Stat(path); os.IsNotExist(err) {
		writeError(w, http.StatusNotFound, "screenshot not found")
		return
	}

	w.Header().Set("Content-Type", "image/png")
	http.ServeFile(w, r, path)
}
