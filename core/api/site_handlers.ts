import Elysia, { t } from "elysia";
import { DB } from "../store/db";
import { getAllSites, createSite } from "../store/sites";

export function siteHandlers(db: DB) {
    return new Elysia()
        .get("/sites", () => {
            try {
                const sites = getAllSites(db);
                return sites;
            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
            }
        })
        .post("/sites", ({ body }) => {
            try {
                const { id, url, strategy, interval_seconds, enabled } = body;
                createSite(db, {
                    id,
                    url,
                    strategy: strategy || "text",
                    interval_seconds: interval_seconds || 600,
                    enabled: enabled !== undefined ? enabled : 1
                });
                return { status: "created", id };
            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
            }
        }, {
            body: t.Object({
                id: t.String(),
                url: t.String(),
                strategy: t.Optional(t.String()),
                interval_seconds: t.Optional(t.Number()),
                enabled: t.Optional(t.Number())
            })
        });
}



