import type { ESLint, Linter, Rule } from 'eslint';

declare const plugin: ESLint.Plugin & {
  rules: Record<'import-source' | 'prop-vocabulary' | 'no-raw-color' | 'no-raw-spacing' | 'no-raw-control' | 'unknown-prop' | 'story-has-controls', Rule.RuleModule>;
  configs: { recommended: Linter.Config };
};
export default plugin;
