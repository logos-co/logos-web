#!/bin/bash
# Copy the past-present-future SvelteKit build into the Next.js static export.
#
# apps/past-present-future is a separate app served at /past-present-future.
# Turbo builds it before web (it is a workspace dependency), and this script
# drops its static output into out/ before strip-default-locale-prefix.sh runs,
# so its pages get the same route normalisation as the rest of the export.

set -euo pipefail

SRC_DIR="${1:-node_modules/past-present-future/build}"
OUT_DIR="${2:-out}"
DEST_DIR="$OUT_DIR/past-present-future"

if [[ ! -f "$SRC_DIR/index.html" ]]; then
  echo "${SRC_DIR}/index.html not found. Build it first: pnpm turbo run build --filter=web"
  exit 1
fi

if [[ ! -d "$OUT_DIR" ]]; then
  echo "${OUT_DIR}/ not found"
  exit 1
fi

if [[ -e "$DEST_DIR" ]]; then
  echo "${DEST_DIR} already exists. Something else in the export owns /past-present-future."
  exit 1
fi

echo "Copying ${SRC_DIR}/ to ${DEST_DIR}/"
mkdir -p "$DEST_DIR"
cp -R "$SRC_DIR"/. "$DEST_DIR"/
