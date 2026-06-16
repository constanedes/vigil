import * as cheerio from "cheerio";

/**
 * Fields to remove from HTML before comparison
 */
const NOISE_FIELDS = [""];

/**
 * Cleans HTML by removing dynamic/noisy elements before comparison.
 * Returns the normalized visible text from the body.
 */
export function cleanAndExtractText(html: string): string {
    const $ = cheerio.load(html);

    // Remove hidden inputs with noise fields
    for (const field of NOISE_FIELDS) {
        $(`input[name="${field}"]`).remove();
        $(`input[name^="${field}"]`).remove();
    }

    // Remove meta tags
    $("meta").remove();

    // Remove script and style tags
    $("script").remove();
    $("style").remove();
    $("noscript").remove();

    // Get the body text
    const text = $("body").text() || "";

    // Normalize whitespace: collapse multiple spaces/newlines into single space
    return text.replace(/\s+/g, " ").trim();
}

/**
 * Compares two text snapshots and returns whether they differ.
 */
export function hasChanged(previousText: string, currentText: string): boolean {
    const prevClean = previousText.replace(/\s+/g, " ").trim();
    const currClean = currentText.replace(/\s+/g, " ").trim();
    return prevClean !== currClean;
}
