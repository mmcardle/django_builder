#!/bin/bash

set -ex

yarn run smoketest

tar -xvf lib/djangobuilder-core/ThePetZoo.tar

cd ThePetZoo
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver

#python manage.py runserver &
#ID=$!
#curl --connect-timeout 5 \
#    --retry-connrefused \
#    --max-time 5 \
#    --retry 5 \
#    --retry-delay 2 \
#    --retry-max-time 60 \
#    'http://127.0.0.1:8000'
#kill ${ID}