/**
 * Stability check — computes every component's status from 8 automatic criteria + Figma (ADR-018):
 *
 *   draft   — the component exists and works, but at least one of criteria 1–8 fails
 *   beta    — criteria 1–8 all pass; not modeled in Figma yet
 *   stable  — criteria 1–8 all pass AND contracts/figma-sync.json marks it inFigma
 *
 *   1 contract    a11y section complete, no manifest drift for the component
 *   2 types       contract props present in {Name}.types.ts (verify:types)
 *   3 tokens      no 🆕/🚩 row for the component in component-token-exceptions.md
 *   4 stories     every variant/size value + authored state of the contract appears in its stories,
 *                 and axe finds no violations (other than contrast, see 6) in any of them
 *   5 keyboard    every key listed in a11y.keyboardNav is exercised by a story `play` test, and all pass
 *   6 contrast    no axe color-contrast violation in any story, in light AND dark theme
 *   7 motion      any Motion (JS) animation beyond whileTap press feedback is wrapped in
 *                 <MotionConfig reducedMotion="user"> (CSS motion is covered globally in globals.css)
 *   8 eval        a passing eval prompt imports and checks the component
 *
 * Writes contracts/stability.json, rewrites each contract's "status", then regenerates the manifest.
 * Criteria 4–6 need a running Storybook (default http://localhost:6006): the Storybook test-runner is
 * run first (apps/storybook/.storybook/test-runner.ts), unless --skip-browser reuses the last results.
 *
 * Run: pnpm verify:stable [--url http://localhost:6006] [--skip-browser] [--dry-run] [--details]
 *   --details prints what each failing criterion is missing, per component.
 */
import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { loadPrompts, scorePrompt } from './eval-lib';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const urlIdx = args.indexOf('--url');
const sbUrl = urlIdx !== -1 ? args[urlIdx + 1]! : 'http://localhost:6006';
const skipBrowser = args.includes('--skip-browser');
const dryRun = args.includes('--dry-run');

const sbDir = path.join(root, 'apps/storybook');
const resultsDir = path.join(sbDir, '.test-results');
const a11yDir = path.join(resultsDir, 'a11y');
const jestJson = path.join(resultsDir, 'jest.json');

type Check = { pass: boolean; details: string[] };
type CriterionKey = 'contract' | 'types' | 'tokens' | 'stories' | 'keyboard' | 'contrast' | 'motion' | 'eval';
// label: 1–2 words (Storybook Status column header) · description: its native tooltip.
const CRITERIA: Record<CriterionKey, { label: string; description: string }> = {
  contract: { label: 'Contract', description: 'Contract complete — the a11y section (role, WCAG criteria, keyboard behavior) is filled in and the manifest reports no drift for this component.' },
  types:    { label: 'Types',    description: 'Code matches contract — every prop the contract defines exists in the component’s {Name}.types.ts (pnpm verify:types).' },
  tokens:   { label: 'Tokens',   description: 'Tokens resolved — no value is left as 🆕 or 🚩 in component-token-exceptions.md; everything is a token or a documented ADR exception.' },
  stories:  { label: 'Stories',  description: 'Stories + accessibility — every variant, size and authored state in the contract has a story, and axe (WCAG 2.2 AA) finds no violations in any of them, in a real browser.' },
  keyboard: { label: 'Keyboard', description: 'Keyboard tested — every key the contract lists under keyboardNav has an automated play test in its stories, and all of them pass.' },
  contrast: { label: 'Contrast', description: 'Color contrast AA — no text or icon fails WCAG AA contrast in any story, checked in light mode AND dark mode.' },
  motion:   { label: 'Motion',   description: 'Reduced motion — with the OS “reduce motion” setting on, nothing moves: CSS motion is neutralized globally, and any Motion (JS) animation sits inside <MotionConfig reducedMotion="user">.' },
  eval:     { label: 'Eval',     description: 'Eval — an automated test (evals/prompts) checks that an AI agent asked to build something with this component uses it correctly: right props, no anti-synonyms.' },
};
const FIGMA = { label: 'Figma', description: 'Modeled in Figma (contracts/figma-sync.json) — the one manual step, done on request. Beta + Figma = stable.' };

