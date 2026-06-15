import { appendFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";

type Level = "INFO" | "WARN" | "ERROR" | "EVENT";

const COLORS: Record<Level, string> = {
    INFO: "\x1b[36m", // cyan
    WARN: "\x1b[33m", // amarillo
    ERROR: "\x1b[31m", // rojo
    EVENT: "\x1b[32m", // verde
};
const RESET = "\x1b[0m";

class Logger {
    constructor(private logPath: string) {
        const dir = dirname(logPath);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    }

    private write(level: Level, message: string, meta?: Record<string, unknown>) {
        const timestamp = new Date().toISOString();
        const color = COLORS[level];

        // Consola coloreada
        const consoleLine = meta
            ? `${color}[${timestamp}] [${level}] ${message} ${JSON.stringify(meta)}${RESET}`
            : `${color}[${timestamp}] [${level}] ${message}${RESET}`;
        console.log(consoleLine);

        // Archivo JSON estructurado
        const fileLine = JSON.stringify({ timestamp, level, message, ...meta }) + "\n";
        try {
            appendFileSync(this.logPath, fileLine);
        } catch (err) {
            console.error(`Failed to write log: ${err}`);
        }
    }

    info(message: string, meta?: Record<string, unknown>) { this.write("INFO", message, meta); }
    warn(message: string, meta?: Record<string, unknown>) { this.write("WARN", message, meta); }
    error(message: string, meta?: Record<string, unknown>) { this.write("ERROR", message, meta); }
    event(message: string, meta?: Record<string, unknown>) { this.write("EVENT", message, meta); }
}

let instance: Logger | null = null;

export const init = (logPath: string) => { instance = new Logger(logPath); };
export const get = (): Logger => instance ??= new Logger("./logs/vigil.log");