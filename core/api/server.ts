import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { DB } from "../store/db";
import { Notifier } from "../notifier/notifier";
import { get as getLogger } from "../logger/logger";
import { siteHandlers } from "./site_handlers";
import { eventHandlers } from "./event_handlers";
import { systemHandlers } from "./system_handlers";

export function createServer(db: DB, notifier: Notifier, startAt: Date) {
    const log = getLogger();

    const app = new Elysia()
        .use(cors())
        .onRequest(({ request }) => {
            const url = new URL(request.url);
            log.info(`${request.method} ${url.pathname}`);
        })
        .use(siteHandlers(db))
        .use(eventHandlers(db, notifier))
        .use(systemHandlers(startAt));

    return app;
}
