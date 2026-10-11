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
 *   5 focus      a component whose Escape CLOSES something (dialog, panel, menu, tooltip, speed dial) has a
 *                play test asserting where focus lands afterwards (`toHaveFocus` right after `{Escape}`) —
 *                WCAG 2.4.3: closing must not drop a keyboard user back to the top of the page
 *
 * The browser checks — axe in light and dark, visible focus, target size, reflow, and the play tests
 * actually passing — need Storybook running, so they stay in `pnpm verify:stable` (criteria 4–6).
 * The rules live in scripts/a11y-contract-rules.ts (shared with `pnpm a11y`).
 * Run: pnpm verify:a11y-contracts
 */
import fs from 'fs';
import path from 'path';
import { staticA11yIssues } from './a11y-contract-rules.ts';

const root = path.resolve(import.meta.dirname, '..');
const contractsDir = path.join(root, 'contracts/components');
const storiesDir = path.join(root, 'apps/storybook/stories');

const storyFiles = (fs.readdirSync(storiesDir, { recursive: true }) as string[]).filter(f => f.endsWith('.stories.tsx'));
const storyOf = (name: string) => {
  const file = storyFiles.find(f => path.basename(f) === `${name}.stories.tsx`);
  return file ? fs.readFileSync(path.join(storiesDir, file), 'utf8') : '';
};

let problems = 0;
for (const file of fs.readdirSync(contractsDir).filter(f => f.endsWith('.json')).sort()) {
  const contract = JSON.parse(fs.readFileSync(path.join(contractsDir, file), 'utf8'));
  const result = staticA11yIssues(contract, storyOf(contract.name));
  const issues = Object.values(result).flatMap(x => x ?? []);
  if (issues.length) {
    problems += issues.length;
    console.log(`❌ ${contract.name}`);
    for (const issue of issues) console.log(`   ${issue}`);
  }
}

if (problems) {
  console.log(`\n${problems} accessibility contract problem(s). Fill in the contract's a11y section and add a play test per key (see .ai/skills/ds-component-creator.md → Step 7).`);
  process.exit(1);
}
console.log('✅ verify:a11y-contracts — every contract has role, WCAG criteria, keys for interactive components, a play test per key, and focus checked after Escape closes');
