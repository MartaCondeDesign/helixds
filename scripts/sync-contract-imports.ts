/**
 * Writes each contract's `import` line — the exact statement an app uses, e.g.
 *   "import": "import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@helixds/react';"
 * — generated from packages/core/src/index.ts, so it is always what the package really exports.
 *
 * Why: neither the contracts nor helix_get_contract said where to import from, and agents with the MCP
 * guessed a package that doesn't exist every time (@helix/react, @helix-ui/components, @helix/core —
 * evals round 2026-10-09T15-50-08). The line goes in the contract, so the MCP, the npm package
 * (dist/contracts) and anyone reading contracts/ all get it.
 *
 * Per component: the value exports of its module (./components/<Name> or ./layout/<Name>), minus *Doc
 * objects and SCREAMING_CASE constants. Inserted right after "purpose", touching nothing else in the file.
 * Runs in pre-commit. Run: pnpm docs:contract-imports  (--check: fail if any contract is out of date)
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const index = fs.readFileSync(path.join(root, 'packages/core/src/index.ts'), 'utf8');
const check = process.argv.includes('--check');

// Value (not type) exports, grouped by the module they come from.
const byModule = new Map<string, string[]>();
for (const m of index.matchAll(/^export\s+\{([^}]*)\}\s*from\s*'\.\/(?:components|layout)\/([A-Za-z]+)'/gm)) {
  const names = m[1]!.split(',').map(s => s.trim().split(/\s+as\s+/).pop()!.trim())
    .filter(n => n && !/Doc$/.test(n) && !/^[A-Z][A-Z0-9]*_[A-Z0-9_]+$/.test(n)); // FAB stays; BADGE_ICON_BY_VARIANT goes
  byModule.set(m[2]!, [...(byModule.get(m[2]!) ?? []), ...names]);
}

const dir = path.join(root, 'contracts/components');
let changed = 0;
const missing: string[] = [];
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  const name = file.replace(/\.json$/, '');
  const names = byModule.get(name);
  if (!names?.length) { missing.push(name); continue; }
  const line = `  "import": ${JSON.stringify(`import { ${names.join(', ')} } from '@helixds/react';`)},`;
  const full = path.join(dir, file);
  const text = fs.readFileSync(full, 'utf8');
  const next = /^  "import": .*,$/m.test(text)
    ? text.replace(/^  "import": .*,$/m, line)
    : text.replace(/^(  "purpose": .*,)$/m, `$1\n${line}`);
  if (next === text) continue;
  changed++;
  if (!check) fs.writeFileSync(full, next);
}

if (missing.length) {
  console.error(`❌ No export in packages/core/src/index.ts for contract(s): ${missing.join(', ')}`);
  process.exit(1);
}
if (check && changed) {
  console.error(`❌ ${changed} contract(s) have an out-of-date import line — run pnpm docs:contract-imports`);
  process.exit(1);
}
console.log(check ? '✅ contract import lines match index.ts' : `✅ contract import lines — ${changed} updated`);
