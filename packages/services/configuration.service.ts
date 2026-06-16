import { type VigilConfig } from "@vigil/models";
import { DEFAULT_CONFIG } from "../../config";
import { envService } from "./env.service";

export class ConfigurationService {
    private config: VigilConfig;

    constructor() {
        // Instantiate config by merging DEFAULT with environment variables
        this.config = this.buildConfig();
    }

    private buildConfig(): VigilConfig {
        return {
            ...DEFAULT_CONFIG,
            core: {
                ...DEFAULT_CONFIG.core,
                port: envService.getNumber("CORE_PORT", DEFAULT_CONFIG.core.port),
                log_path: envService.getString("CORE_LOG_PATH", DEFAULT_CONFIG.core.log_path),
            },
            scraper: {
                ...DEFAULT_CONFIG.scraper,
                headless: envService.getBoolean("SCRAPER_HEADLESS", DEFAULT_CONFIG.scraper.headless),
                stealth: envService.getBoolean("SCRAPER_STEALTH", DEFAULT_CONFIG.scraper.stealth),
                screenshot_dir: envService.getString("SCRAPER_SCREENSHOT_DIR", DEFAULT_CONFIG.scraper.screenshot_dir),
                db_path: envService.getString("SCRAPER_DB_PATH", DEFAULT_CONFIG.scraper.db_path),
            },
            // Sites usually don't come from an .env, usually
            // you'll load them later from a database or an external JSON.
            sites: DEFAULT_CONFIG.sites, 
        };
    }

    /**
     * Returns the complete and unified configuration.
     */
    public getConfig(): VigilConfig {
        return this.config;
    }

    /**
     * Helper specific to build the core URL.
     */
    public getCoreURL(): string {
        const host = envService.getString("CORE_HOST", "localhost");
        return `http://${host}:${this.config.core.port}`;
    }
}

export const configService = new ConfigurationService();