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

// Motion (motion/react, ADR-007) has its own animation-target vocabulary — `scale`, `type`
// (spring vs tween), `drag`, etc. — set inside `initial`/`animate`/`exit`/`whileTap`/
// `whileHover`/`whileFocus`/`whileInView`/`transition` object literals. Those are Motion's own
// keys, not Helix component props, so they can't be renamed to satisfy prop-map.md — a line that
// sets one of MOTION_ANTI_SYNONYMS inside one of these containers isn't a real violation. Every
// current usage is a single-line object literal (see Button/Chip/FAB/IconButton), so a per-line
// check is enough; this isn't a general JS parser.
const MOTION_CONTAINERS = /\b(animate|initial|exit|whileTap|whileHover|whileFocus|whileDrag|whileInView|transition)\b/;
const MOTION_ANTI_SYNONYMS = new Set(['scale', 'type', 'drag']);

function isMotionAnimationLine(line: string, invalid: string): boolean {
  return MOTION_ANTI_SYNONYMS.has(invalid) && MOTION_CONTAINERS.test(line);
}

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
        // A `//`-comment line only ever mentions a prop name in prose (e.g. explaining a
        // deliberate choice) — never an actual usage worth flagging.
        if (line.trim().startsWith('//')) continue;
        if (isMotionAnimationLine(line, invalid)) continue;
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
