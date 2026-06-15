import { init as initLogger, get as getLogger } from "./logger/logger";
import { openDb } from "./store/db";
import { Notifier } from "./notifier/notifier";
import { createServer } from "./api/server";

const logPath = process.env.LOG_PATH || "./logs/vigil.log";
initLogger(logPath);
const log = getLogger();

log.info("=== Vigil Core started ===");

const dbPath = process.env.DB_PATH || "./data/vigil.db";
const db = openDb(dbPath);
log.info(`SQLite connected: ${dbPath}`);

const notifier = new Notifier();

const port = process.env.PORT || "8080";
const startAt = new Date();

const app = createServer(db, notifier, startAt);

app.listen(port, () => {
    log.info(`Vigil server listening at :${port}`);
});

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
