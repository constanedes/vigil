import Elysia, { t } from "elysia";
import { DB } from "../store/db";
import { insertEvent } from "../store/events";
import { Notifier, ChangeEvent } from "../notifier/notifier";

export function eventHandlers(db: DB, notifier: Notifier) {
    return new Elysia()
        .post("/event", async ({ body }) => {
            try {
                const event = body as ChangeEvent;
                // 1. Save to DB
                insertEvent(db, {
                    site_id: event.site_id,
                    detected_at: event.detected_at,
                    screenshot_path: event.screenshot_path
                });

                // 2. Notify
                await notifier.notifyAll(event);

                return { status: "ok" };
            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
            }
        }, {
            body: t.Object({
                site_id: t.String(),
                url: t.String(),
                screenshot_path: t.Optional(t.String()),
                diff_summary: t.String(),
                detected_at: t.String()
            })
        })
        .post("/test-notification", async () => {
            try {
                const testEvent: ChangeEvent = {
                    site_id: "test-site",
                    url: "https://example.com",
                    diff_summary: "This is a test notification from Vigil Core (Bun).",
                    detected_at: new Date().toISOString()
                };
                await notifier.notifyAll(testEvent);
                return { status: "sent test" };
            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
            }
        });
}
