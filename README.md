# auto_duo_lingo

Complete Duolingo lessons from a second device. A Go backend drives headless Chrome on `duolingo.com/lesson`, scrapes the current challenge, and pushes it over WebSocket to a React UI where you tap or type answers.

## Prerequisites

- Go 1.22+
- Node.js 18+
- Google Chrome (used by Rod)

## First-time setup

1. Install frontend dependencies:

```bash
cd frontend/auto-duo-lingo && npm install
```

2. Log into Duolingo (one-time, saves session to browser profile):

**Recommended — use real Chrome with the same profile directory:**

```bash
make chrome-login
```

This opens normal Google Chrome using the profile at `../bd/` (same folder Rod uses). Sign in to Duolingo — Google login works because it's real Chrome. Quit Chrome completely, then:

```bash
make run
```

**Alternative — automated browser window:**

```bash
make login
```

A Chrome window opens. Sign in to Duolingo, then stop the server (Ctrl+C). Your session is stored in `../bd/`.

**If Google says "This browser may not be secure":** use `make chrome-login` instead, or sign in with email/password on Duolingo.

3. Build the UI (or use dev mode):

```bash
make build-ui
```

## Run

Headless (normal use):

```bash
make run
```

Visible browser (debugging):

```bash
make run-head
```

On startup the server prints a LAN URL like `http://192.168.x.x:8080`. Open that on your phone.

## Frontend development

Run the Go backend on port 8080, then:

```bash
make dev
```

Vite proxies `/connect` and `/status` to the backend.

## Challenge types

| Type | Duolingo heading examples | UI action |
|------|---------------------------|-----------|
| ChooseOption | "Select the correct", "What sound does this make", "Select the missing word", "Complete the chat" | Tap an option |
| Matching | "Tap the matching pairs" | Tap question + answer |
| ToEnglish | "Write this in English" | Build sentence from word bank |
| ToJapanese | "Write this in Japanese" (configurable) | Type translation |

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP/WebSocket port |
| `USER_DATA_DIR` | `../bd/` | Chrome profile directory |
| `DUOLINGO_LESSON_URL` | `https://www.duolingo.com/lesson` | Lesson URL |
| `TARGET_LANG` | `ja` | Target language code (`ja`, `es`, `fr`, `de`, `it`, `pt`, `ko`, `zh`) |
| `AUTH_TOKEN` | _(empty)_ | If set, WebSocket requires `?token=...` |
| `CHROME_BIN` | _(auto)_ | Path to Google Chrome (auto-detected on macOS/Linux) |
| `ROD_URL` | _(empty)_ | Attach to an existing Chrome remote-debugging URL instead of launching |

## Audio

Challenges with a speaker icon or listen prompt include audio support on your phone:

- The backend extracts TTS URLs from Duolingo's challenge state (or primes playback once to capture the CDN URL).
- Audio is proxied at `GET /audio?url=...` so your phone can play it without CORS issues.
- Tap the speaker icon in the UI to replay. If no URL is available yet, it triggers playback in the lesson browser.

Example with Spanish:

```bash
TARGET_LANG=es make run
```

## Architecture

```
Phone/browser UI  --WebSocket-->  Go Fiber server  --Rod-->  Chrome/Duolingo
```

- `app/HandleAction` — clicks/types into Duolingo DOM
- `app/GetInfo` — scrapes challenge state
- `app/Server` — polls and pushes updates to connected clients
- `routes/connect` — WebSocket handler

## Tests

```bash
make test
```
