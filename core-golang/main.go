package main

import (
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"vigil-core/api"
	"vigil-core/logger"
	"vigil-core/notifier"
	"vigil-core/store"
)

func main() {
	// --- Logger ---
	logPath := envOrDefault("LOG_PATH", "./logs/vigil.log")
	if err := logger.Init(logPath); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	log := logger.Get()
	defer log.Close()

	log.Info("=== Vigil Core iniciando ===")

	// --- Database ---
	dbPath := envOrDefault("DB_PATH", "./data/vigil.db")
	db, err := store.Open(dbPath)
	if err != nil {
		log.Error(fmt.Sprintf("Error opening database: %v", err))
		os.Exit(1)
	}
	defer db.Close()
	log.Info(fmt.Sprintf("SQLite connected: %s", dbPath))

	// --- Notifier config ---
	tgCfg := notifier.LoadTelegramConfig()
	emailCfg := notifier.LoadEmailConfig()

	// --- HTTP Server ---
	port := envOrDefault("PORT", "8080")
	server := api.NewServer(db, tgCfg, emailCfg)

	httpServer := &http.Server{
		Addr:    ":" + port,
		Handler: server,
	}

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		sig := <-sigCh
		log.Info(fmt.Sprintf("Signal received: %v. Closing...", sig))
		httpServer.Close()
	}()

	log.Info(fmt.Sprintf("Vigil server listening at :%s", port))
	log.Info("Endpoints: POST /event | GET /health | GET /status | GET /logs")

	if err := httpServer.ListenAndServe(); err != http.ErrServerClosed {
		log.Error(fmt.Sprintf("Server error: %v", err))
		os.Exit(1)
	}

	log.Info("Vigil server stopped.")
}

func envOrDefault(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}
