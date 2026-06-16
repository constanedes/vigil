export interface Site {
    id: string;
    url: string;
    strategy: string;
    interval_seconds: number;
    enabled: number;
    created_at?: string;
    updated_at?: string | null;
}
