PHONY: build deploy smoke_test

EXAMPLE_TAR_OUTPUT = $(abspath ./example_project.tar)
EXAMPLE_PROJECT_JSON = $(abspath ./example_projects/example-project.json)
EXAMPLE_PROJECT_POSTGRES_JSON = $(abspath ./example_projects/example-project-postgres.json)

PARTIAL_WITH_CHANNELS_JSON = $(abspath ./example_projects/with-channels.partial.json)

PROJECT_NAME=`cat ${EXAMPLE_PROJECT_POSTGRES_JSON}  | jq -r '.name'`
PROJECT_NAME_WITH_CHANNELS=`cat ${PARTIAL_WITH_CHANNELS_JSON}  | jq -r '.name'`

deploy:
ifeq "$(name)" ""
	@echo "Specify name e.g. make deploy name=staging" && exit 1
else
	firebase use $(name)
	yarn run build_$(name)
	rm -rf dist_$(name)
	mkdir -p dist_$(name)
	cp -r packages/djangobuilder.io/dist/* dist_$(name)/
	mkdir -p dist_$(name)/db4/
	cp -r packages/djangobuilder4/dist/* dist_$(name)/db4/
	firebase deploy --public=dist_$(name)
endif

smoke_test:
	./script/cli_test.sh ${EXAMPLE_PROJECT_JSON}

smoke_test_postgres:
	./script/cli_test.sh ${EXAMPLE_PROJECT_POSTGRES_JSON} start_docker

smoke_test_postgres_channels:
	jq -s '.[0] * .[1]' ${EXAMPLE_PROJECT_POSTGRES_JSON} ${PARTIAL_WITH_CHANNELS_JSON} > /tmp/project-with-channels.json
	./script/cli_test.sh /tmp/project-with-channels.json

smoke_test_postgres_ci:
	./script/cli_test.sh ${EXAMPLE_PROJECT_POSTGRES_JSON}

create:
	yarn run cli ${EXAMPLE_PROJECT_POSTGRES_JSON} ${EXAMPLE_TAR_OUTPUT}
	echo "Project created at ${PROJECT_NAME}"
	tar -xvf ${EXAMPLE_TAR_OUTPUT}

run_django: create
	cd ${PROJECT_NAME} && uv venv --python 3.13
	cd ${PROJECT_NAME} && . .venv/bin/activate
	cd ${PROJECT_NAME} && uv pip install -r requirements.txt -r requirements-dev.txt
	cd ${PROJECT_NAME} && uv run python manage.py makemigrations
	cd ${PROJECT_NAME} && uv run python manage.py migrate
	cd ${PROJECT_NAME} && uv run python manage.py runserver

test_django: create
	cd ${PROJECT_NAME} && uv venv --python 3.13
	cd ${PROJECT_NAME} && . .venv/bin/activate
	cd ${PROJECT_NAME} && uv pip install -r requirements.txt -r requirements-dev.txt
	cd ${PROJECT_NAME} && uv run python manage.py makemigrations
	cd ${PROJECT_NAME} && uv run python manage.py migrate
	cd ${PROJECT_NAME} && uv run pytest

run_django_channels: create_channels
	cd ${PROJECT_NAME_WITH_CHANNELS} && uv venv --python 3.13
	cd ${PROJECT_NAME_WITH_CHANNELS} && . .venv/bin/activate
	cd ${PROJECT_NAME_WITH_CHANNELS} && uv pip install -r requirements.txt -r requirements-dev.txt
	cd ${PROJECT_NAME_WITH_CHANNELS} && uv run python manage.py makemigrations
	cd ${PROJECT_NAME_WITH_CHANNELS} && uv run python manage.py migrate
	cd ${PROJECT_NAME_WITH_CHANNELS} && uv run python manage.py runserver

create_channels:
	jq -s '.[0] * .[1]' ${EXAMPLE_PROJECT_POSTGRES_JSON} ${PARTIAL_WITH_CHANNELS_JSON} > /tmp/project-with-channels.json
	yarn run cli /tmp/project-with-channels.json ${EXAMPLE_TAR_OUTPUT}
	echo "Project created at ${PROJECT_NAME_WITH_CHANNELS}"
	tar -xvf ${EXAMPLE_TAR_OUTPUT}

test_django_channels: create_channels
	cd ${PROJECT_NAME_WITH_CHANNELS} && uv venv --python 3.13
	cd ${PROJECT_NAME_WITH_CHANNELS} && . .venv/bin/activate
	cd ${PROJECT_NAME_WITH_CHANNELS} && uv pip install -r requirements.txt -r requirements-dev.txt
	cd ${PROJECT_NAME_WITH_CHANNELS} && uv run python manage.py makemigrations
	cd ${PROJECT_NAME_WITH_CHANNELS} && uv run python manage.py migrate
	cd ${PROJECT_NAME_WITH_CHANNELS} && uv run pytest