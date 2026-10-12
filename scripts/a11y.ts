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
 * Score: per component, the % of automatic checks that apply to it and pass (pending counts as not passed;
 * reviews aren't scored); the Accessibility score is their average, and feeds Design System Health.
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
// `pnpm a11y Chart` = every check on Chart (the first word is a component, not a check)
if (positional[0] && positional[0] !== 'all' && !CHECKS.some(c => c.id === positional[0])) positional.unshift('all');
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
// Score per component: share of the automatic checks that apply to it (n/a left out) and pass. Reviews
// (AI visual, human) are judgement and aren't scored — an unreviewed component would otherwise sink the
// score for a step that isn't automatic. A check not run yet (pending) counts as not passed: no evidence,
// no points. `meetsMinimum` = every automatic check that applies passes.
const scored = CHECKS.filter(ch => ch.kind !== 'review');
const scores = Object.fromEntries(allComponents.map(c => {
  const applicable = scored.filter(ch => (results[c.name]?.[ch.id]?.status ?? 'pending') !== 'n/a');
  const passed = applicable.filter(ch => results[c.name]?.[ch.id]?.status === 'pass').length;
  return [c.name, { score: applicable.length ? Math.round((passed / applicable.length) * 100) : null, passed, applicable: applicable.length, meetsMinimum: passed === applicable.length }];
}));
const valid = Object.values(scores).map(x => x.score).filter((x): x is number => x !== null);
const overall = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify({
  $comment: 'Generated by pnpm a11y (scripts/a11y.ts) — do not hand-edit.',
  generatedAt: now, commit, checks: CHECKS.map(c => ({ ...c, command: `pnpm a11y:${c.id}` })), summary,
  score: overall, meetsMinimum: Object.values(scores).filter(x => x.meetsMinimum).length, scores,
  components: Object.fromEntries(allComponents.map(c => [c.name, results[c.name] ?? {}])),
}, null, 2) + '\n');

// Daily history (quality/accessibility-history.json): one entry per day — the state after that day's last run —
// so the Storybook page can show any day and what changed since the day before.
const historyFile = path.join(root, 'quality/accessibility-history.json');
type HistoryDay = { date: string; commit: string; generatedAt: string; score: number | null; meetsMinimum: number; components: Record<string, { score: number | null; checks: Record<string, Status> }> };
const history: HistoryDay[] = fs.existsSync(historyFile) ? JSON.parse(fs.readFileSync(historyFile, 'utf8')) : [];
const today: HistoryDay = {
  date: now.slice(0, 10), commit, generatedAt: now, score: overall,
  meetsMinimum: Object.values(scores).filter(x => x.meetsMinimum).length,
  components: Object.fromEntries(allComponents.map(c => [c.name, { score: scores[c.name]!.score, checks: Object.fromEntries(CHECKS.map(ch => [ch.id, results[c.name]?.[ch.id]?.status ?? 'pending'])) }])),
};
fs.writeFileSync(historyFile, JSON.stringify([...history.filter(d => d.date !== today.date), today].sort((a, b) => a.date.localeCompare(b.date)), null, 2) + '\n');

