import * as nodemailer from "nodemailer";

export interface EmailConfig {
    host: string;
    port: string;
    from: string;
    password?: string;
    to: string;
}

export function loadEmailConfig(): EmailConfig {
    return {
        host: process.env.SMTP_HOST || "",
        port: process.env.SMTP_PORT || "",
        from: process.env.SMTP_FROM || "",
        password: process.env.SMTP_PASSWORD || "",
        to: process.env.NOTIFY_EMAIL_TO || ""
    };
}

export async function sendEmail(config: EmailConfig, event: any): Promise<void> {
    if (!config.host || !config.from || !config.to) {
        throw new Error("Email config is missing");
    }

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: parseInt(config.port, 10) || 587,
        secure: parseInt(config.port, 10) === 465,
        auth: config.password ? {
            user: config.from,
            pass: config.password
        } : undefined
    });

    const text = `🚨 Vigil Alert\n\nSite: ${event.url}\nDiff: ${event.diff_summary}\nDetected: ${event.detected_at}`;
    const html = `<p>🚨 <b>Vigil Alert</b></p><p><b>Site:</b> ${event.url}</p><p><b>Diff:</b> ${event.diff_summary}</p><p><b>Detected:</b> ${event.detected_at}</p>`;

    await transporter.sendMail({
        from: config.from,
        to: config.to,
        subject: `Vigil Alert: ${event.url}`,
        text,
        html
    });
}
