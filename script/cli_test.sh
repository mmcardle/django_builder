#!/bin/bash

set -ex

./bin/django-builder example-project.json output.tar

tar -xvf output.tar

cd DjangoProject
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
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
kill ${ID}