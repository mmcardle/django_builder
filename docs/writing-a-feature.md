# How to write a feature

A feature usually touches some combination of: a Vue component, the
router, the Vuex store, and (if it affects generated output) the
`src/django/` renderer. Work in that order.

## 1. Decide where it lives

- A new page → `src/components/MyPage.vue` + a route in `src/router.js`.
- A new dialog → `src/components/MyDialog.vue`, opened from
  `MainContent.vue` or wherever the trigger lives.
- A new form field → likely `src/components/forms/`.
- A change to generated Django code → `src/django/rendering.js` (and
  possibly new raw files under `src/django/python/` or `templates/`).

See [`docs/packages-and-code-layout.md`](packages-and-code-layout.md)
for the full map.

## 2. Add a component

Use the Vue 2 Options API and Vuetify components. A minimal skeleton:

```vue
<template>
  <v-card>
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text>...</v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'MyThing',
  props: {
    title: { type: String, default: 'Untitled' },
  },
  computed: {
    user() { return this.$store.getters.user() },
  },
  methods: {
    save() { this.$store.commit('...') },
  },
}
</script>
```

Match the style of existing components (e.g. `DeleteDialog.vue`,
`Project.vue`).

## 3. Wire up routing

Add lazy-loaded routes in `src/router.js`:

```js
{
  path: '/my-thing/:id',
  name: 'my-thing',
  component: () => import('@/components/MyThing.vue'),
}
```

## 4. Store state

If the feature has shared or persistent state, extend `src/store.js`:

- Add to `state`, expose via `getters`.
- Use `mutations` for sync changes and `actions` for anything async
  (Firestore reads/writes, network calls).
- For new Firestore-backed entities, also update `schemas.js` with the
  default shape and `firestore.rules` / `firestore.indexes.json` if
  the access pattern changes.

## 5. Generated Django output

If the feature changes what users download:

- `src/django/rendering.js` is the main renderer; find the existing
  function that emits the file you're changing and update it there.
- For wholly new files, drop a raw template into `src/django/python/`,
  `templates/`, or `requirements/`, import it with `raw-loader`
  (existing imports show the pattern), and add it to the file map in
  `rendering.js` / `index.js`.
- Add a unit test (see [`writing-tests.md`](writing-tests.md)) that
  asserts the rendered string contains what you expect.

## 6. Verify

```
yarn lint
yarn test:unit
yarn serve            # smoke-test in the browser
```

For UI-only changes an e2e run is optional; for changes to the
landing/login flow run:

```
yarn e2e
```

## 7. Document

If you add a new top-level area or workflow, update `AGENTS.md` or
the relevant doc in `docs/`. Keep these short.
