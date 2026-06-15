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

// handlePostEvent receives a ChangeEvent from the scraper, saves it, and triggers notifications.
// POST /event
func (s *Server) handlePostEvent(w http.ResponseWriter, r *http.Request) {
	log := logger.Get()

	var event notifier.ChangeEvent
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	if event.SiteID == "" || event.URL == "" {
		writeError(w, http.StatusBadRequest, "site_id and url are required")
		return
	}

	if event.DetectedAt == "" {
		event.DetectedAt = time.Now().UTC().Format(time.RFC3339)
	}

	log.Event(fmt.Sprintf("Change detected on %s! Dispatching notifications...", event.SiteID))

	// Save event to database
	detectedAt, _ := time.Parse(time.RFC3339, event.DetectedAt)
	dbEvent := &store.Event{
		SiteID:         event.SiteID,
		DetectedAt:     detectedAt,
		ScreenshotPath: event.ScreenshotPath,
	}
	if err := s.db.SaveEvent(dbEvent); err != nil {
		log.Error(fmt.Sprintf("Error saving event: %v", err))
		writeError(w, http.StatusInternalServerError, "failed to save event")
		return
	}

	// Trigger notifications in parallel
	go notifier.NotifyAll(s.tgCfg, s.emailCfg, event)

	writeJSON(w, http.StatusCreated, map[string]any{
		"status":   "ok",
		"event_id": dbEvent.ID,
		"message":  "event received, notifications dispatched",
	})
}

// handleTestNotification triggers a test notification to all configured channels.
// POST /test-notification
func (s *Server) handleTestNotification(w http.ResponseWriter, r *http.Request) {
	log := logger.Get()
	var timestamp string = time.Now().UTC().Format(time.RFC3339)

	event := notifier.ChangeEvent{
		SiteID:         "test-site",
		URL:            "https://example.com",
		DetectedAt:     timestamp,
		DiffSummary:    fmt.Sprintf("Test message generated from Vigil Dashboard. %s", timestamp),
		ScreenshotPath: "", // Optional
	}

	log.Info("Triggering test notification...")

	// Trigger notifications in parallel
	go notifier.NotifyAll(s.tgCfg, s.emailCfg, event)

	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "ok",
		"message": "test notification dispatched",
	})
}
