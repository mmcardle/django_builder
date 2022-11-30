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

BOOTSCRIPT="/tmp/django_builder_bootstrap.py"
echo "from django.contrib.auth.models import User" > ${BOOTSCRIPT}
echo "user, _ = User.objects.get_or_create(username='admin')" >> ${BOOTSCRIPT}
echo "user.set_password('admin')" >> ${BOOTSCRIPT}
echo "user.save()" >> ${BOOTSCRIPT}

python manage.py shell < ${BOOTSCRIPT}
python manage.py runserver