// ── 0. Browser run (criteria 4–6) ────────────────────────────────────────────
if (!skipBrowser) {
  try {
    execSync(`curl -sf -o /dev/null --max-time 5 ${sbUrl}`);
  } catch {
    console.error(`❌ Storybook isn't reachable at ${sbUrl}. Start it (pnpm sb) or pass --url, or --skip-browser to reuse the last results.`);
    process.exit(1);
  }
  fs.rmSync(resultsDir, { recursive: true, force: true });
  fs.mkdirSync(a11yDir, { recursive: true });
  console.log(`▶ Running the Storybook test-runner against ${sbUrl} (stories, keyboard tests, axe light + dark)…`);
  // Non-zero exit just means some play test failed — that's data for criterion 5, not a crash.
  spawnSync('npx', ['test-storybook', '--url', sbUrl, '--json', '--outputFile', jestJson,
    'stories/Components', 'stories/Layout', '--maxWorkers=4'], { cwd: sbDir, stdio: 'ignore' });
}
if (!fs.existsSync(a11yDir) || !fs.existsSync(jestJson)) {
  console.error('❌ No test-runner results found — run without --skip-browser first.');
  process.exit(1);
}

// ── Shared inputs ────────────────────────────────────────────────────────────
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'contracts/manifest.json'), 'utf-8'));
const figmaSync = JSON.parse(fs.readFileSync(path.join(root, 'contracts/figma-sync.json'), 'utf-8'));
const inFigma = new Set<string>(figmaSync.components.filter((c: any) => c.inFigma).map((c: any) => c.name));

type AxeResult = { id: string; title: string; name: string; violations: Record<'light' | 'dark', { rule: string; nodes: number; help: string }[]> };
const axeResults: AxeResult[] = fs.readdirSync(a11yDir).map(f => JSON.parse(fs.readFileSync(path.join(a11yDir, f), 'utf-8')));

// jest.json: one testResult per story file; assertionResults' ancestorTitles = [title, storyName]
const jest = JSON.parse(fs.readFileSync(jestJson, 'utf-8'));
const failedByTitle = new Map<string, string[]>();
for (const file of jest.testResults ?? []) {
  for (const a of file.assertionResults ?? []) {
    if (a.status === 'failed') {
      const title = a.ancestorTitles?.[0] ?? '';
      failedByTitle.set(title, [...(failedByTitle.get(title) ?? []), a.ancestorTitles?.[1] ?? a.title]);
    }
  }
}

const verifyTypesOut = spawnSync('npx', ['tsx', 'scripts/verify-types.ts'], { cwd: root, encoding: 'utf-8' }).stdout ?? '';
const typesFailing = new Set([...verifyTypesOut.matchAll(/^❌ (\w+)/gm)].map(m => m[1]));

const exceptionsMd = fs.readFileSync(path.join(root, '.ai/maps/component-token-exceptions.md'), 'utf-8');
const autoTable = exceptionsMd.slice(exceptionsMd.indexOf('<!-- AUTO:ASCII_TABLE -->'), exceptionsMd.indexOf('<!-- /AUTO -->'));
const openTokenRows = autoTable.split('\n').filter(l => /🆕|🚩/.test(l) && l.startsWith('|'));

// Eval coverage: components imported from @helix-ds/core by a passing prompt's reference output
// AND named in backticks in its success criteria.
const evalCoverage = new Map<string, string[]>();
for (const p of loadPrompts()) {
  const result = scorePrompt(p, p.expectedOutput);
  if (!result.passed) continue;
  const imported = [...p.expectedOutput.matchAll(/import\s*\{([^}]+)\}\s*from\s*'@helix-ds\/core'/g)]
    .flatMap(m => m[1]!.split(',').map(s => s.trim()).filter(Boolean));
  const criteria = p.successCriteria.join(' ');
  for (const name of imported) {
    if (criteria.includes(`\`${name}\``)) evalCoverage.set(name, [...(evalCoverage.get(name) ?? []), p.id]);
  }
}

