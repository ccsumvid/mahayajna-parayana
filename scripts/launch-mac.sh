#!/usr/bin/env bash
# Launch the freshly-built macOS app locally for testing.
#
# The DMG-built app is already deep ad-hoc signed (build/afterPack.js). This just
# clears the Gatekeeper quarantine attribute (harmless if absent; needed for copies
# opened from a mounted DMG or downloaded) and opens the app.
#
# Usage: scripts/launch-mac.sh [mac-arm64|mac]   (default: mac-arm64)
set -euo pipefail

ARCH_DIR="${1:-mac-arm64}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$(find "$ROOT/dist/$ARCH_DIR" -maxdepth 1 -name '*.app' -type d 2>/dev/null | head -1)"

if [ -z "$APP" ]; then
  echo "No .app found in dist/$ARCH_DIR — build first (npm run build or scripts/release.sh)."
  exit 1
fi

echo "==> Clearing quarantine + launching: $APP"
xattr -dr com.apple.quarantine "$APP" 2>/dev/null || true
open "$APP"
