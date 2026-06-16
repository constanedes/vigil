import { get as getLogger } from "@core/logger";
import { createStealthContext, getBrowser } from "./browser";
import type { SiteConfig, VigilConfig } from "./config";
import { getCoreURL } from "./config";
import { cleanAndExtractText, hasChanged } from "./diff";
import { randomDelay } from "./helpers";
import { captureSnapshot } from "./snapshot";

interface SiteState {
    text?: string;
    imagePath?: string;
}

// In-memory store for previous snapshots (keyed by site ID)
const previousStates: Map<string, SiteState> = new Map();
const logger = getLogger();

/**
 * Polls a single site safely handling browser contexts and errors.
 * Sequence: navigate → snapshot → diff → notify if changed.
 */
async function pollSite(site: SiteConfig, config: VigilConfig): Promise<void> {
    logger.info(`Starting watcher → ${site.id}`);

    const browser = await getBrowser(config.scraper);
    // Instantiate the context and page outside the try block to ensure proper scope in 'finally'
    const context = await createStealthContext(browser);
    const page = await context.newPage();

    try {
        await randomDelay(800, 2000);

        // Navigate with a safe timeout
        await page.goto(site.url, {
            waitUntil: "networkidle",
            timeout: 60000,
        });

        await randomDelay(1500, 4000);

        // [!] NOTE: Make sure to replace these placeholder empty strings with real selectors when needed
        // await page.fill("#real-selector", "value");
        // await page.keyboard.press("Enter");
        // await page.waitForLoadState("networkidle", { timeout: 15000 });

        // Capture snapshot
        const snapshot = await captureSnapshot(page, {
            siteId: site.id,
            screenshotDir: config.scraper.screenshot_dir,
        });

        const prevState = previousStates.get(site.id) || {};
        let changed = false;

        // Clean and extract readable text from the HTML structure
        const cleanedText = cleanAndExtractText(snapshot.htmlContent);

        if (!prevState.text) {
            // First execution: establish the baseline data
            previousStates.set(site.id, { ...prevState, text: cleanedText });
            logger.info(`Baseline established for ${site.id}`);
        } else if (hasChanged(prevState.text, cleanedText)) {
            changed = true;
            previousStates.set(site.id, { ...prevState, text: cleanedText });
        }

        if (changed) {
            logger.info(`[${site.id}] Change detected! Notifying core...`);

            const coreURL = getCoreURL(config);
            await fetch(`${coreURL}/event`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    site_id: site.id,
                    url: site.url,
                    screenshot_path: snapshot.screenshotPath || "",
                    detected_at: new Date().toISOString(),
                }),
            });
        }
    } catch (error: any) {
        // Catch execution errors for THIS specific iteration without crashing the entire service loop
        logger.error(`Error polling site ${site.id}: ${error.message}`);
    } finally {
        // CRITICAL FIX: Always close pages and contexts to prevent Chromium memory leaks (zombie processes)
        await page.close();
        await context.close();
    }
}

/**
 * Starts the polling loop for a single site.
 * Runs indefinitely and survives network/scraping crashes.
 */
export async function startPolling(site: SiteConfig, config: VigilConfig): Promise<void> {
    const maxJitter = site.jitter_seconds || 120;

    while (true) {
        try {
            // Execute the scraper cycle
            await pollSite(site, config);
        } catch (loopError: any) {
            // Fail-safe fallback in case a catastrophic exception escapes pollSite's internal handler
            logger.error(`Critical error in loop for ${site.id}: ${loopError.message}`);
        }

        // Balanced Jitter calculation (Base Interval + randomized offset)
        const jitter = Math.floor(Math.random() * maxJitter);
        const waitMs = (site.interval_seconds + jitter) * 1000;
        const waitSec = Math.round(waitMs / 1000);

        logger.info(`${site.id}: waiting ${waitSec}s until next check (Jitter added: ${jitter}s)`);

        // Minimum hardcoded safety delay of 30 seconds to prevent accidental aggressive rate limits
        await new Promise((resolve) => setTimeout(resolve, Math.max(waitMs, 30000)));
    }
}
