package notifier

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// sendTelegram sends a MarkdownV2-formatted message to the configured Telegram chat.
func sendTelegram(cfg TelegramConfig, event ChangeEvent) error {
	text := formatTelegramMessage(event)

	payload := map[string]string{
		"chat_id":    cfg.ChatID,
		"text":       text,
		"parse_mode": "MarkdownV2",
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("telegram: marshal payload: %w", err)
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", cfg.BotToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("telegram: send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var result map[string]any
		json.NewDecoder(resp.Body).Decode(&result)
		return fmt.Errorf("telegram: API error %d: %v", resp.StatusCode, result)
	}

	return nil
}

// formatTelegramMessage builds the MarkdownV2 notification text.
func formatTelegramMessage(event ChangeEvent) string {
	// MarkdownV2 requires escaping these characters: _ * [ ] ( ) ~ ` > # + - = | { } . !
	url := escapeMDv2(event.URL)
	siteID := escapeMDv2(event.SiteID)
	timestamp := escapeMDv2(event.DetectedAt)
	summary := escapeMDv2(event.DiffSummary)

	return fmt.Sprintf(
		"🔔 *VIGIL \\— Change Detected*\n\n"+
			"📍 *Site:* %s\n"+
			"🔗 *URL:* %s\n"+
			"🕐 *Detected:* %s\n\n"+
			"📝 *Summary:*\n%s",
		siteID, url, timestamp, summary,
	)
}

// escapeMDv2 escapes special MarkdownV2 characters.
func escapeMDv2(s string) string {
	replacer := strings.NewReplacer(
		"_", "\\_",
		"*", "\\*",
		"[", "\\[",
		"]", "\\]",
		"(", "\\(",
		")", "\\)",
		"~", "\\~",
		"`", "\\`",
		">", "\\>",
		"#", "\\#",
		"+", "\\+",
		"-", "\\-",
		"=", "\\=",
		"|", "\\|",
		"{", "\\{",
		"}", "\\}",
		".", "\\.",
		"!", "\\!",
	)
	return replacer.Replace(s)
}
