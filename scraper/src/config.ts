import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { parse as parseYaml } from "yaml";

export interface SiteConfig {
    id: string;
    url: string;
    strategy: string | undefined;
    jitter_seconds: number;
    interval_seconds: number;
    enabled: boolean;
}

export interface ScraperConfig {
    headless: boolean;
    stealth: boolean;
    screenshot_dir: string;
    db_path: string;
}

export interface CoreConfig {
    port: number;
    log_path: string;
}

export interface VigilConfig {
    core: CoreConfig;
    sites: SiteConfig[];
    scraper: ScraperConfig;
}

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

/**
 * Returns the core API base URL.
 */
export function getCoreURL(config: VigilConfig): string {
    const host = process.env.CORE_HOST || "localhost";
    return `http://${host}:${config.core.port}`;
}
