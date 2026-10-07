// Helix's settings for Proof (`pnpm proof`). Proof itself is design-system agnostic — everything
// Helix-specific is here. See packages/proof/README.md.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const here = import.meta.dirname;
// The context ladder and the task list are shared with `pnpm eval:ladder` and Storybook's gallery.
const ladder = JSON.parse(readFileSync(path.join(here, 'evals/ladder.json'), 'utf-8'));

export default {
  name: 'Helix',
  outputs: 'evals/outputs',
  out: 'evals/proof',
  // Storybook already renders Helix: react, @helix/*, Tailwind all resolve from its node_modules.
  app: 'apps/storybook',
  css: ['@helix/tokens/helix.css', '@helix/react/globals.css'],
  // Opens on button-basic — the reference task every level is compared on first.
  defaultTask: 'button-basic',
  tasks: readdirSync(path.join(here, 'evals/prompts')).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')),
  // Every name @helix/react really exports — generated from core's index.ts for the lint plugin.
  exports: { '@helix/react': JSON.parse(readFileSync(path.join(here, 'packages/eslint-plugin/src/data.json'), 'utf-8')).coreExports },
  imports: ['react', 'react-dom', '@helix/react', '@helix/tokens', '@tabler/icons-react'],
  vite: async ({ importFromApp }) => ({
    plugins: [(await importFromApp('@tailwindcss/vite')).default()],
    // Same as Storybook: render against source, so dist/ needn't be built.
    resolve: { alias: [{ find: /^@helix\/react$/, replacement: path.resolve(here, 'packages/core/src/index.ts') }] },
  }),
  htmlAttributes: { 'data-theme': 'light' },
  // Rows, in order. A level's row shows its eval:ladder command until it has answers for the task.
  variants: Object.fromEntries(ladder.levels.map(level => [level.variant, {
    label: level.label,
    detail: level.detail,
    explain: level.explain,
    command: `pnpm eval:ladder --levels ${level.variant} --prompt {task} --yes`,
  }])),
  // The "Run evals" button (eg, or pnpm proof --serve): a new measurement round, recorded in
  // evals/rounds.json; then Metrics and Storybook's gallery are refreshed too.
  runner: {
    plan: ['pnpm', '-s', 'eval:ladder', '--round', '--json', '--levels', '{levels}', '--prompt', '{tasks}', '--runs', '{runs}'],
    run: ['pnpm', '-s', 'eval:ladder', '--round', '--yes', '--levels', '{levels}', '--prompt', '{tasks}', '--runs', '{runs}'],
    after: [['pnpm', '-s', 'quality', 'snapshot'], ['pnpm', '-s', 'eval:gallery']],
    defaultRuns: 1,
  },
};