// ── What each component APPLIES (a11y.applied) ─────────────────────────────────────────────────────────
// Not pass/fail: the accessibility layer itself, so the contract says what the component does — read from the
// real code, never hand-written. Focus from the CSS rules of its parts; ARIA, contrast and target sizes as
// rendered in its stories (test-runner → a11y-extra-checks.ts collectAria/collectContrast/collectTargets);
// what a screen reader announces from the stories' ariaSnapshot; motion from the CSS + implementation.
type StoryApplied = { aria: { part: string; attribute: string; value: string }[]; contrast: Record<string, { part: string; variant: string; ratio: number; fg: string; bg: string }[]>; targets: { part: string; variant: string; width: number; height: number }[] };
const css = fs.readFileSync(path.join(root, 'packages/core/src/globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const cssRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ selector: m[1]!.trim().replace(/\s+/g, ' '), body: m[2]! }));
const decl = (body: string, prop: string) => body.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`))?.[1]?.trim();
const globalFocus = cssRules.find(r => r.selector === ':focus-visible');
// data-helix-part → the component whose contract lists it
const partOwner = new Map<string, string>();
for (const comp of allComponents) for (const a of JSON.parse(fs.readFileSync(path.join(root, comp.contract), 'utf8')).anatomy ?? []) partOwner.set(a.part, comp.name);

function appliedFor(c: typeof allComponents[number], contract: any) {
  const parts: string[] = (contract.anatomy ?? []).map((a: { part: string }) => a.part);
  const inParts = (p: string) => parts.includes(p);
  const stories = storyResults.filter(r => r.title === titleOf(c)) as (StoryResult & { applied?: StoryApplied })[];
  if (!stories.some(r => r.applied)) return null;

  // Focus: every rule of its parts that styles a focused state, with the tokens it uses.
  const focus = cssRules
    .filter(r => /:focus|:has\([^)]*:focus/.test(r.selector) && parts.some(p => r.selector.includes(`"${p}"`)))
    .map(r => {
      const part = parts.find(p => r.selector.includes(`"${p}"`))!;
      const props = Object.fromEntries(['outline', 'outline-offset', 'box-shadow', 'border-color', 'background-color']
        .map(k => [k, decl(r.body, k)]).filter(([, v]) => v));
      return { part, when: r.selector.match(/:focus-visible|:focus-within|:focus/)?.[0] ?? ':focus', ...props };
    })
    .filter(f => Object.keys(f).length > 2);
  const interactive = stories.some(r => (r.applied?.targets ?? []).some(t => inParts(t.part)));
  // Controls inside it that belong to other Helix components (Modal's close IconButton, CheckboxGroup's
  // Checkboxes): their focus, size and name are those components' own layer — say which, don't repeat it.
  const delegatedTo = [...new Set(stories.flatMap(r => (r.applied?.targets ?? []).filter(t => !inParts(t.part)).map(t => partOwner.get(t.part)).filter((o): o is string => !!o && o !== c.name)))].sort();
  const focusOut = focus.length ? focus
    : delegatedTo.length ? [{ part: '(its inner controls)', delegatedTo, note: `focus is drawn by ${delegatedTo.join(', ')} — see their a11y.applied.focus` }]
    : interactive && globalFocus ? [{ part: '(any focusable element)', when: ':focus-visible', inherited: 'global rule', outline: decl(globalFocus.body, 'outline'), 'outline-offset': decl(globalFocus.body, 'outline-offset') }]
    : [];

  // ARIA: attribute → values seen (ids shown as "(id)", so the list stays stable between runs).
  const aria: Record<string, Record<string, string[]>> = {};
  for (const r of stories) for (const x of r.applied?.aria ?? []) {
    if (!inParts(x.part)) continue;
    const v = /^(:r|helix-|radix-|[a-z]+-\d+$)|-\d+$|option-/.test(x.value) && /\d/.test(x.value) ? '(id)' : x.value;
    const list = ((aria[x.part] ??= {})[x.attribute] ??= []);
    if (!list.includes(v) && list.length < 4) list.push(v);
  }

  // Contrast: per part (and variant), the lowest measured ratio in each theme.
  const contrast: Record<string, Record<string, string>> = {};
  for (const theme of ['light', 'dark'] as const) {
    const lowest = new Map<string, { ratio: number; fg: string; bg: string }>();
    for (const r of stories) for (const x of r.applied?.contrast?.[theme] ?? []) {
      if (!inParts(x.part)) continue;
      const key = x.variant ? `${x.part} (${x.variant})` : x.part;
      if (!lowest.has(key) || x.ratio < lowest.get(key)!.ratio) lowest.set(key, x);
    }
    for (const [key, x] of lowest) (contrast[key] ??= {})[theme] = `${x.ratio}:1 — ${x.fg} on ${x.bg}`;
  }

  // Target size: the smallest box a pointer can hit, per part.
  const targetSize: Record<string, string> = {};
  for (const r of stories) for (const x of r.applied?.targets ?? []) {
    if (!inParts(x.part)) continue;
    const [w, h] = (targetSize[x.part]?.match(/\d+/g) ?? ['9999', '9999']).map(Number);
    targetSize[x.part] = `smallest ${Math.min(w!, x.width)}×${Math.min(h!, x.height)} px`;
  }

  // What a screen reader announces: the component's own role lines from its stories.
  const want = expectedRoles(contract.a11y);
  const announced = [...new Set(stories.flatMap(r => (r.aria ?? '').split('\n').map(l => l.trim().replace(/^- /, '').replace(/:$/, ''))
    .filter(l => want.some(role => l.startsWith(`${role} `) || l === role))))].slice(0, 5);

  // Motion: CSS motion is neutralised globally; JS motion must sit in MotionConfig reducedMotion="user".
  const implDir = path.join(root, `packages/core/src/${c.category === 'layout' ? 'layout' : 'components'}/${c.name}`);
  const impl = fs.existsSync(implDir) ? fs.readdirSync(implDir).filter(f => f.endsWith('.tsx')).map(f => fs.readFileSync(path.join(implDir, f), 'utf8')).join('\n') : '';
  const motion = [
    'CSS transitions/animations: neutralised by the global prefers-reduced-motion rule',
    ...(/from 'motion\/react'/.test(impl) ? [impl.includes('reducedMotion="user"') ? 'Motion (JS): inside <MotionConfig reducedMotion="user">' : 'Motion (JS): press feedback only (whileTap)'] : []),
  ];

  return {
    nativeElement: contract.anatomy?.[0]?.element ?? null,
    ...(delegatedTo.length ? { innerComponents: delegatedTo } : {}),
    focus: focusOut, aria, announced, contrast, targetSize, motion,
  };
}

// Insert or replace one field at the end of a contract's a11y block — readable (one entry per line) and by
// matching braces outside strings, so the rest of the contract keeps its formatting.
function closeOf(src: string, open: number) {
  let depth = 0, inStr = false;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (inStr) { if (ch === '\\') i++; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === '{' || ch === '[') depth++;
    else if ((ch === '}' || ch === ']') && --depth === 0) return i;
  }
  return -1;
}
function upsertA11yField(src: string, key: string, value: unknown) {
  let updated = src;
  const at = updated.indexOf(`"${key}": `, updated.search(/"a11y":\s*\{/));
  if (at !== -1) {
    const end = closeOf(updated, updated.indexOf('{', at)) + 1;
    const before = updated.slice(0, at), after = updated.slice(end);
    // a field in the middle takes its following comma with it; the last one takes the comma before it
    updated = /^\s*,/.test(after) ? before + after.replace(/^\s*,\s*/, '') : before.replace(/,\s*$/, '') + after;
  }
  const a11yAt = updated.search(/"a11y":\s*\{/);
  const close = closeOf(updated, updated.indexOf('{', a11yAt));
  const block = `"${key}": ${JSON.stringify(value, null, 2).replace(/\n/g, '\n    ')}`;
  const before = updated.slice(0, close).replace(/\s*$/, '');
  updated = `${before},\n    ${block}\n  ${updated.slice(close)}`;
  JSON.parse(updated);
  return updated;
}

// Each contract carries what it applies (a11y.applied) and its results (a11y.results), next to its role, keys
// and WCAG criteria — each rewritten only when it changes, so a re-run doesn't touch the file.
const reviewIds = CHECKS.filter(ch => ch.kind === 'review').map(ch => ch.id);
for (const c of allComponents) {
  const file = path.join(root, c.contract);
  const src = fs.readFileSync(file, 'utf8');
  const contract = JSON.parse(src);
  let updated = src;
  const applied = appliedFor(c, contract);
  if (applied && JSON.stringify(contract.a11y?.applied) !== JSON.stringify(applied)) updated = upsertA11yField(updated, 'applied', applied);
  const prev = contract.a11y?.results;
  const checksNow = Object.fromEntries(CHECKS.map(ch => [ch.id, results[c.name]?.[ch.id]?.status ?? 'pending']));
  const next = { score: scores[c.name]!.score, meetsMinimum: scores[c.name]!.meetsMinimum, checks: checksNow, notScored: reviewIds };
  const resultsChanged = !prev || JSON.stringify({ ...prev, changed: undefined }) !== JSON.stringify({ ...next, changed: undefined });
  // results always last in the block: re-place it after applied when applied was (re)written
  if (resultsChanged || updated !== src) updated = upsertA11yField(updated, 'results', resultsChanged ? { ...next, changed: now.slice(0, 10) } : prev);
  if (updated !== src) fs.writeFileSync(file, updated);
}

// The package's copy of the contracts (packages/core/dist/contracts — what agents and the MCP read once
// installed) is otherwise only refreshed by a build: refresh it now so it never lags behind the results.
if (fs.existsSync(path.join(root, 'packages/core/dist'))) {
  spawnSync('node', ['scripts/copy-agent-docs.mjs'], { cwd: path.join(root, 'packages/core'), stdio: 'ignore' });
}

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
console.log(`\nAccessibility score ${overall ?? '—'}/100 (average of per-component scores) · ${Object.values(scores).filter(x => x.meetsMinimum).length} of ${allComponents.length} components meet every automatic check`);
console.log(`quality/accessibility.json updated · Storybook: Data/Accessibility`);
const blocking = checks.filter(c => c.kind !== 'review').some(ch => components.some(c => results[c.name]![ch.id]!.status === 'fail'));
process.exit(blocking ? 1 : 0);
