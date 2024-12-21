const globals = require("globals");
const pluginJs = require("@eslint/js");
const pluginVue = require("eslint-plugin-vue");

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    files: ["**/*.{js,mjs,cjs,vue}"],
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
];
