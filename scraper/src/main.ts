import { DEFAULT_CONFIG } from "./config";
import { startPolling } from "./poller";
import { closeBrowser } from "./browser";
import { get as getLogger } from "../../core/logger/logger";

const logger = getLogger();

async function main(): Promise<void> {
  logger.info(`
  ╔══════════════════════════════════════════╗
  ║          VIGIL SCRAPER v1.0.0            ║
  ║      Web Monitoring & Change Detection   ║
  ╚══════════════════════════════════════════╝
  `);

  // Load configuration
  const config = DEFAULT_CONFIG;

  logger.info(`Configuration loaded: ${config.sites.length} site(s)`);
  logger.info(`Core API: http://localhost:${config.core.port}`);
  logger.info(`Headless: ${config.scraper.headless}`);
  logger.info(`Screenshots: ${config.scraper.screenshot_dir}`);

  // Keep track of running sites
  const runningSites = new Set<string>();

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down scraper...");
    await closeBrowser();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  const syncSites = async () => {
    try {
      const coreURL = `http://localhost:${config.core.port}`;
      const res = await fetch(`${coreURL}/status`);
      if (!res.ok) return;
      const data = await res.json();

      let newCount = 0;
      for (const site of data) {
        if (site.enabled && !runningSites.has(site.id)) {
          runningSites.add(site.id);
          newCount++;
          logger.info(`→ Starting watcher: ${site.id} (${site.interval_seconds}s)`);

          // Fire and forget polling loop
          startPolling({
            id: site.id,
            url: site.url,
            strategy: site.strategy,
            interval_seconds: site.interval_seconds,
            jitter_seconds: site.jitter_seconds || 120,
            enabled: site.enabled
          }, config).catch(
            err => logger.error(`Watcher ${site.id} failed: ${err}`)
          );
        }
      }
      if (newCount > 0) {
        logger.info(`Synced ${newCount} new sites from Core`);
      }
    } catch (err) {
      // Core offline, will retry next interval
    }
  };

  logger.info("Syncing initial sites...");
  await syncSites();

  // Sync with Core every 30 seconds to pick up new sites
  setInterval(syncSites, 30000);

  // Keep process alive indefinitely
  await new Promise(() => { });
}

main().catch((err) => {
  console.error(`[FATAL] ${err}`);
  process.exit(1);
});
