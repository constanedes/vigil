import { get as getLogger } from "../logger/logger";
import { loadTelegramConfig, sendTelegram, TelegramConfig } from "./telegram";
import { loadEmailConfig, sendEmail, EmailConfig } from "./email";

export interface ChangeEvent {
    site_id: string;
    url: string;
    screenshot_path?: string;
    diff_summary: string;
    detected_at: string;
}

export class Notifier {
    private tgCfg: TelegramConfig;
    private emailCfg: EmailConfig;

    constructor() {
        this.tgCfg = loadTelegramConfig();
        this.emailCfg = loadEmailConfig();
    }

    async notifyAll(event: ChangeEvent) {
        const log = getLogger();
        const tasks: Promise<void>[] = [];

        // Telegram
        if (this.tgCfg.botToken && this.tgCfg.chatId) {
            tasks.push(
                sendTelegram(this.tgCfg, event)
                    .then(() => log.info("Telegram OK"))
                    .catch(err => log.error(`Telegram fail: ${err}`))
            );
        } else {
            log.warn("Telegram not configured, skipping...");
        }

        // Email
        if (this.emailCfg.host && this.emailCfg.from && this.emailCfg.to) {
            tasks.push(
                sendEmail(this.emailCfg, event)
                    .then(() => log.info("Email OK"))
                    .catch(err => log.error(`Email fail: ${err}`))
            );
        } else {
            log.warn("Email SMTP not configured, skipping...");
        }

        await Promise.allSettled(tasks);
    }
}
