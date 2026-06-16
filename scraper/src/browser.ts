import { type Browser, type BrowserContext, chromium } from "playwright";
import type { ScraperConfig } from "@vigil/models";

export class BrowserService {
    // Encapsulate browser state
    private browser: Browser | null = null;

    /**
     * Launches and returns a shared Chromium browser instance
     * with stealth configurations applied.
     */
    public async getBrowser(config: ScraperConfig): Promise<Browser> {
        // Use 'this.browser' to access the class property
        if (this.browser && this.browser.isConnected()) {
            return this.browser;
        }

        this.browser = await chromium.launch({
            headless: config.headless,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-infobars",
                "--window-size=1366,768",
            ],
        });

        return this.browser;
    }

    /**
     * Creates a stealth browser context with realistic fingerprinting.
     */
    public async createStealthContext(browserInstance: Browser): Promise<BrowserContext> {
        const context = await browserInstance.newContext({
            viewport: { width: 1366, height: 768 },
            userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            locale: "es-AR",
            extraHTTPHeaders: {
                "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
            },
            javaScriptEnabled: true,
            ignoreHTTPSErrors: true,
        });

        // Override navigator.webdriver to avoid detection
        await context.addInitScript(() => {
            Object.defineProperty(navigator, "webdriver", {
                get: () => false,
            });

            // Override chrome runtime
            (window as any).chrome = {
                runtime: {},
            };

            // Override permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters: any) =>
                parameters.name === "notifications"
                    ? Promise.resolve({
                          state: Notification.permission,
                      } as PermissionStatus)
                    : originalQuery(parameters);

            // Sobrescribir longitud de plugins
            Object.defineProperty(navigator, "plugins", {
                get: () => [1, 2, 3, 4, 5],
            });

            Object.defineProperty(navigator, "languages", {
                get: () => ["es-AR", "es", "en"],
            });
        });

        return context;
    }

    /**
     * Close the shared browser instance.
     */
    public async closeBrowser(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

// Export a single instance (Singleton) for the whole app to share the same browser
export const browserService = new BrowserService();