// ── Keyboard key extraction (criterion 5) ────────────────────────────────────
// keyboardNav entries are prose ("Arrow Up/Down - opens the menu…"); only the part before the
// first dash names keys. Returns the userEvent snippets a play test must contain for that entry
// (each inner array = "any one of these"). An entry naming no key (e.g. "Handled by the consumer…",
// a mouse-only note) yields nothing to test.
function requiredKeys(entry: string): { label: string; anyOf: string[] }[] {
  const keyPart = entry.split(/\s[—-]\s/)[0]!;
  const out: { label: string; anyOf: string[] }[] = [];
  if (/\bArrow keys\b/i.test(keyPart)) out.push({ label: 'Arrow keys', anyOf: ['{ArrowDown}', '{ArrowRight}', '{ArrowUp}', '{ArrowLeft}'] });
  if (/Arrow Up/i.test(keyPart)) out.push({ label: 'ArrowUp', anyOf: ['{ArrowUp}'] });
  if (/Arrow (Up\/)?Down|Up\/Down/i.test(keyPart)) out.push({ label: 'ArrowDown', anyOf: ['{ArrowDown}'] });
  if (/\bHome\b/.test(keyPart)) out.push({ label: 'Home', anyOf: ['{Home}'] });
  if (/\bEnd\b/.test(keyPart)) out.push({ label: 'End', anyOf: ['{End}'] });
  if (/\bEnter\b/.test(keyPart)) out.push({ label: 'Enter', anyOf: ['{Enter}'] });
  if (/\bSpace\b/.test(keyPart)) out.push({ label: 'Space', anyOf: ['[Space]', '{Space}', "keyboard(' ')"] });
  if (/\bEscape\b/.test(keyPart)) out.push({ label: 'Escape', anyOf: ['{Escape}'] });
  if (/\bTab\b/.test(keyPart)) out.push({ label: 'Tab', anyOf: ['userEvent.tab(', '{Tab}'] });
  return out;
}

// ── Per-component evaluation ─────────────────────────────────────────────────
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

type Row = { name: string; category: string; previousStatus: string; status: string; inFigma: boolean; checks: Record<CriterionKey, Check> };
const rows: Row[] = [];

