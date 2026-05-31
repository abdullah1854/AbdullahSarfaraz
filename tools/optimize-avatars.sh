#!/usr/bin/env bash
# =============================================================================
# optimize-avatars.sh — produce web-optimized WebP avatars from the source PNGs.
#
# The Higgsfield character renders ship at 1792x2400 / ~5 MB each (~22 MB total
# for the four poses the scene loads). They are displayed at most ~800px tall,
# so we cap height and re-encode to WebP — typically a 60-70x size reduction —
# while keeping the pure-black background clean so scene.js's luma-key still
# drops it. Originals are preserved once in assets/character/_src/.
#
# Re-run this any time the renders are regenerated.  Requires: cwebp (libwebp).
#   brew install webp
# Usage:  bash tools/optimize-avatars.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/assets/character"
MAXH=1600          # cap height; ample for retina at the displayed size
Q=90               # high quality preserves the #000 background luma-key
IMGS=(look-left look-front look-right sit)

command -v cwebp >/dev/null 2>&1 || { echo "error: cwebp not found (brew install webp)"; exit 1; }
mkdir -p "$SRC/_src"

tb=0; ta=0
for n in "${IMGS[@]}"; do
  png="$SRC/$n.png"; webp="$SRC/$n.webp"
  [ -f "$png" ] || { echo "skip $n (no source png)"; continue; }
  [ -f "$SRC/_src/$n.png" ] || cp "$png" "$SRC/_src/$n.png"   # preserve original once
  cwebp -quiet -q "$Q" -sharp_yuv -m 6 -resize 0 "$MAXH" "$png" -o "$webp"
  b=$(stat -f%z "$png"); a=$(stat -f%z "$webp")
  tb=$((tb+b)); ta=$((ta+a))
  printf "  %-12s %7d KB -> %5d KB\n" "$n" $((b/1024)) $((a/1024))
done
printf "  %-12s %7d KB -> %5d KB  (%sx smaller)\n" TOTAL $((tb/1024)) $((ta/1024)) "$(echo "scale=1;$tb/$ta"|bc)"
echo "Done. scene.js should load the .webp variants."
