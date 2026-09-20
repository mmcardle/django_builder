#!/bin/bash
# Assemble the Firebase Hosting site from the three package builds:
#   /        <- packages/djangobuilder5/dist
#   /legacy/ <- packages/djangobuilder.io/dist
#   /db4/    <- packages/djangobuilder4/dist
# Usage: script/assemble_site.sh <out_dir>
set -euo pipefail

OUT=${1:-}
if [ -z "$OUT" ] || [ "$OUT" = "/" ] || [ "$OUT" = "." ]; then
  echo "Usage: script/assemble_site.sh <out_dir>  (out_dir must not be empty, '/' or '.')" >&2
  exit 1
fi

ROOT=$(cd "$(dirname "$0")/.." && pwd)
for pkg in djangobuilder5 djangobuilder.io djangobuilder4; do
  if [ ! -f "$ROOT/packages/$pkg/dist/index.html" ]; then
    echo "Missing packages/$pkg/dist/index.html - run the builds first (e.g. bun run build_development)" >&2
    exit 1
  fi
done

rm -rf "$OUT"
mkdir -p "$OUT/legacy" "$OUT/db4"
cp -R "$ROOT/packages/djangobuilder5/dist/." "$OUT/"
cp -R "$ROOT/packages/djangobuilder.io/dist/." "$OUT/legacy/"
cp -R "$ROOT/packages/djangobuilder4/dist/." "$OUT/db4/"
echo "Assembled site in $OUT (/ , /legacy/ , /db4/)"
