#!/usr/bin/env tsx
/**
 * Scaffolds a local custom component — one that lives in a consuming app, outside @helix-ds/core —
 * with the governance header, semantic Helix tokens and an accessible base already in place.
 * Writes files, so it lives apart from the read-only helix-cli.ts, which only routes to it.
 *
 * Usage: pnpm helix scaffold:custom <ComponentName> --reason "<why Helix doesn't cover it>" [--dir <path>]
 */
import fs from 'fs';
import path from 'path';
import { listComponents } from './helix-query-lib.ts';

const root = path.resolve(import.meta.dirname, '..');
// pnpm runs scripts from the repo root; INIT_CWD is where the person actually typed the command.
const callerCwd = process.env.INIT_CWD ?? process.cwd();

function argValue(args: string[], flag: string): string | undefined {
  const at = args.indexOf(flag);
  return at >= 0 ? args[at + 1] : undefined;
}

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

export function scaffoldCustom(args: string[]) {
  const name = args.find((arg, index) => !arg.startsWith('--') && !args[index - 1]?.startsWith('--'));
  const reason = argValue(args, '--reason')?.trim();
  if (!name) fail('Missing component name. Usage: pnpm helix scaffold:custom <ComponentName> --reason "<why>" [--dir <path>]');
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) fail(`'${name}' is not PascalCase (e.g. UsageMeter).`);
  // The reason is the whole point of the [CUSTOM] header — a placeholder would pass every check
  // (eval-review only requires a word after the tag) while saying nothing, so it's required up front.
  if (!reason) fail('Missing --reason. Say why no Helix component covers this, e.g. --reason "Helix has no calendar heatmap".');

  // Component hierarchy (AGENTS.md): Helix core first, custom second.
  const existing = listComponents().find(component => component.name.toLowerCase() === name.toLowerCase());
  if (existing) fail(`Helix already has '${existing.name}' (${existing.status}) — use it from @helix-ds/core instead of a custom copy.`);

  const dir = path.resolve(callerCwd, argValue(args, '--dir') ?? path.join('src/custom', name));
  const files = scaffoldFiles(name, reason);
  const clashes = Object.keys(files).filter(file => fs.existsSync(path.join(dir, file)));
  if (clashes.length) fail(`Refusing to overwrite existing files in ${dir}: ${clashes.join(', ')}`);

  // Never emit a var() that doesn't resolve — a typo'd token silently falls back to the browser default.
  const defined = new Set(fs.readFileSync(path.join(root, 'packages/tokens/dist/helix.css'), 'utf8').match(/--helix-[\w-]+(?=:)/g));
  const unknown = [...new Set(Object.values(files).join('\n').match(/--helix-[\w-]+/g) ?? [])].filter(token => !defined.has(token));
  if (unknown.length) fail(`Template references tokens missing from packages/tokens/dist/helix.css: ${unknown.join(', ')}`);

  fs.mkdirSync(dir, { recursive: true });
  for (const [file, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, file), content);

  const shown = path.relative(callerCwd, dir);
  console.log(`✅ Scaffolded custom component ${name} in ${shown.startsWith('..') ? dir : shown}`);
  for (const file of Object.keys(files)) console.log(`   ${file}`);
  console.log(`\nBefore building it out, confirm no Helix component covers it: pnpm helix search "<what it does>"`);
  console.log(`The test is the story's play function — it runs with the Storybook test-runner, like Helix's own components.`);
}

function scaffoldFiles(name: string, reason: string): Record<string, string> {
  const singleLineReason = reason.replace(/\s+/g, ' ');
  return {
    [`${name}.tsx`]: `// [CUSTOM] reason: ${singleLineReason}
// Local to this app, outside @helix-ds/core. Keep it on semantic --helix-* tokens (${name}.module.css) and
// canonical prop names (onPress, label, disabled…). If other apps need it too, request it from Helix DS.
import * as React from 'react';
import styles from './${name}.module.css';

export interface ${name}Props {
  /** Accessible name for the region. */
  label: string;
  children?: React.ReactNode;
  className?: string;
}

export function ${name}({ label, children, className }: ${name}Props) {
  return (
    <section
      aria-label={label}
      data-helix-custom="${name}"
      className={[styles.root, className].filter(Boolean).join(' ')}
    >
      {children}
    </section>
  );
}
`,
    [`${name}.module.css`]: `/* [CUSTOM] ${name} — semantic Helix tokens only: no hex values, no Tailwind color primitives. */
.root {
  display: grid;
  gap: var(--helix-spacing-s);
  padding: var(--helix-spacing-m);
  border: var(--helix-borderWidth-thin) solid var(--helix-color-border-neutral);
  border-radius: var(--helix-radius-m);
  background: var(--helix-color-fill-surface);
  color: var(--helix-color-text-neutral);
  font-family: var(--helix-textStyle-body-m-regular-fontFamily);
  font-size: var(--helix-textStyle-body-m-regular-fontSize);
  font-weight: var(--helix-textStyle-body-m-regular-fontWeight);
  line-height: var(--helix-textStyle-body-m-regular-lineHeight);
}
`,
    // Same testing model as Helix itself: a story whose play function is the test (run by the
    // Storybook test-runner), so the custom component is also visible and checked by the a11y addon.
    [`${name}.stories.tsx`]: `import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { ${name} } from './${name}';

const meta: Meta<typeof ${name}> = {
  title: 'Custom/${name}',
  component: ${name},
  tags: ['autodocs'],
  args: { label: '${name} example', children: 'Content' },
};

export default meta;
type Story = StoryObj<typeof ${name}>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: '${name} example' });
    await expect(region).toHaveAttribute('data-helix-custom', '${name}');
  },
};
`,
    'index.ts': `export { ${name} } from './${name}';
export type { ${name}Props } from './${name}';
`,
  };
}
