#!/bin/bash
# Regenerate the self-hosted Google fonts in public/fonts.
#
# Downloads the OFL sources from a pinned google/fonts commit, keeps only the
# weights the site uses and subsets them to Latin + Latin Extended (the same
# unicode ranges Google Fonts serves for those subsets). Requires `uv`.
#
# Usage: pnpm --filter web generate:fonts

set -euo pipefail

GOOGLE_FONTS_REF="7af0d90b4d532ffa4b041937b560c6df4e7b1e95"
BASE="https://raw.githubusercontent.com/google/fonts/${GOOGLE_FONTS_REF}/ofl"
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/fonts"

# Google Fonts "latin" and "latin-ext" unicode ranges.
UNICODES="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF"

FONTTOOLS=(uvx --quiet --from "fonttools[woff]==4.60.1" fonttools)

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

fetch() {
  curl -fsSL -o "$WORK_DIR/$2" "$BASE/$1"
}

# instance <src> <dst> <axis limits...>
instance() {
  local src="$1" dst="$2"
  shift 2
  "${FONTTOOLS[@]}" varLib.instancer "$WORK_DIR/$src" "$@" -o "$WORK_DIR/$dst" -q
}

# subset <src> <family dir> <file name>
subset() {
  mkdir -p "$OUT_DIR/$2"
  "${FONTTOOLS[@]}" subset "$WORK_DIR/$1" \
    --unicodes="$UNICODES" \
    --layout-features='*' \
    --no-hinting \
    --flavor=woff2 \
    --output-file="$OUT_DIR/$2/$3"
  echo "wrote public/fonts/$2/$3 ($(wc -c <"$OUT_DIR/$2/$3" | tr -d ' ') bytes)"
}

fetch 'publicsans/PublicSans%5Bwght%5D.ttf' PublicSans.ttf
fetch 'opensans/OpenSans%5Bwdth,wght%5D.ttf' OpenSans.ttf
fetch 'firacode/FiraCode%5Bwght%5D.ttf' FiraCode.ttf
fetch 'firamono/FiraMono-Regular.ttf' FiraMono-Regular.ttf
fetch 'firamono/FiraMono-Bold.ttf' FiraMono-Bold.ttf

# Keep only the weight ranges app/fonts.ts and the developer programmes page use.
instance PublicSans.ttf PublicSans-400-700.ttf wght=400:700
instance OpenSans.ttf OpenSans-400.ttf wdth=100 wght=400
instance FiraCode.ttf FiraCode-400-600.ttf wght=400:600

subset PublicSans-400-700.ttf public-sans public-sans-latin-wght.woff2
subset OpenSans-400.ttf open-sans open-sans-latin-400.woff2
subset FiraCode-400-600.ttf fira-code fira-code-latin-wght.woff2
subset FiraMono-Regular.ttf fira-mono fira-mono-latin-400.woff2
subset FiraMono-Bold.ttf fira-mono fira-mono-latin-700.woff2

for family in publicsans:public-sans opensans:open-sans firacode:fira-code firamono:fira-mono; do
  curl -fsSL -o "$OUT_DIR/${family#*:}/OFL.txt" "$BASE/${family%%:*}/OFL.txt"
done
