#!/bin/bash

set -e

NAME=$1

if [ -z "$NAME" ] ; then
    echo 'Name not given as argument 1'
    exit 1
fi

bunx firebase use ${NAME} || exit 1
echo "Deploying ${NAME}"

bun run --filter=djangobuilder.io build --mode ${NAME}
bun run --filter=djangobuilder4 build-only --mode ${NAME}

mkdir -p dist/${NAME}/db4/
cp -R packages/djangobuilder4/dist/* dist/${NAME}/db4/
cp -R packages/djangobuilder.io/dist/* dist/${NAME}/

bunx firebase deploy --public=dist/${NAME}