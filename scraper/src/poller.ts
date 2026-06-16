import type { SiteConfig, VigilConfig } from "./config";
import { getCoreURL } from "./config";
import { getBrowser, createStealthContext } from "./browser";
import { randomDelay } from "./helpers";
import { get as getLogger } from "../../core/logger/logger";
import { captureSnapshot } from "./snapshot";
import {
  cleanAndExtractText,
  hasChanged
} from "./diff";

interface SiteState {
  text?: string;
  imagePath?: string;
}

// In-memory store for previous snapshots (keyed by site ID)
const previousStates: Map<string, SiteState> = new Map();

const logger = getLogger();

/**
 * Polls a single site: navigate → snapshot → diff → notify if changed.
 */
async function pollSite(
  site: SiteConfig,
  config: VigilConfig
): Promise<void> {
  logger.info(`Starting watcher → ${site.id}`);

  const browser = await getBrowser(config.scraper);
  const context = await createStealthContext(browser);
  const page = await context.newPage();


  await randomDelay(800, 2000);

  // Navigate with timeout
  await page.goto(site.url, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  // Random delay after page load
  await randomDelay(1500, 4000);

  // Main scraper logic
  await page.fill("", "");
  await randomDelay(300, 800);

  await page.keyboard.press("Enter");


  await page.waitForLoadState("networkidle", { timeout: 15000 });

  await randomDelay(1500, 4000);

  // Capture snapshot
  const snapshot = await captureSnapshot(page, {
    siteId: site.id,
    screenshotDir: config.scraper.screenshot_dir
  });

  const prevState = previousStates.get(site.id) || {};
  let changed = false;

  // Clean and extract text
  const cleanedText = cleanAndExtractText(snapshot.htmlContent);
  if (!prevState.text) {
    previousStates.set(site.id, { ...prevState, text: cleanedText });
  } else if (hasChanged(prevState.text, cleanedText)) {
    changed = true;
    previousStates.set(site.id, { ...prevState, text: cleanedText });
  }

  if (changed) {
    logger.info("Change detected! Notifying...");

    // POST to core API
    const coreURL = getCoreURL(config);
    const response = await fetch(`${coreURL}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site_id: site.id,
        url: site.url,
        screenshot_path: snapshot.screenshotPath || "",
        detected_at: new Date().toISOString(),
      }),
    });

  } else {
    // No changes
    const jitter = Math.floor(
      Math.random() * (site.jitter_seconds || 120)
    );
    const nextCheck = site.interval_seconds + jitter;
    logger.info(`No changes. Next check in ${nextCheck}s`);
  }
}



/**
 * Starts the polling loop for a single site.
 * Runs indefinitely with the configured interval ± jitter.
 */
export async function startPolling(
  site: SiteConfig,
  config: VigilConfig
): Promise<void> {
  while (true) {

    await pollSite(site, config);

    // Wait interval ± jitter
    const jitter = Math.floor(
      Math.random() * (site.jitter_seconds || 120) * 2 -
      (site.jitter_seconds || 120)
    );
    const waitMs = (site.interval_seconds + jitter) * 1000;
    const waitSec = Math.round(waitMs / 1000);

    logger.info(`${site.id}: waiting ${waitSec}s until next check`);

    await new Promise((resolve) => setTimeout(resolve, Math.max(waitMs, 30000)));
  }
}

