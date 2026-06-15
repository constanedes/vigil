package store

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

// DB wraps the SQLite connection.
type DB struct {
	conn *sql.DB
}

// Open creates or opens the SQLite database at the given path and runs migrations.
func Open(dbPath string) (*DB, error) {
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return nil, fmt.Errorf("store: create data dir: %w", err)
	}

	conn, err := sql.Open("sqlite", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, fmt.Errorf("store: open db: %w", err)
	}

	// Enable WAL mode and foreign keys
	pragmas := []string{
		"PRAGMA journal_mode=WAL",
		"PRAGMA foreign_keys=ON",
		"PRAGMA busy_timeout=5000",
	}
	for _, p := range pragmas {
		if _, err := conn.Exec(p); err != nil {
			return nil, fmt.Errorf("store: pragma %q: %w", p, err)
		}
	}

	db := &DB{conn: conn}
	if err := db.migrate(); err != nil {
		return nil, fmt.Errorf("store: migrate: %w", err)
	}

	return db, nil
}

// Close closes the underlying database connection.
func (db *DB) Close() error {
	return db.conn.Close()
}

// Conn returns the underlying *sql.DB for advanced queries.
func (db *DB) Conn() *sql.DB {
	return db.conn
}

func (db *DB) migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS sites (
		id              TEXT PRIMARY KEY,
		url             TEXT NOT NULL,
		strategy        TEXT NOT NULL DEFAULT 'text',
		interval_seconds INTEGER NOT NULL DEFAULT 600,
		enabled         INTEGER NOT NULL DEFAULT 1,
		created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
		updated_at      DATETIME
	);

	CREATE TABLE IF NOT EXISTS events (
		id              INTEGER PRIMARY KEY AUTOINCREMENT,
		site_id         TEXT NOT NULL REFERENCES sites(id),
		detected_at     DATETIME NOT NULL,
		screenshot_path TEXT,
		created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_events_site_id ON events(site_id, detected_at DESC);
	`

	_, err := db.conn.Exec(schema)
	if err != nil {
		return err
	}

	return nil
}
