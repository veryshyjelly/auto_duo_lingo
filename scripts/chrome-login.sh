#!/usr/bin/env bash
# Open real Google Chrome with the same profile directory Rod uses.
# Log into Duolingo here (Google sign-in works), then quit Chrome and run: make run

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROFILE_DIR="${USER_DATA_DIR:-$ROOT/../bd}"
PROFILE_DIR="$(cd "$(dirname "$PROFILE_DIR")" && pwd)/$(basename "$PROFILE_DIR")"
mkdir -p "$PROFILE_DIR"

if [[ "$OSTYPE" == darwin* ]]; then
  CHROME="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
elif command -v google-chrome >/dev/null; then
  CHROME="${CHROME_BIN:-google-chrome}"
elif command -v chromium-browser >/dev/null; then
  CHROME="${CHROME_BIN:-chromium-browser}"
else
  echo "Could not find Chrome. Set CHROME_BIN to your browser path."
  exit 1
fi

echo "Profile directory: $PROFILE_DIR"
echo "1. Sign in to Duolingo in the Chrome window that opens."
echo "2. Quit Chrome completely (Cmd+Q on Mac)."
echo "3. Run: make run"
echo ""

exec "$CHROME" --user-data-dir="$PROFILE_DIR" "https://www.duolingo.com/"
