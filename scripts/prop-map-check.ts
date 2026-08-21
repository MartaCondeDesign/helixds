/**
 * Scans packages/**\/*.tsx for anti-synonym prop names defined in .ai/maps/prop-map.md.
 * Reports violations without blocking CI until REPORT_ONLY is set to false.
 * Run: pnpm verify:props
 */
import fs from 'fs';
import path from 'path';
import { glob } from 'fs/promises';

const REPORT_ONLY = true;

const propMapText = fs.readFileSync(
  path.resolve(import.meta.dirname, '../.ai/maps/prop-map.md'),
  'utf-8',
);

// Parse anti-synonyms from prop-map.md
type AntiSynonymEntry = { canonical: string; invalid: string };
const antiSynonyms: AntiSynonymEntry[] = [];

for (const line of propMapText.split('\n')) {
  const cells = line.split('|').map(s => s.trim()).filter(Boolean);
  if (cells.length < 2) continue;
  const canonicalCell = cells[0] ?? '';
  const invalidCell   = cells[1] ?? '';
  if (!canonicalCell.startsWith('`') || !invalidCell.startsWith('`')) continue;
  const canonical = canonicalCell.replace(/`/g, '');
  const invalids  = invalidCell.replace(/`/g, '').split(',').map(s => s.trim()).filter(Boolean);
  for (const invalid of invalids) {
    // Skip cells with trailing free text (e.g. "2xl (ok in tokens, not in props)") —
    // only backtick-delimited identifiers can ever appear as a prop name in code.
    if (!/^[A-Za-z][\w-]*$/.test(invalid)) continue;
    antiSynonyms.push({ canonical, invalid });
  }
}

// Check prop patterns: prop name used as prop on a JSX element or in a type/interface
function buildPattern(name: string) {
  return [
    new RegExp(`\\b${name}[?]?:\\s`, 'g'),                  // TypeScript interface: name?: type
    new RegExp(`<[A-Z][\\w.]*[^>]*\\s${name}[={\\s]`, 'g'), // JSX prop: <Comp name=
    new RegExp(`['"]${name}['"]\\s*:`, 'g'),                 // Object key: { 'name': ...}
  ];
}

type Violation = { file: string; line: number; invalid: string; canonical: string; snippet: string };
const violations: Violation[] = [];

async function scan() {
  const files: string[] = [];
  for await (const f of glob('packages/**/*.tsx', { cwd: path.resolve(import.meta.dirname, '..') })) {
    files.push(path.resolve(import.meta.dirname, '..', f as string));
  }

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines   = content.split('\n');

    // 'name' is a legitimate native HTML form attribute (distinct from visible label text)
    // whenever the file already references its own 'label' prop — don't flag that false positive.
    const hasRealLabelProp = /\blabel\b/.test(content);

    for (const { canonical, invalid } of antiSynonyms) {
      if (invalid === 'name' && canonical === 'label' && hasRealLabelProp) continue;

      const patterns = buildPattern(invalid);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        for (const pattern of patterns) {
          pattern.lastIndex = 0;
          if (pattern.test(line)) {
            violations.push({
              file:      path.relative(path.resolve(import.meta.dirname, '..'), file),
              line:      i + 1,
              invalid,
              canonical,
              snippet:   line.trim().slice(0, 80),
            });
          }
        }
      }
    }
  }
}

async function main() {
  await scan();

  if (violations.length === 0) {
    console.log(`✅ verify:props — 0 anti-synonym prop names found`);
    process.exit(0);
  }

  console.log(`\n🔤 Prop map check — violations found\n`);
  for (const v of violations) {
    console.log(`❌ ${v.file}:${v.line}`);
    console.log(`   '${v.invalid}' → use '${v.canonical}' (prop-map.md)`);
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
