export class EnvironmentService {
    /**
     * Gets an environment variable as string.
     */
    public getString(key: string, fallback: string = ""): string {
        return process.env[key] ?? fallback;
    }

    /**
     * Gets and converts an environment variable to number.
     * Ideal for ports or intervals.
     */
    public getNumber(key: string, fallback: number = 0): number {
        const value = process.env[key];
        if (!value) return fallback;
        
        const parsed = Number(value);
        return Number.isNaN(parsed) ? fallback : parsed;
    }

    /**
     * Gets and converts an environment variable to boolean.
     * Understands "true", "1" or "yes".
     */
    public getBoolean(key: string, fallback: boolean = false): boolean {
        const value = process.env[key];
        if (!value) return fallback;
        
        const normalized = value.toLowerCase().trim();
        return normalized === "true" || normalized === "1" || normalized === "yes";
    }
}

// Export a Singleton to not instantiate it multiple times
export const envService = new EnvironmentService();