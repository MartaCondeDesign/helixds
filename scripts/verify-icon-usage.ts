/**
 * Scans packages/**\/*.tsx for a Tabler icon rendered directly as a JSX element
 * (e.g. `<IconPlus size={16} />`) instead of going through the Icon component
 * (`<Icon icon={IconPlus} size={16} />`). See contracts/components/Icon.json and
 * CLAUDE.md → "Critical rules" for why: sizing/stroke/color/aria all live in one
 * place instead of being re-implemented (and drifting) at every call site.
 *
 * packages/core/src/components/Icon/** is exempt — that's the one place a raw
 * Tabler icon component legitimately gets rendered.
 *
 * Reports violations without blocking CI until REPORT_ONLY is set to false.
 * Run: pnpm verify:icons
 */
import fs from 'fs';
import path from 'path';
import { glob } from 'fs/promises';

const REPORT_ONLY = true;

const ICON_JSX_PATTERN = /<Icon[A-Z]\w*[\s/>]/;
const EXEMPT_DIR = path.join('packages', 'core', 'src', 'components', 'Icon');

type Violation = { file: string; line: number; snippet: string };
const violations: Violation[] = [];

async function scan() {
  for await (const f of glob('packages/**/*.tsx', { cwd: path.resolve(import.meta.dirname, '..') })) {
    const relPath = f as string;
    if (relPath.startsWith(EXEMPT_DIR)) continue;

    const fullPath = path.resolve(import.meta.dirname, '..', relPath);
    const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      if (ICON_JSX_PATTERN.test(line)) {
        violations.push({ file: relPath, line: i + 1, snippet: line.trim().slice(0, 90) });
      }
    }
  }
}

async function main() {
  await scan();

  if (violations.length === 0) {
    console.log('✅ verify:icons — every Tabler icon renders through the Icon component');
    process.exit(0);
  }

  console.log('\n🎨 Icon usage check — violations found\n');
  for (const v of violations) {
    console.log(`❌ ${v.file}:${v.line}`);
    console.log(`   Raw Tabler icon rendered directly — wrap it in <Icon icon={...} /> instead.`);
    console.log(`   ${v.snippet}\n`);
  }

  console.log(`Total: ${violations.length} violation(s)`);

  if (REPORT_ONLY) {
    console.log('\n(report-only mode)');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main();
