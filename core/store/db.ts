import { Database } from "bun:sqlite";
import { mkdirSync, existsSync } from "fs";
import { dirname } from "path";

export class DB {
    public conn: Database;

    constructor(dbPath: string) {
        const dir = dirname(dbPath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }

        // Open connection with foreign keys and WAL enabled automatically by bun:sqlite but we can enforce some pragmas
        this.conn = new Database(dbPath, { create: true });

        // Setup Pragmas
        this.conn.run("PRAGMA journal_mode=WAL");
        this.conn.run("PRAGMA foreign_keys=ON");
        this.conn.run("PRAGMA busy_timeout=5000");

        this.migrate();
    }

    private migrate() {
        const schema = `
        CREATE TABLE IF NOT EXISTS sites (
            id               TEXT PRIMARY KEY,
            url              TEXT NOT NULL,
            strategy         TEXT NOT NULL DEFAULT 'text',
            jitter_seconds   INTEGER NOT NULL DEFAULT 0,
            interval_seconds INTEGER NOT NULL DEFAULT 600,
            enabled          INTEGER NOT NULL DEFAULT 1,
            created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at       DATETIME
        );

        CREATE TABLE IF NOT EXISTS events (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            site_id         TEXT NOT NULL REFERENCES sites(id),
            detected_at     DATETIME NOT NULL,
            screenshot_path TEXT,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_events_site_id ON events(site_id, detected_at DESC);
        `;

        this.conn.exec(schema);
    }

    close() {
        this.conn.close();
    }
}

export function openDb(dbPath: string): DB {
    return new DB(dbPath);
}
