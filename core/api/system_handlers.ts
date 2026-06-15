import Elysia from "elysia";
import { get as getLogger } from "../logger/logger";
import { readFileSync, statSync } from "fs";
import { join } from "path";

export function systemHandlers(startAt: Date) {
    return new Elysia()
        .get("/health", () => {
            return { status: "ok" };
        })
        .get("/status", () => {
            return {
                status: "running",
                uptime_seconds: Math.floor((Date.now() - startAt.getTime()) / 1000)
            };
        })
        .get("/logs", () => {
            try {
                const logPath = process.env.LOG_PATH || "./logs/vigil.log";
                const logs = readFileSync(logPath, "utf-8");
                return logs;
            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
            }
        })
        .get("/screenshots/:file", ({ params, set }) => {
            try {
                const filePath = join("./screenshots", params.file);
                const stat = statSync(filePath);

                if (stat.isFile()) {
                    set.headers["Content-Type"] = "image/png"; // Defaulting to PNG
                    return Bun.file(filePath);
                }

                return new Response("Not found", { status: 404 });
            } catch (err) {
                return new Response("Not found", { status: 404 });
            }
        })
        .get("/", () => ({
            name: "Vigil Core",
            version: "0.1.0",
            endpoints: [
                "POST /event",
                "GET  /health",
                "GET  /status",
                "GET  /logs",
                "GET  /sites",
                "POST /sites",
            ]
        }));
}
