/**
 * @helix/eslint-plugin — flags Helix usage mistakes while the code is being written, in the editor,
 * instead of after the fact in CI or an eval run.
 *
 *   // eslint.config.js
 *   import helix from '@helix/eslint-plugin';
 *   export default [helix.configs.recommended];
 */
import propVocabulary from './rules/prop-vocabulary.js';
import noRawColor from './rules/no-raw-color.js';
import noRawControl from './rules/no-raw-control.js';
import importSource from './rules/import-source.js';
import unknownProp from './rules/unknown-prop.js';

const plugin = {
  meta: { name: '@helix/eslint-plugin', version: '0.1.0' },
  rules: {
    'import-source': importSource,
    'prop-vocabulary': propVocabulary,
    'unknown-prop': unknownProp,
    'no-raw-color': noRawColor,
    'no-raw-control': noRawControl,
  },
  configs: {},
};

plugin.configs.recommended = {
  name: 'helix/recommended',
  files: ['**/*.{js,jsx,mjs,ts,tsx}'],
  plugins: { helix: plugin },
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  rules: {
    'helix/import-source': 'error',
    'helix/prop-vocabulary': 'error',
    'helix/unknown-prop': 'error',
    'helix/no-raw-color': 'error',
    'helix/no-raw-control': 'warn',
  },
};

export default plugin;
