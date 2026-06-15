export interface TelegramConfig {
    botToken: string;
    chatId: string;
}

export function loadTelegramConfig(): TelegramConfig {
    return {
        botToken: process.env.TELEGRAM_BOT_TOKEN || "",
        chatId: process.env.TELEGRAM_CHAT_ID || ""
    };
}

export async function sendTelegram(config: TelegramConfig, event: any): Promise<void> {
    if (!config.botToken || !config.chatId) {
        throw new Error("Telegram config is missing");
    }

    const message = `🚨 *Vigil Alert*\n\nSite: ${event.url}\nDiff: ${event.diff_summary}\nDetected: ${event.detected_at}`;
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            chat_id: config.chatId,
            text: message,
            parse_mode: "Markdown"
        })
    });

    if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
    }
}
