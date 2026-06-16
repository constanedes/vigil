import type { Page } from "playwright";
import { mkdirSync, existsSync } from "fs";
import { resolve } from "path";

export interface PageSnapshot {
  htmlContent: string;
  textContent: string;
  screenshotPath: string | null;
}

export interface SnapshotOptions {
  siteId: string;
  screenshotDir: string;
  targetSelector?: string;
  visualDiff?: boolean;
}

/**
 * Captures a snapshot of the current page or a specific element:
 */
export async function captureSnapshot(
  page: Page,
  options: SnapshotOptions
): Promise<PageSnapshot> {
  const target = options.targetSelector ? page.locator(options.targetSelector) : page;

  // Get HTML and Text
  let htmlContent = "";
  let textContent = "";
  
  if (options.targetSelector) {
      try {
          const loc = page.locator(options.targetSelector);
          htmlContent = await loc.innerHTML();
          textContent = await loc.innerText();
      } catch (e) {
          console.error(`[WARN] Target selector ${options.targetSelector} not found or failed`);
      }
  } else {
      htmlContent = await page.content();
      textContent = await page.evaluate(() => document.body?.innerText?.trim() || "");
  }

  // Take screenshot
  let screenshotPath: string | null = null;
  try {
    const dir = resolve(options.screenshotDir);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${options.siteId}_${timestamp}.png`;
    screenshotPath = resolve(dir, filename);

    if (options.targetSelector) {
        await page.locator(options.targetSelector).screenshot({ path: screenshotPath });
    } else {
        await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  } catch (err) {
    console.error(`[ERROR] Screenshot failed: ${err}`);
  }

  return { htmlContent, textContent, screenshotPath };
}
