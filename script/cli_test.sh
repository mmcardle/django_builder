#!/bin/bash

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <project.json>"
    exit 1
fi

PROJECT_FILE=`realpath $1`
START_DOCKER=$START_DOCKER

if [ ! -f "${PROJECT_FILE}" ]; then
    echo "File not found: ${PROJECT_FILE}"
    exit 1
fi

DIR=`mktemp --directory`
TEMP_TAR="${DIR}/output.tar"
PROJECT_NAME=`cat $1 | jq -r '.name'`
DJANGO_PORT=${DJANGO_PORT:-9001}
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
PYTHON_VERSION=${PYTHON_VERSION:-3.13}

echo "Config file: ${PROJECT_FILE}"
echo "Temp dir: ${DIR}"
echo "Temp tar: ${TEMP_TAR}"
echo "Django port: ${DJANGO_PORT}"
echo "Postgres host: ${POSTGRES_HOST}"
echo "Postgres port: ${POSTGRES_PORT}"
echo "Project name: ${PROJECT_NAME}"

if [ -z "${PROJECT_NAME}" ]; then
    echo "Project name is required"
    exit 1
fi

if [ -n "${START_DOCKER}" ]; then
    docker-compose up -d
    RETRIES=20
    until nc -z ${POSTGRES_HOST} ${POSTGRES_PORT} > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    echo "Waiting for postgres server, $((RETRIES--)) remaining attempts..."
    sleep 1
    done
fi

yarn run cli ${PROJECT_FILE} ${TEMP_TAR}

cd ${DIR}
tar -xvf ${TEMP_TAR}
cd ${DIR}/${PROJECT_NAME}

echo "Project name: ${PROJECT_NAME}"
echo "Temp dir: ${DIR}"
echo "Temp tar: ${TEMP_TAR}"
echo "Django port: ${DJANGO_PORT}"
echo "Postgres host: ${POSTGRES_HOST}"
echo "Postgres port: ${POSTGRES_PORT}"

uv venv --python ${PYTHON_VERSION}
source .venv/bin/activate
uv pip install -r requirements.txt -r requirements-dev.txt
uv run python manage.py makemigrations
uv run python manage.py migrate
uv run pytest
uv run python manage.py runserver ${DJANGO_PORT} &
ID=$!

curl --connect-timeout 5 \
    --retry-connrefused \
    --max-time 5 \
    --retry 5 \
    --retry-delay 2 \
    --retry-max-time 10 \
    "http://127.0.0.1:${DJANGO_PORT}" || kill ${ID}

curl "http://127.0.0.1:${DJANGO_PORT}" | grep "DjangoModel1 Listing"
HTTP_RESULT=$?

echo "Test Message" | websocat ws://127.0.0.1:${DJANGO_PORT}/ws/ -1 | grep "Hello from DjangoProjectWithChannels WebSocketConsumer! Test Message"
WEBSOCKET_RESULT=$?

echo -e "View Results at \e[32m${DIR}/${PROJECT_NAME}\e[0m"

kill ${ID}
if [ $HTTP_RESULT -eq 0 ] && [ $WEBSOCKET_RESULT -eq 0 ]; then
    echo -e "\e[32mTest passed\e[0m"
    exit 0
else
    echo -e "\e[31mTest failed\e[0m"
    exit 1
fi