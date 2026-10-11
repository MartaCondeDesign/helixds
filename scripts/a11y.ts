/**
 * Accessibility, check by check, component by component — code only (Figma isn't involved).
 *
 *   pnpm a11y                      every check, every component (runs the browser once)
 *   pnpm a11y:<check> [Name,…]     one check, all or some components — e.g. pnpm a11y:focus-visible Button,Select
 *   flags: --cached (reuse the last browser results instead of re-running) · --url http://localhost:6006
 *
 * Checks (each also `pnpm a11y:<id>`):
 *   contract       role, WCAG criteria, and keys for interactive components in the contract's a11y section
 *   keys           a play test presses every key the contract lists
 *   focus-return   when Escape closes something, a play test asserts where focus lands (2.4.3)
 *   keyboard       those play tests pass in a real browser (2.1.1)
 *   axe            axe (WCAG 2.2 AA rules) finds nothing in any story, light and dark — contrast apart
 *   contrast       text contrast AA in every story, light AND dark (1.4.3)
 *   focus-visible  every Tab stop looks different when focused, light and dark (2.4.7)
 *   target-size    every target ≥ 24×24 px or spaced like one (2.5.8)
 *   reflow         no horizontal scroll at 320 px — Layout components only (1.4.10)
 *   screen-reader  a screen reader hears the role the contract promises (ariaSnapshot, 4.1.2)
 *   ai-visual      advisory: the last `pnpm a11y:visual` review found nothing to confirm
 *   human          a person reviewed it with a real screen reader (`pnpm a11y:review`)
 *
 * Statuses: pass · fail · n/a (doesn't apply) · pending (not run / not reviewed yet). The reviews (ai-visual,
 * human) never fail the command — they're judgement, recorded for people. Results are merged into
 * quality/accessibility.json, which the Storybook page Data/Accessibility shows.
 */
import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { staticA11yIssues } from './a11y-contract-rules.ts';
import { expectedRoles, rolesIn } from './aria-roles.ts';

type Status = 'pass' | 'fail' | 'n/a' | 'pending';
type Result = { status: Status; details: string[] };
type CheckDef = { id: string; label: string; wcag: string; kind: 'static' | 'browser' | 'review'; how: string };

export const CHECKS: CheckDef[] = [
  { id: 'contract', label: 'Contract', wcag: '4.1.2', kind: 'static', how: 'The contract’s a11y section names the role and the WCAG criteria, and an interactive component lists its keys.' },
  { id: 'keys', label: 'Keys tested', wcag: '2.1.1', kind: 'static', how: 'A play test presses every key the contract lists.' },
  { id: 'focus-return', label: 'Focus return', wcag: '2.4.3', kind: 'static', how: 'When Escape closes something, a play test asserts where focus lands.' },
  { id: 'keyboard', label: 'Keyboard', wcag: '2.1.1', kind: 'browser', how: 'Those play tests pass in a real browser.' },
  { id: 'axe', label: 'axe', wcag: '2.2 AA', kind: 'browser', how: 'axe finds no violation in any story, light and dark (contrast is its own check).' },
  { id: 'contrast', label: 'Contrast', wcag: '1.4.3', kind: 'browser', how: 'Text contrast AA in every story, in light AND dark.' },
  { id: 'focus-visible', label: 'Focus visible', wcag: '2.4.7', kind: 'browser', how: 'Tabbing through each story, every stop looks different focused vs unfocused (pixel comparison), light and dark.' },
  { id: 'target-size', label: 'Target size', wcag: '2.5.8', kind: 'browser', how: 'Every pointer target is at least 24×24 px, or has a 24 px circle free of other targets.' },
  { id: 'reflow', label: 'Reflow', wcag: '1.4.10', kind: 'browser', how: 'At 320 px wide nothing scrolls sideways. Layout components only — a component story’s demo box isn’t a page.' },
  { id: 'screen-reader', label: 'Screen reader', wcag: '4.1.2', kind: 'browser', how: 'The accessibility tree of its stories (Playwright ariaSnapshot) contains the role the contract promises.' },
  { id: 'ai-visual', label: 'AI visual', wcag: 'advisory', kind: 'review', how: 'An AI look at screenshots: color-only meaning, non-text contrast, label in name, clipped text, focus clarity. Advisory — a person confirms.' },
  { id: 'human', label: 'Human review', wcag: 'manual', kind: 'review', how: 'A person used it with a real screen reader and recorded it in the contract.' },
];

