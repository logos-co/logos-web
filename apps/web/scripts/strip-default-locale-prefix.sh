#!/bin/bash
# Strip default locale prefix (/en) from a Next.js static export.
#
# Static export with next-intl uses explicit locale-prefixed routes.
# This script makes the default locale available at root (/)
# while leaving any non-default locale prefixes intact.

set -euo pipefail

OUT_DIR="${1:-out}"
LOCALE="${2:-en}"

echo "Stripping /${LOCALE} prefix from ${OUT_DIR}/"

if [[ ! -d "$OUT_DIR" ]]; then
  echo "${OUT_DIR}/ not found"
  exit 1
fi

if [[ ! -d "$OUT_DIR/$LOCALE" && ! -f "$OUT_DIR/${LOCALE}.html" ]]; then
  echo "${OUT_DIR}/${LOCALE} not found - skipping"
  exit 0
fi

if [[ -d "$OUT_DIR/$LOCALE" ]]; then
  echo "Copying /${LOCALE}/ to root..."
  cp -R "$OUT_DIR/$LOCALE"/. "$OUT_DIR/"
fi

echo "Rewriting internal paths..."
find "$OUT_DIR" -type f \( -name "*.html" -o -name "*.js" -o -name "*.json" -o -name "*.txt" -o -name "*.xml" \) \
  -exec perl -0pi -e "
    s|href=\"/${LOCALE}/|href=\"/|g;
    s|href=\"/${LOCALE}\"|href=\"/\"|g;
    s|href='/${LOCALE}/|href='/|g;
    s|href='/${LOCALE}'|href='/'|g;
    s|src=\"/${LOCALE}/|src=\"/|g;
    s|src='/${LOCALE}/|src='/|g;
    s|action=\"/${LOCALE}/|action=\"/|g;
    s|action='/${LOCALE}/|action='/|g;
    s|\\\"/${LOCALE}/|\\\"/|g;
    s|\\\"/${LOCALE}\\\"|\\\"/\\\"|g;
    s|\"/${LOCALE}/|\"/|g;
    s|\"/${LOCALE}\"([,}\]])|\"/\"\1|g;
    s|'/${LOCALE}/|'/|g;
    s|'/${LOCALE}'([,}\]])|'/'\1|g;
    s|>${LOCALE}/|>/|g;
  " {} +

if [[ -f "$OUT_DIR/${LOCALE}.html" ]]; then
  echo "Renaming ${LOCALE}.html to index.html..."
  mv "$OUT_DIR/${LOCALE}.html" "$OUT_DIR/index.html"
fi

if [[ -f "$OUT_DIR/${LOCALE}.txt" ]]; then
  echo "Renaming ${LOCALE}.txt to index.txt..."
  mv "$OUT_DIR/${LOCALE}.txt" "$OUT_DIR/index.txt"
fi

if [[ -d "$OUT_DIR/$LOCALE" ]]; then
  echo "Removing /${LOCALE}/ directory..."
  rm -rf "$OUT_DIR/$LOCALE"
fi

echo "Normalizing exported routes for static file servers..."
find "$OUT_DIR" -type f -name "*.html" ! -name "index.html" ! -name "404.html" ! -name "_not-found.html" | while read -r html_file; do
  route_dir="${html_file%.html}"
  mkdir -p "$route_dir"
  mv "$html_file" "$route_dir/index.html"
done

find "$OUT_DIR" -type f -name "*.txt" ! -name "index.txt" ! -name "404.txt" ! -name "_not-found.txt" ! -name "robots.txt" | while read -r txt_file; do
  route_dir="${txt_file%.txt}"
  mkdir -p "$route_dir"
  mv "$txt_file" "$route_dir/index.txt"
done

echo "Done"
