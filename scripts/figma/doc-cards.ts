/**
 * `pnpm figma:doc-cards [Name…]` — prints scripts/figma/doc-card.js with its CONFIG filled in, ready to paste into
 * the Figma MCP's use_figma: one entry per core component page, its description = the `purpose` of its
 * {Name}.doc.ts (the sentence Storybook's docs page opens with). No names = every core component with a page.
 * Layout components and Icon have no component page in Figma (CLAUDE.md rule 11b), so they're left out.
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const dir = path.join(root, 'packages/core/src/components');
const NO_PAGE = new Set(['Icon']);
// A component that can't be seen on the white card gets a dark background on its own table only (owner's rule
// 2026-10-22, doc-card.js → CONFIG.dark): true = the whole table on fill/inverse; { axis, from, to } = a hard-stop band
// for just the rows/columns that need it (only for a set with more than one variant). None needs it today.
const DARK: Record<string, true | { axis?: 'x' | 'y'; from: number; to: number }> = {};
const want = process.argv.slice(2);
async function main() {
const configs: { page: string; name: string; description: string; main: string; dark?: (typeof DARK)[string] }[] = [];
for (const name of fs.readdirSync(dir).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))) {
  const file = path.join(dir, name, `${name}.doc.ts`);
  if (!fs.existsSync(file) || NO_PAGE.has(name) || (want.length && !want.includes(name))) continue;
  const { doc } = await import(file);
  configs.push({ page: name, name, description: doc.purpose, main: name, ...(DARK[name] ? { dark: DARK[name] } : {}) });
}
const missing = want.filter(w => !configs.some(c => c.name === w));
if (missing.length) { console.error(`no core component doc for: ${missing.join(', ')}`); process.exit(1); }
const script = fs.readFileSync(path.join(root, 'scripts/figma/doc-card.js'), 'utf8');
process.stdout.write(script.replace('__CONFIG__', JSON.stringify(configs, null, 2)));
}
main();