for (const c of manifest.components) {
  const name: string = c.name;
  const contract = JSON.parse(fs.readFileSync(path.join(root, c.contract), 'utf-8'));
  const storySrc = c.story && fs.existsSync(path.join(root, c.story)) ? fs.readFileSync(path.join(root, c.story), 'utf-8') : '';
  const title = `${c.category === 'layout' ? 'Layout' : 'Components'}/${name}`;
  const stories = axeResults.filter(r => r.title === title);
  const checks = {} as Record<CriterionKey, Check>;

  // 1 contract
  const drift = (manifest.drift ?? []).filter((d: any) => d.component === name).map((d: any) => d.message);
  checks.contract = { pass: c.a11yComplete && drift.length === 0, details: [...drift, ...(c.a11yComplete ? [] : ['a11y section incomplete'])] };

  // 2 types
  checks.types = { pass: !typesFailing.has(name), details: typesFailing.has(name) ? ['verify:types reports errors'] : [] };

  // 3 tokens
  const openRows = openTokenRows.filter(l => l.split('|')[1]!.trim().toLowerCase() === name.toLowerCase());
  checks.tokens = { pass: openRows.length === 0, details: openRows.map(l => l.split('|').slice(1, 5).map(s => s.trim()).join(' ')) };

  // 4 stories + a11y (non-contrast)
  const storyGaps: string[] = [];
  if (!storySrc) storyGaps.push('no story file');
  for (const p of contract.props ?? []) {
    const literals = [...String(p.type).matchAll(/'([^']+)'/g)].map(m => m[1]!);
    const pureUnion = literals.length > 1 && /^('[^']+'\s*\|\s*)+'[^']+'(\s*\|\s*undefined)?$/.test(String(p.type).trim());
    if (!pureUnion) continue;
    for (const v of literals) if (!storySrc.includes(`'${v}'`) && !storySrc.includes(`"${v}"`)) storyGaps.push(`${p.name}="${v}" not shown`);
  }
  for (const s of contract.states?.authored ?? []) {
    const stateName = typeof s === 'string' ? s : s.name;
    if (!new RegExp(`\\b${stateName}\\b`).test(storySrc)) storyGaps.push(`state "${stateName}" not shown`);
  }
  if (stories.length === 0) storyGaps.push('no browser results for its stories');
  for (const r of stories) for (const theme of ['light', 'dark'] as const)
    for (const v of r.violations[theme]) if (v.rule !== 'color-contrast') storyGaps.push(`axe ${v.rule} (${theme}) in "${r.name}"`);
  checks.stories = { pass: storyGaps.length === 0, details: [...new Set(storyGaps)] };

  // 5 keyboard
  const kbGaps: string[] = [];
  const playSrc = storySrc.includes('play:') ? storySrc : '';
  for (const entry of contract.a11y?.keyboardNav ?? []) {
    for (const k of requiredKeys(entry)) if (!k.anyOf.some(s => playSrc.includes(s))) kbGaps.push(`no play test for ${k.label}`);
  }
  for (const failed of failedByTitle.get(title) ?? []) kbGaps.push(`play test failing in "${failed}"`);
  checks.keyboard = { pass: kbGaps.length === 0, details: [...new Set(kbGaps)] };

  // 6 contrast
  const contrastGaps: string[] = [];
  for (const r of stories) for (const theme of ['light', 'dark'] as const)
    for (const v of r.violations[theme]) if (v.rule === 'color-contrast') contrastGaps.push(`${theme}: "${r.name}" (${v.nodes} element${v.nodes === 1 ? '' : 's'})`);
  checks.contrast = { pass: contrastGaps.length === 0, details: contrastGaps };

  // 7 reduced motion — JS (Motion) animations only; CSS motion is neutralized globally
  const implDir = c.implementation ? path.join(root, c.implementation) : '';
  const implFiles = implDir && fs.existsSync(implDir) ? fs.readdirSync(implDir).filter(f => f.endsWith('.tsx')).map(f => fs.readFileSync(path.join(implDir, f), 'utf-8')) : [];
  const motionGaps: string[] = [];
  for (const src of implFiles) {
    if (!/from 'motion\/react'/.test(src)) continue;
    const animatesBeyondPress = /\b(animate|initial|exit|layoutId|layout)=/.test(src);
    if (animatesBeyondPress && !src.includes('reducedMotion="user"')) motionGaps.push('Motion animation without <MotionConfig reducedMotion="user">');
  }
  checks.motion = { pass: motionGaps.length === 0, details: motionGaps };

  // 8 eval
  const evals = evalCoverage.get(name) ?? [];
  checks.eval = { pass: evals.length > 0, details: evals.length ? [] : ['no passing eval imports and checks it'] };

  const allPass = Object.values(checks).every(ch => ch.pass);
  const figma = inFigma.has(name);
  const status = contract.status === 'deprecated' ? 'deprecated' : !allPass ? 'draft' : figma ? 'stable' : 'beta';
  rows.push({ name, category: c.category, previousStatus: contract.status, status, inFigma: figma, checks });
}

// ── Report ───────────────────────────────────────────────────────────────────
rows.sort((a, b) => a.name.localeCompare(b.name));
const keys = Object.keys(CRITERIA) as CriterionKey[];
console.log(`\n${'Component'.padEnd(18)}${keys.map((_, i) => String(i + 1).padStart(3)).join('')}  Figma  Status`);
for (const r of rows) {
  const marks = keys.map(k => (r.checks[k].pass ? '  ✓' : '  ✗')).join('');
  const change = r.previousStatus !== r.status ? `  (was ${r.previousStatus})` : '';
  console.log(`${r.name.padEnd(18)}${marks}    ${r.inFigma ? '✓' : '✗'}    ${r.status}${change}`);
}
console.log(`\n${keys.map((k, i) => `${i + 1} ${CRITERIA[k].label}`).join(' · ')}`);
const counts = rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
console.log(`\n${Object.entries(counts).map(([s, n]) => `${s} ${n}`).join(' · ')}`);

if (args.includes('--details')) {
  console.log('');
  for (const r of rows) for (const k of keys) if (!r.checks[k].pass) console.log(`${r.name} · ${CRITERIA[k].label}: ${r.checks[k].details.join('; ')}`);
}

if (dryRun) {
  console.log('\n(--dry-run: nothing written)');
  process.exit(0);
}

// ── Write ────────────────────────────────────────────────────────────────────
fs.writeFileSync(path.join(root, 'contracts/stability.json'), JSON.stringify({
  $comment: 'Generated by scripts/verify-stable.ts — do not hand-edit. Run `pnpm verify:stable`. Criteria: docs/ADR/ADR-018-stability-criteria.md.',
  generatedAt: new Date().toISOString(),
  criteria: CRITERIA,
  figma: FIGMA,
  components: rows,
}, null, 2) + '\n');

for (const r of rows) {
  if (r.previousStatus === r.status) continue;
  const contractPath = path.join(root, manifest.components.find((c: any) => c.name === r.name).contract);
  const src = fs.readFileSync(contractPath, 'utf-8');
  fs.writeFileSync(contractPath, src.replace(/("status":\s*")[a-z]+(")/, `$1${r.status}$2`));
}
execSync('npx tsx scripts/generate-component-manifest.ts', { cwd: root, stdio: 'ignore' });
console.log('\n✅ contracts/stability.json written, contract statuses updated, manifest regenerated.');
