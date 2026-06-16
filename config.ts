import { VigilConfig } from "@vigil/models";

export const DEFAULT_CONFIG: VigilConfig = {
    core: {
        port: 8080,
        log_path: "./logs/vigil.log",
    },
    sites: [],
    scraper: {
        headless: true,
        stealth: true,
        screenshot_dir: "./data/screenshots",
        db_path: "./data/vigil.db",
    },
};
