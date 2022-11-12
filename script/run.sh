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
curl http://127.0.0.1:8080
kill ${ID}