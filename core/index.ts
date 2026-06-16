import { init as initLogger, get as getLogger } from "@core/logger";
import { openDb } from "@core/store/db";
import { Notifier } from "@core/notifier/notifier";
import { createServer } from "@core/api/server";

const logPath = process.env.LOG_PATH || "./logs/vigil.log";
const dbPath = process.env.DB_PATH || "./data/vigil.db";
const port = process.env.PORT || "8080";
const startAt = new Date();

async function main() {
    try {
        initLogger(logPath);
        const log = getLogger();

        log.info("=== Vigil Core started ===");

        const db = openDb(dbPath);
        log.info(`SQLite connected: ${dbPath}`);

        const notifier = new Notifier();
        const app = createServer(db, notifier, startAt);

        app.listen({
            port: port,
            hostname: "localhost",
            reusePort: false,
        })

        process.on("SIGINT", () => {
            log.info("Signal received: SIGINT. Closing...");
            db.close();
            process.exit(0);
        });

        process.on("SIGTERM", () => {
            log.info("Signal received: SIGTERM. Closing...");
            db.close();
            process.exit(0);
        });

        log.info(`Vigil API listening on http://localhost:${port}`);
    } catch (err) {
        if (err instanceof Error) {
            console.error("Critical error starting the application:", err.message);
        }
        process.exit(1);
    }
}

main();