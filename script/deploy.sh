#!/bin/bash

set -e

NAME=$1

if [ $1 == "" ] ; then
    echo 'Name not given as argument 1'
    exit 0
fi

firebase use ${NAME} || exit 1
echo "Deploying ${NAME}"

yarn --cwd packages/djangobuilder.io build --mode ${NAME}
yarn --cwd packages/djangobuilder4 build-only --mode ${NAME}

mkdir -p dist/${NAME}/db4/
cp -R packages/djangobuilder4/dist/* dist/${NAME}/db4/
cp -R packages/djangobuilder.io/dist/* dist/${NAME}/

firebase deploy --public=dist/${NAME}