const root = path.resolve(import.meta.dirname, '..');
const sbDir = path.join(root, 'apps/storybook');
const a11yDir = path.join(sbDir, '.test-results/a11y');
const playFile = path.join(sbDir, '.test-results/a11y-play.json'); // title → failing story names, merged across runs
const jestJson = path.join(sbDir, '.test-results/jest.json');        // written by verify:stable's full run
const outFile = path.join(root, 'quality/accessibility.json');

const args = process.argv.slice(2);
const opt = (n: string) => { const i = args.indexOf(n); return i === -1 ? undefined : args[i + 1]; };
const sbUrl = opt('--url') ?? 'http://localhost:6006';
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--url');
const checkArg = positional[0] ?? 'all';
const checks = checkArg === 'all' ? CHECKS : CHECKS.filter(c => c.id === checkArg);
if (!checks.length) {
  console.error(`Unknown check "${checkArg}". One of: all, ${CHECKS.map(c => c.id).join(', ')}`);
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'contracts/manifest.json'), 'utf8'));
const allComponents: { name: string; category: string; contract: string; story?: string }[] = manifest.components;
const wanted = (positional[1] ?? '').split(',').filter(Boolean);
const components = wanted.length ? allComponents.filter(c => wanted.includes(c.name)) : allComponents;
const unknown = wanted.filter(w => !allComponents.some(c => c.name === w));
if (unknown.length) { console.error(`Unknown component(s): ${unknown.join(', ')}`); process.exit(1); }
const titleOf = (c: { name: string; category: string }) => `${c.category === 'layout' ? 'Layout' : 'Components'}/${c.name}`;

