import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { eventRoutes } from "../api/routes/event.routes";
import { siteRoutes } from "../api/routes/site.routes";
import { systemRoutes } from "../api/routes/system.routes";
import { get as getLogger } from "../logger/logger";
import type { Notifier } from "../notifier/notifier";
import type { DB } from "../store/db";
import { EventStore } from "../store/events";
import { SiteStore } from "../store/sites";

export function createServer(db: DB, notifier: Notifier, startAt: Date) {
    const log = getLogger();

    // Initialize store dependencies
    const siteStore = new SiteStore(db);
    const eventStore = new EventStore(db);

    const app = new Elysia()
        .use(cors())
        .onRequest(({ request }) => {
            const url = new URL(request.url);
            log.info(`${request.method} ${url.pathname}`);
        })
        .use(siteRoutes(siteStore))
        .use(eventRoutes(eventStore, notifier))
        .use(systemRoutes(startAt));
    return app;
}
