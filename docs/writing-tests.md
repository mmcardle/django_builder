# How to write tests

Two layers:

- **Unit tests** — Jest + `@vue/test-utils`, fast, run on every change.
- **End-to-end tests** — Nightwatch, run against the Firebase emulator.

## Unit tests

### Where they live

`tests/unit/` mirrors `src/`:

```
src/components/DeleteDialog.vue   →  tests/unit/components/DeleteDialog.spec.js
src/django/rendering.js           →  tests/unit/django/rendering.spec.js
```

Jest picks them up via `testMatch: tests/unit/**/*.spec.js`
(`jest.config.js`).

### Running

```
yarn test:unit                                 # all unit tests
yarn test:unit -- tests/unit/components/Foo    # one file or folder
yarn test:unit -- --watch                      # watch mode
```

### Component test pattern

Use `shallowMount` unless you specifically need child components to
render. Use the `@/` alias for imports.

```js
import { shallowMount } from '@vue/test-utils'
import DeleteDialog from '@/components/DeleteDialog.vue'

describe('DeleteDialog.vue', () => {
  it('renders default headline', () => {
    const wrapper = shallowMount(DeleteDialog)
    expect(wrapper.text()).toContain('Delete?')
  })

  it('calls ok callback', () => {
    const ok = jest.fn()
    const wrapper = shallowMount(DeleteDialog, { propsData: { ok } })
    wrapper.vm.do_ok()
    expect(ok).toHaveBeenCalled()
  })
})
```

See `tests/unit/components/DeleteDialog.spec.js` for a fuller example.

### Testing the Django renderer

`src/django/rendering.js` is pure: input store-shaped data, output
strings. Tests should assert that the rendered string contains the
expected Python/HTML, not snapshot the whole file (keeps diffs small).

### Vuex and router in tests

Globals are set up in `tests/unit/setup.js` (`Router`, `Vuetify`). For
store-dependent components, either:

- pass a `mocks: { $store: { getters: { ... }, commit: jest.fn() } }`
  option to `shallowMount`, or
- build a small `new Vuex.Store({ ... })` inside the test.

### What to test

- Component behaviour through its public surface: props, computed,
  emitted events, exposed methods.
- Renderer output: presence of key tokens for the inputs you care
  about.
- Bug fixes: add a regression test that fails before your change.

Don't unit-test Vuetify internals or Firebase SDK behaviour.

## End-to-end tests

### Where they live

`tests/e2e/`. Config in `nightwatch.conf.js`.

### Running

The e2e suite drives a real browser against the Firebase emulator:

```
yarn e2e             # chrome only, manages emulator lifecycle
yarn ci              # chrome + firefox (used in CI)
```

Manually:

```
yarn test:e2e_serve  # start emulator (firestore + hosting on :8082)
yarn test:e2e_chrome # in another shell
```

### Pattern

Each test file exports an object of named scenarios:

```js
module.exports = {
  'Logs in anonymously': function (browser) {
    browser
      .url(browser.launchUrl)
      .waitForElementVisible('body')
      .click('#login-anonymous')
      .assert.visible('#django_builder')
      .end()
  },
}
```

See `tests/e2e/test.js` and `tests/e2e/login_anonymous.js`.

Keep e2e tests few and high-value — they're slow and brittle. Anything
you can cover with a unit test should be covered there.
