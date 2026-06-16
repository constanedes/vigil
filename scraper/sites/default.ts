/**
 * Site-specific configurations.
 * Each export defines custom selectors, form fields, and behaviors
 * for a specific monitored site.
 */

export interface SiteSpecificConfig {
  /** CSS selectors to wait for before considering the page loaded */
  waitForSelectors?: string[];
  /** CSS selectors for elements to click (e.g., accept cookies) */
  preClickSelectors?: string[];
  /** Form fields to fill before capturing the snapshot */
  formFields?: { selector: string; value: string }[];
  /** Custom content selector (instead of body) */
  contentSelector?: string;
  /** Additional elements to remove before diff */
  noiseSelectors?: string[];
}

/**
 * Default configuration for the turnos-rosario site.
 * This monitors the Austrian embassy appointment page.
 */
export const turnosRosario: SiteSpecificConfig = {
  waitForSelectors: ["body"],
  preClickSelectors: [],
  formFields: [],
  contentSelector: "body",
  noiseSelectors: [
    'input[name="__VIEWSTATE"]',
    'input[name="__EVENTVALIDATION"]',
    'input[name="__VIEWSTATEGENERATOR"]',
    ".cookie-banner",
    ".loading-spinner",
  ],
};

/**
 * Registry of site-specific configs, keyed by site ID.
 */
export const siteConfigs: Record<string, SiteSpecificConfig> = {
  "turnos-rosario": turnosRosario,
};

/**
 * Returns the site-specific config for a given site ID, or a default config.
 */
export function getSiteConfig(siteId: string): SiteSpecificConfig {
  return siteConfigs[siteId] || { contentSelector: "body" };
}
