import { createHash } from "crypto";

/**
 * Computes a SHA-256 hash of the given text.
 */
export function computeHash(text: string): string {
    return createHash("sha256").update(text, "utf-8").digest("hex");
}