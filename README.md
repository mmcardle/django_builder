
# Django Builder

https://djangobuilder.io

The original Django Builder v1 is deployed at:

http://mmcardle.github.io/django_builder/

## Project setup
```
yarn install
```

#### Firebase
```
npm install -g firebase-tools
```

## Setup Firebase Environment

Django Builder uses a Firebase backend. Copy the example env file

```
cp .env.example .env.development.local
```

Edit this file with your firebase setup and run the development server.

```
yarn run serve
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

### Run your tests
```
yarn run test
```

### Lints and fixes files
```
yarn run lint
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
