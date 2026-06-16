import type Site from "../models/site";
import type { DB } from "./db";

export class SiteStore {
    constructor(private db: DB) {}

    getAll(): Site[] {
        const query = this.db.conn.query(`SELECT * FROM sites`);
        return query.all() as Site[];
    }

    getByID(id: string): Site | null {
        const query = this.db.conn.query(`SELECT * FROM sites WHERE id = ?`);
        return (query.get(id) as Site) || null;
    }

    create(site: Site): void {
        const query = this.db.conn.query(`
            INSERT INTO sites (id, url, strategy, interval_seconds, enabled)
            VALUES ($id, $url, $strategy, $interval_seconds, $enabled)
        `);

        query.run({
            $id: site.id,
            $url: site.url,
            $strategy: site.strategy,
            $interval_seconds: site.interval_seconds,
            $enabled: site.enabled,
        });
    }
}
