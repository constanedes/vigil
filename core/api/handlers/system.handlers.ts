import { readFileSync, statSync } from "fs";
import { join } from "path";

export class SystemHandlers {
    constructor(private startAt: Date) {}

    getHealth = () => {
        return { status: "ok" };
    };

    getStatus = () => {
        return {
            status: "running",
            uptime_seconds: Math.floor((Date.now() - this.startAt.getTime()) / 1000),
        };
    };

    getLogs = () => {
        try {
            const logPath = process.env.LOG_PATH || "./logs/vigil.log";
            return readFileSync(logPath, "utf-8");
        } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
    };

    getScreenshot = ({ params, set }: { params: { file: string }; set: any }) => {
        try {
            const filePath = join("./screenshots", params.file);
            const stat = statSync(filePath);

            if (stat.isFile()) {
                set.headers["Content-Type"] = "image/png";
                return Bun.file(filePath);
            }

            return new Response("Not found", { status: 404 });
        } catch (err) {
            return new Response("Not found", { status: 404 });
        }
    };

    getRoot = () => ({
        name: "Vigil Core",
        version: "0.1.0",
        endpoints: [
            "POST /event",
            "GET  /health",
            "GET  /status",
            "GET  /logs",
            "GET  /sites",
            "POST /sites",
        ],
    });
}
