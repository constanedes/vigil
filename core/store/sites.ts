import { DB } from "./db";

export interface Site {
    id: string;
    url: string;
    strategy: string;
    interval_seconds: number;
    enabled: number;
    created_at?: string;
    updated_at?: string | null;
}

export function getAllSites(db: DB): Site[] {
    const query = db.conn.query(`SELECT id, url, strategy, interval_seconds, enabled, created_at, updated_at FROM sites`);
    return query.all() as Site[];
}

export function getSiteByID(db: DB, id: string): Site | null {
    const query = db.conn.query(`SELECT id, url, strategy, interval_seconds, enabled, created_at, updated_at FROM sites WHERE id = ?`);
    const site = query.get(id) as Site | null;
    return site || null;
}

export function createSite(db: DB, site: Site): void {
    const query = db.conn.query(`
        INSERT INTO sites (id, url, strategy, interval_seconds, enabled)
        VALUES ($id, $url, $strategy, $interval_seconds, $enabled)
    `);
    
    query.run({
        $id: site.id,
        $url: site.url,
        $strategy: site.strategy,
        $interval_seconds: site.interval_seconds,
        $enabled: site.enabled
    });
}
