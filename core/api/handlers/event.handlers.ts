import { EventStore } from "../../store/events";
import { Notifier, Event } from "../../notifier/notifier";

export class EventHandlers {
    constructor(
        private eventStore: EventStore,
        private notifier: Notifier
    ) { }

    createEvent = async ({ body }: { body: any }) => {
        try {
            const event = body as Event;

            this.eventStore.insert(event);
            await this.notifier.notifyAll(event);

            return { status: "ok" };
        } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
    };

    testNotification = async () => {
        try {
            const testEvent: Event = {
                site_id: "test-site",
                url: "https://example.com",
                diff_summary: "This is a test notification from Vigil Core (Bun).",
                detected_at: new Date().toISOString()
            };

            await this.notifier.notifyAll(testEvent);

            return { status: "sent test" };
        } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
    };
}