#!/bin/bash

set -ex

if [ -z "$1" ]; then
    echo "Usage: $0 <project.json>"
    exit 1
fi

DIR=`mktemp --directory`
TEMP_TAR="${DIR}/output.tar"
PROJECT_NAME=`cat $1 | jq -r '.name'`

echo "Project name: ${PROJECT_NAME}"

if [ -z "${PROJECT_NAME}" ]; then
    echo "Project name is required"
    exit 1
fi

yarn run cli $1 ${TEMP_TAR}

cd ${DIR}
tar -xvf ${TEMP_TAR}
cd ${DIR}/${PROJECT_NAME}

uv venv --python 3.13
source .venv/bin/activate
uv pip sync requirements.txt 
uv run python manage.py makemigrations
uv run python manage.py migrate
uv run python manage.py runserver 9001 &
ID=$!
curl --connect-timeout 5 \
    --retry-connrefused \
    --max-time 5 \
    --retry 5 \
    --retry-delay 2 \
    --retry-max-time 10 \
    'http://127.0.0.1:9001'

curl 'http://127.0.0.1:9001' | grep "DjangoModel1 Listing"
RESULT=$?

kill ${ID}
if [ $RESULT -eq 0 ]; then
    echo -e "\e[32mTest passed\e[0m"
    exit 0
else
    echo -e "\e[31mTest failed\e[0m"
    exit 1
fi