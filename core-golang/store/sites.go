package store

import (
	"fmt"
	"time"
)

type Site struct {
	ID              string    `json:"id"`
	URL             string    `json:"url"`
	Strategy        string    `json:"strategy"`
	TargetSelector  string    `json:"target_selector,omitempty"`
	IntervalSeconds int       `json:"interval_seconds"`
	Enabled         bool      `json:"enabled"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// UpsertSite inserts or updates a site record (used during config sync).
func (db *DB) UpsertSite(s *Site) error {
	_, err := db.conn.Exec(`
		INSERT INTO sites (id, url, strategy, interval_seconds, enabled)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			url = excluded.url,
			strategy = excluded.strategy,
			interval_seconds = excluded.interval_seconds,
			enabled = excluded.enabled`,
		s.ID, s.URL, s.Strategy, s.TargetSelector, s.IntervalSeconds, boolToInt(s.Enabled),
	)
	if err != nil {
		return fmt.Errorf("store: upsert site: %w", err)
	}
	return nil
}

// GetAllSites returns all registered sites.
func (db *DB) GetAllSites() ([]Site, error) {
	rows, err := db.conn.Query(`
		SELECT id, url, strategy, interval_seconds, enabled, created_at
		FROM sites
		ORDER BY id`)
	if err != nil {
		return nil, fmt.Errorf("store: get all sites: %w", err)
	}
	defer rows.Close()

	var sites []Site
	for rows.Next() {
		var s Site
		var enabled int
		if err := rows.Scan(&s.ID, &s.URL, &s.Strategy, &s.IntervalSeconds, &enabled, &s.CreatedAt); err != nil {
			return nil, fmt.Errorf("store: scan site: %w", err)
		}
		s.Enabled = enabled != 0
		sites = append(sites, s)
	}
	return sites, rows.Err()
}

// GetSite returns a single site by ID.
func (db *DB) GetSite(id string) (*Site, error) {
	row := db.conn.QueryRow(`
		SELECT id, url, strategy, interval_seconds, enabled, created_at
		FROM sites
		WHERE id = ?`, id)

	var s Site
	var enabled int
	err := row.Scan(&s.ID, &s.URL, &s.Strategy, &s.IntervalSeconds, &enabled, &s.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("store: get site: %w", err)
	}
	s.Enabled = enabled != 0
	return &s, nil
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
