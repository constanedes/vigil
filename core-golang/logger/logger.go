package logger

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// Log levels
const (
	INFO  = "INFO"
	WARN  = "WARN"
	ERROR = "ERROR"
	EVENT = "EVENT"
)

// ANSI color codes
const (
	colorReset  = "\033[0m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorRed    = "\033[31m"
	colorCyan   = "\033[36m"
	colorGray   = "\033[90m"
)

// LogEntry represents a structured JSON log line.
type LogEntry struct {
	Timestamp string `json:"timestamp"`
	Level     string `json:"level"`
	Message   string `json:"message"`
	Extra     any    `json:"extra,omitempty"`
}

// Logger is a thread-safe, dual-output logger (stdout colored + JSON file).
type Logger struct {
	mu      sync.Mutex
	file    *os.File
	encoder *json.Encoder
}

var (
	global *Logger
	once   sync.Once
)

// Init initializes the global logger with the given log file path.
// It creates parent directories if needed.
func Init(logPath string) error {
	var initErr error
	once.Do(func() {
		if err := os.MkdirAll(filepath.Dir(logPath), 0o755); err != nil {
			initErr = fmt.Errorf("logger: create log dir: %w", err)
			return
		}
		f, err := os.OpenFile(logPath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
		if err != nil {
			initErr = fmt.Errorf("logger: open log file: %w", err)
			return
		}
		global = &Logger{
			file:    f,
			encoder: json.NewEncoder(f),
		}
	})
	return initErr
}

// Get returns the global logger instance. Panics if Init was not called.
func Get() *Logger {
	if global == nil {
		panic("logger: Init() must be called before Get()")
	}
	return global
}

// Close closes the underlying log file.
func (l *Logger) Close() error {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.file.Close()
}

// Log writes a log entry to both stdout (colored) and the JSON file.
func (l *Logger) Log(level, message string, extra ...any) {
	now := time.Now().Format(time.RFC3339)

	entry := LogEntry{
		Timestamp: now,
		Level:     level,
		Message:   message,
	}
	if len(extra) > 0 {
		entry.Extra = extra[0]
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	// Write colored output to stdout
	color := levelColor(level)
	fmt.Fprintf(os.Stdout, "%s[%s]%s %s[%-5s]%s  %s\n",
		colorGray, now, colorReset,
		color, level, colorReset,
		message,
	)

	// Write JSON to file
	_ = l.encoder.Encode(entry)
}

// Info logs at INFO level.
func (l *Logger) Info(msg string, extra ...any) { l.Log(INFO, msg, extra...) }

// Warn logs at WARN level.
func (l *Logger) Warn(msg string, extra ...any) { l.Log(WARN, msg, extra...) }

// Error logs at ERROR level.
func (l *Logger) Error(msg string, extra ...any) { l.Log(ERROR, msg, extra...) }

// Event logs at EVENT level.
func (l *Logger) Event(msg string, extra ...any) { l.Log(EVENT, msg, extra...) }

// WriteTo returns an io.Writer that logs at the given level.
func (l *Logger) WriteTo(level string) io.Writer {
	return &logWriter{logger: l, level: level}
}

type logWriter struct {
	logger *Logger
	level  string
}

func (w *logWriter) Write(p []byte) (n int, err error) {
	w.logger.Log(w.level, string(p))
	return len(p), nil
}

func levelColor(level string) string {
	switch level {
	case INFO:
		return colorGreen
	case WARN:
		return colorYellow
	case ERROR:
		return colorRed
	case EVENT:
		return colorCyan
	default:
		return colorReset
	}
}
