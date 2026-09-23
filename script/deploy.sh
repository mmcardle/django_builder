#!/bin/bash
# Build all three apps, assemble the hosting site and deploy it to the named
# Firebase project alias (see .firebaserc).
# Usage: script/deploy.sh <development|staging|production>
set -euo pipefail

NAME=${1:-}
if [ -z "$NAME" ]; then
  echo "Usage: script/deploy.sh <development|staging|production>" >&2
  exit 1
fi

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

bunx firebase use "$NAME"
echo "Deploying $NAME"

bun run "build_$NAME"
./script/assemble_site.sh "dist_$NAME"
bunx firebase deploy --public="dist_$NAME"
