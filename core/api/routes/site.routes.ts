import Elysia, { t } from "elysia";
import type { SiteStore } from "../../store/sites";
import { SiteHandlers } from "../handlers/site.handlers";

export const siteRoutes = (siteStore: SiteStore) => {
    const handlers = new SiteHandlers(siteStore);

    return new Elysia({ prefix: "/sites" }).get("/", handlers.getAll).post("/", handlers.create, {
        body: t.Object({
            id: t.String(),
            url: t.String(),
            strategy: t.Optional(t.String()),
            interval_seconds: t.Optional(t.Number()),
            enabled: t.Optional(t.Number()),
        }),
    });
};
