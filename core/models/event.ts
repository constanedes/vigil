export default interface Event {
    id?: number;
    site_id: string;
    detected_at: string;
    screenshot_path?: string | null;
    created_at?: string;
}