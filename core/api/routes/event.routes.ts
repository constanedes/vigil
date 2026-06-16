import Elysia, { t } from "elysia";
import type { Notifier } from "../../notifier/notifier";
import type { EventStore } from "../../store/events";
import { EventHandlers } from "../handlers/event.handlers";

export const eventRoutes = (eventStore: EventStore, notifier: Notifier) => {
    const handlers = new EventHandlers(eventStore, notifier);

    return new Elysia()
        .post("/event", handlers.createEvent, {
            body: t.Object({
                site_id: t.String(),
                url: t.String(),
                screenshot_path: t.Optional(t.String()),
                diff_summary: t.String(),
                detected_at: t.String(),
            }),
        })
        .post("/test-notification", handlers.testNotification);
};
