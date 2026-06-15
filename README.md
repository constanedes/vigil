# Vigil 👁️
> *Set it. Forget it. Get notified.*

Vigil is a self-hosted web monitoring system designed to watch websites for changes and trigger notifications. It periodically checks configured websites and alerts you when significant changes happen.

## Project Structure

The project is divided into three main modules:

### 1. Core (`/core`)
- **Technology**: Bun, TypeScript, SQLite, Elysia
- **Description**: The central backend API.
    - Manages the SQLite database (storing site configurations, snapshots, and event logs)
    - Exposes REST endpoints.
    - Acts as the central hub for receiving change events from the scraper and triggering notifications (e.g., via webhooks, Discord, Telegram, or Email).

### 2. Scraper (`/scraper`) — **WIP (Work in Progress)**
- **Technology**: Bun, TypeScript, Playwright, Cheerio
- **Description**: The headless worker that does the actual monitoring.
    - It continuously polls the configured websites.
    - Opens them in a stealthy headless browser.
    - Extracts data (or takes screenshots).
    - Computes diffs against previous versions.
    - Sends a notification event to the `core` API when a change is detected.

### 3. Dashboard (`/dashboard`) — **WIP (Work in Progress)**
- **Technology**: Svelte 5, TypeScript, Vite
- **Description**: The frontend user interface.
    - It provides a web dashboard to manage the sites you want to monitor.
    - View recent change events.
    - See visual diffs or screenshots of what changed.

## How to Start (Testing)

The easiest way to start the entire stack (Core API + Scraper + Dashboard) for testing is using Docker Compose.

Make sure you have Docker installed and run:

```bash
docker compose up --build
```

This will spin up:
- **Core API** on port `8080` (accessible at `http://localhost:8080`)
- **Dashboard** on port `3000` (accessible at `http://localhost:3000`)
- **Scraper** running in the background watching the configured sites.

*Data (like SQLite db and screenshots) will be saved in the `./data` directory on your host machine to persist between restarts.*
