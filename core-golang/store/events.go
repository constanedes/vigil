package store

import (
	"fmt"
	"time"
)

// Event represents a detected change on a monitored site.
type Event struct {
	ID             int64     `json:"id"`
	SiteID         string    `json:"site_id"`
	DetectedAt     time.Time `json:"detected_at"`
	ScreenshotPath string    `json:"screenshot_path,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

// SaveEvent inserts a new change detection event.
func (db *DB) SaveEvent(e *Event) error {
	result, err := db.conn.Exec(`
		INSERT INTO events (site_id, detected_at, screenshot_path, created_at)
		VALUES (?, ?, ?, ?)`,
		e.SiteID, e.DetectedAt, e.ScreenshotPath, time.Now().UTC(),
	)
	if err != nil {
		return fmt.Errorf("store: save event: %w", err)
	}
	e.ID, _ = result.LastInsertId()
	return nil
}

// GetRecentEvents returns the last N events across all sites, newest first.
func (db *DB) GetRecentEvents(limit int) ([]Event, error) {
	rows, err := db.conn.Query(`
		SELECT id, site_id, detected_at, screenshot_path, created_at
		FROM events
		ORDER BY detected_at DESC
		LIMIT ?`, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("store: get recent events: %w", err)
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		var e Event
		if err := rows.Scan(&e.ID, &e.SiteID, &e.DetectedAt, &e.ScreenshotPath, &e.CreatedAt); err != nil {
			return nil, fmt.Errorf("store: scan event: %w", err)
		}
		events = append(events, e)
	}
	return events, rows.Err()
}

// GetEventsBySite returns events for a specific site, newest first.
func (db *DB) GetEventsBySite(siteID string, limit int) ([]Event, error) {
	rows, err := db.conn.Query(`
		SELECT id, site_id, detected_at, screenshot_path, created_at
		FROM events
		WHERE site_id = ?
		ORDER BY detected_at DESC
		LIMIT ?`, siteID, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("store: get events by site: %w", err)
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		var e Event
		if err := rows.Scan(&e.ID, &e.SiteID, &e.DetectedAt, &e.ScreenshotPath, &e.CreatedAt); err != nil {
			return nil, fmt.Errorf("store: scan event: %w", err)
		}
		events = append(events, e)
	}
	return events, rows.Err()
}

// CountEvents returns the total number of events.
func (db *DB) CountEvents() (int64, error) {
	var count int64
	err := db.conn.QueryRow("SELECT COUNT(*) FROM events").Scan(&count)
	return count, err
}
