/**
 * Accessibility gate that needs no browser, run in pre-commit so a new or changed component can't land
 * without it. For every contract in contracts/components/:
 *
 *   1 role       a11y.role is filled in
 *   2 wcag       a11y.wcag names at least one WCAG criterion
 *   3 keys       an INTERACTIVE component (it takes onClick/onChange/onSelect/onDismiss/expanded…, or its
 *                role is a widget role) lists at least one key in a11y.keyboardNav — keyboard tests can only
 *                be as complete as this list
 *   4 tests      every key in a11y.keyboardNav has a `play` test pressing it in the component's stories
 *                (same reading as verify:stable criterion 5, via scripts/a11y-keys.ts)
 *
 * The browser checks — axe in light and dark, visible focus, target size, reflow, and the play tests
 * actually passing — need Storybook running, so they stay in `pnpm verify:stable` (criteria 4–6).
 * Run: pnpm verify:a11y-contracts
 */
import fs from 'fs';
import path from 'path';
import { requiredKeys } from './a11y-keys.ts';

const root = path.resolve(import.meta.dirname, '..');
const contractsDir = path.join(root, 'contracts/components');
const storiesDir = path.join(root, 'apps/storybook/stories');

// Props that mean "the user operates this", and roles that are widgets by definition.
const INTERACTIVE_PROPS = /^(onClick|onChange|onSelect|onDismiss|onExpandedChange|onValueChange|onReorder|expanded|checked|value)$/;
const WIDGET_ROLE = /\b(button|checkbox|radio|switch|tab|dialog|listbox|combobox|menu|menuitem|slider|textbox|spinbutton|disclosure)\b/i;

const storyFiles = (fs.readdirSync(storiesDir, { recursive: true }) as string[]).filter(f => f.endsWith('.stories.tsx'));
const storyOf = (name: string) => {
  const file = storyFiles.find(f => path.basename(f) === `${name}.stories.tsx`);
  return file ? fs.readFileSync(path.join(storiesDir, file), 'utf8') : '';
};

let problems = 0;
for (const file of fs.readdirSync(contractsDir).filter(f => f.endsWith('.json')).sort()) {
  const contract = JSON.parse(fs.readFileSync(path.join(contractsDir, file), 'utf8'));
  const name: string = contract.name;
  const a11y = contract.a11y ?? {};
  const issues: string[] = [];

  if (!String(a11y.role ?? '').trim()) issues.push('a11y.role is empty');
  if (!(a11y.wcag ?? []).length) issues.push('a11y.wcag names no WCAG criterion');

  const interactive = (contract.props ?? []).some((p: { name: string }) => INTERACTIVE_PROPS.test(p.name)) || WIDGET_ROLE.test(String(a11y.role ?? ''));
  const keys: string[] = a11y.keyboardNav ?? [];
  if (interactive && keys.length === 0) issues.push('interactive, but a11y.keyboardNav lists no keys');

  const story = storyOf(name);
  const play = story.includes('play:') ? story : '';
  for (const entry of keys) {
    for (const k of requiredKeys(entry)) {
      if (!k.anyOf.some(s => play.includes(s))) issues.push(`no play test presses ${k.label} ("${entry.slice(0, 50)}")`);
    }
  }

  if (issues.length) {
    problems += issues.length;
    console.log(`❌ ${name}`);
    for (const issue of issues) console.log(`   ${issue}`);
  }
}

if (problems) {
  console.log(`\n${problems} accessibility contract problem(s). Fill in the contract's a11y section and add a play test per key (see .ai/skills/ds-component-creator.md → Step 7).`);
  process.exit(1);
}
console.log('✅ verify:a11y-contracts — every contract has role, WCAG criteria, keys for interactive components, and a play test per key');
