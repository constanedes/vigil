package notifier

import (
	"fmt"
	"net/smtp"
)

// sendEmail sends a plain-text email notification via SMTP with PlainAuth.
func sendEmail(cfg EmailConfig, event ChangeEvent) error {
	subject := fmt.Sprintf("Vigil — Change detected on %s", event.SiteID)
	body := fmt.Sprintf(
		"Change detected by Vigil\n\n"+
			"Site: %s\n"+
			"URL: %s\n"+
			"Detected: %s\n\n"+
			"Change summary:\n%s\n",
		event.SiteID,
		event.URL,
		event.DetectedAt,
		event.DiffSummary,
	)

	msg := fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n"+
			"Content-Type: text/plain; charset=UTF-8\r\n"+
			"\r\n"+
			"%s",
		cfg.SMTPFrom,
		cfg.NotifyEmailTo,
		subject,
		body,
	)

	addr := fmt.Sprintf("%s:%s", cfg.SMTPHost, cfg.SMTPPort)
	auth := smtp.PlainAuth("", cfg.SMTPFrom, cfg.SMTPPassword, cfg.SMTPHost)

	err := smtp.SendMail(addr, auth, cfg.SMTPFrom, []string{cfg.NotifyEmailTo}, []byte(msg))
	if err != nil {
		return fmt.Errorf("email: send: %w", err)
	}
	return nil
}
