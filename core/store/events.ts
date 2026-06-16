import type Event from "../../packages/models/event.model";
import type { DB } from "./db";

export class EventStore {
    constructor(private db: DB) { }

    insert(event: Event): void {
        const query = this.db.conn.query(`
            INSERT INTO events (site_id, detected_at, screenshot_path)
            VALUES ($site_id, $detected_at, $screenshot_path)\
            RETURNING *;
        `);

        query.get({
            $site_id: event.site_id,
            $detected_at: event.detected_at,
            $screenshot_path: event.screenshot_path || null,
        }) as Event;
    }

    getBySiteID(siteId: string, limit: number = 10): Event[] {
        const query = this.db.conn.query(`
            SELECT id, site_id, detected_at, screenshot_path, created_at 
            FROM events 
                WHERE site_id = ? 
            ORDER BY detected_at DESC 
            LIMIT ?
        `);
        return query.all(siteId, limit) as Event[];
    }
}
