import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { DB } from "../store/db";
import { Notifier } from "../notifier/notifier";
import { get as getLogger } from "../logger/logger";
import { siteRoutes } from "../api/routes/site.routes";
import { eventRoutes } from "../api/routes/event.routes";
import { systemRoutes } from "../api/routes/system.routes";
import { SiteStore } from "../store/sites";
import { EventStore } from "../store/events";

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
        .use(systemRoutes(startAt))
    return app;
}
