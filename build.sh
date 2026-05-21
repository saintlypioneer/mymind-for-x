#!/usr/bin/env bash
# Builds a distributable ZIP of the extension for the Releases page.
set -e

OUT="mymind-for-x.zip"
cd "$(dirname "$0")"

rm -f "$OUT"
zip -r "$OUT" \
  manifest.json \
  background.js \
  content.js \
  content.css \
  popup.html \
  popup.js \
  icons \
  -x "*.DS_Store"

echo "Built $OUT"
