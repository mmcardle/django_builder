
# Django Builder

https://djangobuilder.io

The original Django Builder v1 is deployed at:

http://mmcardle.github.io/django_builder/

## Project setup
```
yarn install
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
```
npm install -g firebase-tools
firebase login
```

## Setup Firebase Environment

Django Builder uses a Firebase backend. Copy the example env file

```
cp .env.example .env.development.local
```

Edit this file with your firebase setup and run the development server.

```
yarn serve
```

### Compiles and minifies for different modes
```
yarn build --mode=development
yarn build --mode=production
```

### Initial setup

When a fresh checkout is done aliases must be setup for each project, e.g. development

```
firebase use --add
```

Follow the instructions to link to your Firebase application, choose the alias 'development' and your firebase project

### Deploy development
```
firebase use development
yarn build --mode=development --dest=dist_development
firebase deploy --public=dist_development
```

### Run unit tests
```
yarn test:unit
```

### Run e2e tests
```
yarn test:e2e
```

### Lints and fixes files
```
yarn lint
```

### Firebase get indexes
Useful after creating an index
```
firebase firestore:indexes
```

### Firebase use project
```
firebase use development
firebase use production
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
