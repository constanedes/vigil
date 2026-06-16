import Elysia from "elysia";
import { SystemHandlers } from "../handlers/system.handlers";

export const systemRoutes = (startAt: Date) => {
    const handlers = new SystemHandlers(startAt);

    return new Elysia()
        .get("/health", handlers.getHealth)
        .get("/status", handlers.getStatus)
        .get("/logs", handlers.getLogs)
        .get("/screenshots/:file", handlers.getScreenshot)
        .get("/", handlers.getRoot);
};
