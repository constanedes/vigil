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