// ── Browser run (only the checks that need it, only the components asked for) ──
if (checks.some(c => c.kind === 'browser') && !args.includes('--cached')) {
  try { execSync(`curl -sf -o /dev/null --max-time 5 ${sbUrl}`); } catch {
    console.error(`❌ Storybook isn't reachable at ${sbUrl}. Start it (pnpm sb), or pass --cached to reuse the last results.`);
    process.exit(1);
  }
  const files = components.map(c => c.story).filter((s): s is string => !!s).map(s => path.relative(sbDir, path.join(root, s)));
  // Drop this run's components' old results so a story that no longer exists can't linger as a pass.
  fs.mkdirSync(a11yDir, { recursive: true });
  const titles = new Set(components.map(titleOf));
  for (const f of fs.readdirSync(a11yDir)) {
    try { if (titles.has(JSON.parse(fs.readFileSync(path.join(a11yDir, f), 'utf8')).title)) fs.rmSync(path.join(a11yDir, f)); } catch { /* unreadable: overwritten below */ }
  }
  console.log(`▶ Browser run: ${components.length} component(s) against ${sbUrl}…`);
  const run = spawnSync('npx', ['test-storybook', '--url', sbUrl, '--json', ...files, '--maxWorkers=4'],
    { cwd: sbDir, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  const report = (run.stdout ?? '').split('\n').find(l => l.startsWith('{"num'));
  const play: Record<string, string[]> = fs.existsSync(playFile) ? JSON.parse(fs.readFileSync(playFile, 'utf8')) : {};
  for (const t of titles) play[t] = [];
  for (const file of report ? JSON.parse(report).testResults ?? [] : [])
    for (const a of file.assertionResults ?? [])
      if (a.status === 'failed') { const t = a.ancestorTitles?.[0] ?? ''; play[t] = [...(play[t] ?? []), a.ancestorTitles?.[1] ?? a.title]; }
  fs.writeFileSync(playFile, JSON.stringify(play, null, 2));
}

// ── Inputs ─────────────────────────────────────────────────────────────────
type StoryResult = {
  title: string; name: string;
  violations: Record<'light' | 'dark', { rule: string; nodes: number; help: string }[]>;
  focusVisible?: Record<'light' | 'dark', { element: string }[]>;
  targetSize?: { element: string; width: number; height: number }[];
  reflow?: { element: string; overflowPx: number }[];
  aria?: string;
};
const storyResults: StoryResult[] = fs.existsSync(a11yDir)
  ? fs.readdirSync(a11yDir).map(f => JSON.parse(fs.readFileSync(path.join(a11yDir, f), 'utf8'))) : [];
const playFailures: Record<string, string[]> = fs.existsSync(playFile) ? JSON.parse(fs.readFileSync(playFile, 'utf8')) : {};
// Fall back to verify:stable's full run for components never run through `pnpm a11y`.
const jestFailures = new Map<string, string[]>();
if (fs.existsSync(jestJson)) for (const file of JSON.parse(fs.readFileSync(jestJson, 'utf8')).testResults ?? [])
  for (const a of file.assertionResults ?? []) if (a.status === 'failed') {
    const t = a.ancestorTitles?.[0] ?? ''; jestFailures.set(t, [...(jestFailures.get(t) ?? []), a.ancestorTitles?.[1] ?? a.title]);
  }

const verdict = (issues: string[] | null): Result => issues === null ? { status: 'n/a', details: [] } : { status: issues.length ? 'fail' : 'pass', details: [...new Set(issues)] };

function evaluate(c: typeof allComponents[number], check: CheckDef): Result {
  const contract = JSON.parse(fs.readFileSync(path.join(root, c.contract), 'utf8'));
  const storySrc = c.story && fs.existsSync(path.join(root, c.story)) ? fs.readFileSync(path.join(root, c.story), 'utf8') : '';
  if (check.kind === 'static') return verdict(staticA11yIssues(contract, storySrc)[check.id as 'contract' | 'keys' | 'focus-return']);

  if (check.id === 'ai-visual') {
    const f = path.join(root, '.ai/a11y-visual', `${c.name}.json`);
    if (!fs.existsSync(f)) return { status: 'pending', details: [`not reviewed — pnpm a11y:visual ${c.name}`] };
    const r = JSON.parse(fs.readFileSync(f, 'utf8'));
    const findings = r.answers.filter((a: any) => a.pass === false).map((a: any) => `${a.id} (${a.wcag}): ${a.reason}`);
    return { status: findings.length ? 'fail' : 'pass', details: [`${r.reviewedAt.slice(0, 10)} · ${r.model}`, ...findings] };
  }
  if (check.id === 'human') {
    const last = (contract.a11y?.humanReview ?? []).at(-1);
    if (!last) return { status: 'pending', details: [`not reviewed — pnpm a11y:review ${c.name} --by "<who>" --with "<screen reader + browser>" --result pass|issues`] };
    return { status: last.result === 'issues' ? 'fail' : 'pass', details: [`${last.date} · ${last.by} · ${last.with}${last.notes ? ` · ${last.notes}` : ''}`] };
  }

  // Browser checks
  const title = titleOf(c);
  const stories = storyResults.filter(r => r.title === title);
  if (!stories.length) return { status: 'pending', details: ['no browser results yet — run without --cached'] };
  const both = ['light', 'dark'] as const;
  switch (check.id) {
    case 'keyboard': {
      if (staticA11yIssues(contract, storySrc).keys === null) return { status: 'n/a', details: ['no keys in the contract'] };
      const failed = playFailures[title] ?? jestFailures.get(title) ?? [];
      return verdict(failed.map(s => `play test failing in "${s}"`));
    }
    case 'axe':
      return verdict(stories.flatMap(r => both.flatMap(t => r.violations[t].filter(v => v.rule !== 'color-contrast').map(v => `${v.rule} (${t}) in "${r.name}": ${v.help}`))));
    case 'contrast':
      return verdict(stories.flatMap(r => both.flatMap(t => r.violations[t].filter(v => v.rule === 'color-contrast').map(v => `${t}: "${r.name}" (${v.nodes} element${v.nodes === 1 ? '' : 's'})`))));
    case 'focus-visible':
      return verdict(stories.flatMap(r => both.flatMap(t => (r.focusVisible?.[t] ?? []).map(f => `${f.element} (${t}) in "${r.name}"`))));
    case 'target-size':
      return verdict(stories.flatMap(r => (r.targetSize ?? []).map(t => `${t.element} is ${t.width}×${t.height}px in "${r.name}"`)));
    case 'reflow':
      if (c.category !== 'layout') return { status: 'n/a', details: [] };
      return verdict(stories.flatMap(r => (r.reflow ?? []).map(f => `${f.element} overflows by ${f.overflowPx}px in "${r.name}"`)));
    case 'screen-reader': {
      if (!stories.some(r => r.aria !== undefined)) return { status: 'pending', details: ['results predate the screen-reader check — run without --cached'] };
      const heard = new Set(stories.flatMap(r => [...rolesIn(r.aria ?? '')]));
      const want = expectedRoles(contract.a11y);
      if (!want.length) return { status: 'n/a', details: ['announces no role of its own (contract a11y.announces: [])'] };
      return verdict(want.filter(r => !heard.has(r)).map(r => `never heard role "${r}" (heard: ${[...heard].sort().join(', ') || 'nothing'})`));
    }
  }
  return { status: 'pending', details: [] };
}

// ── Evaluate, merge, report ────────────────────────────────────────────────
const previous = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : { components: {} };
const results: Record<string, Record<string, Result & { checkedAt: string }>> = previous.components ?? {};
const now = new Date().toISOString();
for (const c of components) {
  results[c.name] ??= {};
  for (const check of checks) results[c.name]![check.id] = { ...evaluate(c, check), checkedAt: now };
}
// Components that no longer exist drop out.
for (const name of Object.keys(results)) if (!allComponents.some(c => c.name === name)) delete results[name];

const commit = execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim();
const summary = CHECKS.map(ch => {
  const statuses = allComponents.map(c => results[c.name]?.[ch.id]?.status ?? 'pending');
  const count = (s: Status) => statuses.filter(x => x === s).length;
  return { id: ch.id, pass: count('pass'), fail: count('fail'), na: count('n/a'), pending: count('pending') };
});
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify({
  $comment: 'Generated by pnpm a11y (scripts/a11y.ts) — do not hand-edit.',
  generatedAt: now, commit, checks: CHECKS.map(c => ({ ...c, command: `pnpm a11y:${c.id}` })), summary,
  components: Object.fromEntries(allComponents.map(c => [c.name, results[c.name] ?? {}])),
}, null, 2) + '\n');

// Table: one row per component, one column per check that ran.
const mark: Record<Status, string> = { pass: '✓', fail: '✗', 'n/a': '–', pending: '·' };
const w = Math.max('Component'.length, ...components.map(c => c.name.length)) + 2;
console.log(`\n${'Component'.padEnd(w)}${checks.map(c => c.label.padEnd(Math.max(c.label.length, 3) + 2)).join('')}`);
for (const c of components) console.log(`${c.name.padEnd(w)}${checks.map(ch => mark[results[c.name]![ch.id]!.status].padEnd(Math.max(ch.label.length, 3) + 2)).join('')}`);
console.log('\n✓ pass · ✗ fail · – doesn’t apply · · pending\n');
for (const ch of checks) {
  const s = summary.find(x => x.id === ch.id)!;
  const fails = components.filter(c => results[c.name]![ch.id]!.status === 'fail');
  console.log(`${ch.label} (${ch.wcag}): ${s.pass} pass · ${s.fail} fail · ${s.na} n/a · ${s.pending} pending`);
  for (const c of fails) for (const d of results[c.name]![ch.id]!.details.slice(0, 4)) console.log(`   ${c.name}: ${d}`);
}
console.log(`\nquality/accessibility.json updated · Storybook: Data/Accessibility`);
const blocking = checks.filter(c => c.kind !== 'review').some(ch => components.some(c => results[c.name]![ch.id]!.status === 'fail'));
process.exit(blocking ? 1 : 0);
