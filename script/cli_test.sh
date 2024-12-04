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

yarn run cli ../../$1 ${TEMP_TAR}

cd ${DIR}
tar -xvf ${TEMP_TAR}
cd ${DIR}/${PROJECT_NAME}

python3.13 -m venv .venv
source .venv/bin/activate
uv pip sync requirements.txt 
python manage.py makemigrations
python manage.py migrate
python manage.py runserver &
ID=$!
curl --connect-timeout 5 \
    --retry-connrefused \
    --max-time 5 \
    --retry 5 \
    --retry-delay 2 \
    --retry-max-time 60 \
    'http://127.0.0.1:8000'

curl 'http://127.0.0.1:8000' | grep "DjangoModel1 Listing"
RESULT=$?

kill ${ID}
if [ $RESULT -eq 0 ]; then
    echo -e "\e[32mTest passed\e[0m"
    exit 0
else
    echo -e "\e[31mTest failed\e[0m"
    exit 1
fi