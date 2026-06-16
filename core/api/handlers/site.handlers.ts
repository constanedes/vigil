import type { SiteStore } from "../../store/sites";

export class SiteHandlers {
    constructor(private siteStore: SiteStore) {}

    getAll = () => {
        try {
            return this.siteStore.getAll();
        } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
    };

    create = ({ body }: { body: any }) => {
        try {
            const { id, url, strategy, interval_seconds, enabled } = body;
            this.siteStore.create({
                id,
                url,
                strategy: strategy || "text",
                interval_seconds: interval_seconds || 600,
                enabled: enabled !== undefined ? enabled : 1,
            });
            return { status: "created", id };
        } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
    };
}
