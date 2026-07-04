
# Django Builder

https://djangobuilder.io

The original Django Builder v1 is deployed at:

http://mmcardle.github.io/django_builder/

## Project setup

This repo uses [Bun](https://bun.sh) as its package manager and task runner
(Vite remains the bundler/dev-server). Install dependencies with:

```
bun install
```

### CLI interface

You can create and run a basic Django project from the command line

See [example-project.json](example-project.json)

```
./bin/django-builder example-project.json DjangoProject.tar

tar -xvf DjangoProject.tar

cd DjangoProject
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

Head to http://127.0.0.1:8000

#### Firebase

`firebase-tools` ships as a dev dependency, so run the Firebase CLI through Bun:

```
bunx firebase login
```

## Setup Firebase Environment

Django Builder uses a Firebase backend. Copy the example env file

```
cp .env.example .env.development.local
```

Edit this file with your firebase setup and run the development server.

```
bun run dev
```

### Compiles and minifies for different modes
```
bun run build_development
bun run build_production
```

### Initial setup

When a fresh checkout is done aliases must be setup for each project, e.g. development

```
bunx firebase use --add
```

Follow the instructions to link to your Firebase application, choose the alias 'development' and your firebase project

### Deploy development
```
bunx firebase use development
bun run build_development
bunx firebase deploy --public=dist_development
```

### Run unit tests
```
bun run test_io
```

### Lints and fixes files
```
bun run lint
```

### Firebase get indexes
Useful after creating an index
```
bunx firebase firestore:indexes
```

### Firebase use project
```
bunx firebase use development
bunx firebase use production
```

### Customize configuration
See [Vite Configuration Reference](https://vite.dev/config/).
