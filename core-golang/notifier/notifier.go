package notifier

import (
	"fmt"
	"os"
	"sync"
	"vigil-core/logger"
)

// ChangeEvent is the payload sent from the scraper when a change is detected.
type ChangeEvent struct {
	SiteID         string `json:"site_id"`
	URL            string `json:"url"`
	ScreenshotPath string `json:"screenshot_path"`
	DiffSummary    string `json:"diff_summary"`
	DetectedAt     string `json:"detected_at"`
}

// TelegramConfig holds settings for Telegram notification channel.
type TelegramConfig struct {
	BotToken string
	ChatID   string
}

// EmailConfig holds settings for SMTP email notification channel.
type EmailConfig struct {
	SMTPHost      string
	SMTPPort      string
	SMTPFrom      string
	SMTPPassword  string
	NotifyEmailTo string
}

// LoadTelegramConfig reads Telegram settings from environment variables.
func LoadTelegramConfig() TelegramConfig {
	return TelegramConfig{
		BotToken: os.Getenv("TELEGRAM_BOT_TOKEN"),
		ChatID:   os.Getenv("TELEGRAM_CHAT_ID"),
	}
}

// LoadEmailConfig reads SMTP email settings from environment variables.
func LoadEmailConfig() EmailConfig {
	return EmailConfig{
		SMTPHost:      os.Getenv("SMTP_HOST"),
		SMTPPort:      os.Getenv("SMTP_PORT"),
		SMTPFrom:      os.Getenv("SMTP_FROM"),
		SMTPPassword:  os.Getenv("SMTP_PASSWORD"),
		NotifyEmailTo: os.Getenv("NOTIFY_EMAIL_TO"),
	}
}

// NotifyAll fires Telegram + Email notifications in parallel goroutines.
// If one channel fails, the other still sends.
func NotifyAll(tgCfg TelegramConfig, emailCfg EmailConfig, event ChangeEvent) {
	log := logger.Get()
	var wg sync.WaitGroup

	// Telegram
	if tgCfg.BotToken != "" && tgCfg.ChatID != "" {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if err := sendTelegram(tgCfg, event); err != nil {
				log.Error(fmt.Sprintf("Telegram fail: %v", err))
			} else {
				log.Info("Telegram OK")
			}
		}()
	} else {
		log.Warn("Telegram not configured, skipping...")
	}

	// Email
	if emailCfg.SMTPHost != "" && emailCfg.SMTPFrom != "" && emailCfg.NotifyEmailTo != "" {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if err := sendEmail(emailCfg, event); err != nil {
				log.Error(fmt.Sprintf("Email fail: %v", err))
			} else {
				log.Info("Email OK")
			}
		}()
	} else {
		log.Warn("Email SMTP not configured, skipping...")
	}

	wg.Wait()
}
