/**
 * Validates packages/tokens/src/tokens.json against the naming rules documented in
 * packages/tokens/CLAUDE.md ("Semantic naming vocabulary"). Only checks the semantic
 * and component layers — the primitive layer (blue/gray/red/...) is exempt by design.
 *
 * Scope: the clear-cut, no-judgment-call rules, PLUS one relational check that used to be
 * undocumented-as-code — whether a `-light`/`-dark`/`-lightest`/`-darkest` modifier is
 * correct relative to its role's base tone and siblings (checkRelativeLightness, added
 * 2026-08-25). Everything else stays a human call: e.g. whether a role even NEEDS a
 * `-light` tier in the first place isn't something this script infers.
 *
 * Report violations — does NOT gate yet. Run: pnpm verify:tokens
 * To promote to gate: change REPORT_ONLY to false.
 */
import fs from 'fs';
import path from 'path';
import { checkKeyNaming, checkIconAliasNaming, checkOpacityStep, checkRelativeLightness } from './token-naming-lib';

const REPORT_ONLY = true;

const tokensPath = path.resolve(import.meta.dirname, '../packages/tokens/src/tokens.json');
const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));

type Issue = { path: string; message: string; severity: 'error' | 'warn' };
const issues: Issue[] = [];

function walk(node: unknown, pathParts: string[]): void {
  if (node === null || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  if ('$value' in obj) return; // leaf token — key already checked by the caller

  for (const [key, child] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    const fullPath = [...pathParts, key].join('.');

    for (const message of checkKeyNaming(key)) {
      issues.push({ path: fullPath, message, severity: 'error' });
    }

    if (child && typeof child === 'object' && '$value' in (child as Record<string, unknown>)) {
      const value = (child as { $value: unknown }).$value;
      for (const message of checkIconAliasNaming(pathParts, value)) {
        issues.push({ path: fullPath, message, severity: 'error' });
      }
      for (const message of checkOpacityStep(key, value)) {
        issues.push({ path: fullPath, message, severity: 'error' });
      }
    }

    walk(child, [...pathParts, key]);
  }
}

walk(tokens.semantic, ['semantic']);
walk(tokens.component, ['component']);

for (const message of checkRelativeLightness(tokens)) {
  issues.push({ path: 'semantic.color', message, severity: 'error' });
}

// ── Report ────────────────────────────────────────────────────────────────────

if (issues.length === 0) {
  console.log('✅ verify:tokens — naming matches packages/tokens/CLAUDE.md, 0 issues');
  process.exit(0);
}

console.log(`\n🏷️  Token naming check — ${issues.length} issue(s)\n`);
for (const issue of issues) {
  const icon = issue.severity === 'error' ? '❌' : '⚠️';
  console.log(`${icon} ${issue.path}`);
  console.log(`   ${issue.message}\n`);
}

const errors = issues.filter(i => i.severity === 'error');
console.log(`Summary: ${errors.length} error(s)`);

if (REPORT_ONLY) {
  console.log('\n(report-only mode — not blocking CI)');
  process.exit(0);
} else {
  process.exit(errors.length > 0 ? 1 : 0);
}
