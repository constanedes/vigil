import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { ScraperConfig } from "./config";

let browser: Browser | null = null;

/**
 * Launches and returns a shared Playwright Chromium browser instance
 * with stealth-like settings applied.
 */
export async function getBrowser(config: ScraperConfig): Promise<Browser> {
  if (browser && browser.isConnected()) {
    return browser;
  }

  browser = await chromium.launch({
    headless: config.headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1366,768",
    ],
  });

  return browser;
}

/**
 * Creates a stealth browser context with realistic fingerprinting.
 */
export async function createStealthContext(
  b: Browser
): Promise<BrowserContext> {
  const context = await b.newContext({
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

    // Override plugins length
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
 * Closes the shared browser instance.
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
