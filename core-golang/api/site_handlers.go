package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"vigil-core/logger"
	"vigil-core/store"
)

// handleGetSites returns the list of all configured sites.
// GET /sites
func (s *Server) handleGetSites(w http.ResponseWriter, r *http.Request) {
	log := logger.Get()

	sites, err := s.db.GetAllSites()
	if err != nil {
		log.Error(fmt.Sprintf("Error getting sites: %v", err))
		writeError(w, http.StatusInternalServerError, "failed to get sites")
		return
	}

	if sites == nil {
		sites = []store.Site{}
	}
	writeJSON(w, http.StatusOK, sites)
}

// handlePostSites adds a new site to the database.
// POST /sites
func (s *Server) handlePostSites(w http.ResponseWriter, r *http.Request) {
	log := logger.Get()

	var site store.Site
	if err := json.NewDecoder(r.Body).Decode(&site); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	if site.ID == "" || site.URL == "" {
		writeError(w, http.StatusBadRequest, "id and url are required")
		return
	}

	// Always enable by default when created via UI
	site.Enabled = true
	site.CreatedAt = time.Now().UTC()

	// Upsert the site
	if err := s.db.UpsertSite(&site); err != nil {
		log.Error(fmt.Sprintf("Error saving site: %v", err))
		writeError(w, http.StatusInternalServerError, "failed to save site")
		return
	}

	log.Info(fmt.Sprintf("New site added: %s", site.ID))

	writeJSON(w, http.StatusCreated, map[string]any{
		"status":  "ok",
		"message": "site created successfully",
		"site":    site,
	})
}
