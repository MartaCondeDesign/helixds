/**
 * AI Readiness: is Helix ready to be read — and used — by a coding agent?
 *
 *   ① Readable  static, deterministic, free: what an agent can find and understand in the repo and the
 *               npm package (entry points, contracts, types, tokens, docs, change history, guardrails).
 *               Same repo → same number, every time.
 *   ② Used well what agents actually did with it, from the saved eval answers (evals/outputs/): compiles,
 *               no invented props, checklist, design judge, and what the MCP adds over no context.
 *               Only answers generated since the last breaking change count — older ones were right
 *               for an API that no longer exists (see `epoch`).
 *
 * Every number carries how it's computed, the evidence (files, or the items that failed) and the command
 * that recomputes it, so it can be checked instead of trusted. Computed only from Helix's own sources;
 * the graders behind ② are checked by `pnpm eval:calibrate`.
 *
 * Writes quality/ai-readiness.json (Storybook → Data → AI Readiness) and appends the score to
 * quality/ai-readiness-history.json, one point per commit. Run: pnpm readiness
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { loadRuns, loadPrompts, scorePrompt, type LoadedRun } from './eval-lib.ts';

const root = path.resolve(import.meta.dirname, '..');
const rel = (p: string) => path.join(root, p);
const exists = (p: string) => fs.existsSync(rel(p));
const read = (p: string) => fs.readFileSync(rel(p), 'utf8');
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

interface Check {
  id: string;
  label: string;
  score: number | null; // 0..100, null = no data yet
  how: string;
  evidence: string[]; // what passed / failed, file by file
  command: string;
  n?: number; // answers behind a ② number
}

const components = [
  ...fs.readdirSync(rel('packages/core/src/components')),
  ...(exists('packages/core/src/layout') ? fs.readdirSync(rel('packages/core/src/layout')) : []),
].filter(name => /^[A-Z]/.test(name)).sort();
const componentDir = (name: string) =>
  exists(`packages/core/src/components/${name}`) ? `packages/core/src/components/${name}` : `packages/core/src/layout/${name}`;
const contract = (name: string) => (exists(`contracts/components/${name}.json`) ? JSON.parse(read(`contracts/components/${name}.json`)) : null);

// A list of [label, ok] → score + the evidence lines.
function tally(items: [string, boolean][]) {
  return { score: pct(items.filter(([, ok]) => ok).length, items.length), evidence: items.map(([label, ok]) => `${ok ? '✓' : '✗'} ${label}`) };
}
// Per-component ratios: evidence lists only the misses, so the list stays readable.
function coverage(label: string, names: string[], ok: (name: string) => boolean): [string, number, string[]] {
  const missing = names.filter(n => !ok(n));
  return [`${label}: ${names.length - missing.length}/${names.length}`, pct(names.length - missing.length, names.length), missing];
}

// ── ① Readable ───────────────────────────────────────────────────────────────

function agentEntryPoints(): Check {
  const core = JSON.parse(read('packages/core/package.json'));
  const skills = exists('.agents/skills') ? fs.readdirSync(rel('.agents/skills')).filter(d => exists(`.agents/skills/${d}/SKILL.md`)) : [];
  const { score, evidence } = tally([
    ['AGENTS.md — the consumer guide, always loaded', exists('AGENTS.md')],
    ['CLAUDE.md — contributor rules', exists('CLAUDE.md')],
    ['llms.txt — short summary for AI tools', exists('llms.txt')],
    ['MCP server (packages/mcp) registered in .mcp.json', exists('packages/mcp/src/server.ts') && exists('.mcp.json') && read('.mcp.json').includes('helix')],
    [`Skills in the shared layout (.agents/skills: ${skills.length})`, skills.length > 0],
    ['use-helix skill for building screens', skills.includes('use-helix')],
    ['Contracts + prop vocabulary shipped in the npm package', !!core.exports?.['./contracts/*'] && !!core.exports?.['./prop-map.md']],
    ['Cursor sees the same context (.cursor → .ai)', exists('.cursor')],
  ]);
  return { id: 'entry-points', label: 'Agent entry points', score, evidence, how: 'Share of the places an agent looks for design-system context that exist.', command: 'pnpm readiness' };
}

function contracts(): Check {
  const parts = [
    coverage('Components with a contract', components, n => !!contract(n)),
    coverage("Contracts that say where to import from (import line, @helixds/react)", components, n => /from '@helixds\/react';$/.test(contract(n)?.import ?? '')),
    coverage('Contracts whose every prop is described', components, n => (contract(n)?.props ?? []).every((p: { description?: string }) => (p.description ?? '').length > 10)),
    coverage('Contracts that say when NOT to use it (neverUseFor)', components, n => (contract(n)?.neverUseFor ?? []).length > 0),
    coverage('Contracts with accessibility rules (a11y)', components, n => !!contract(n)?.a11y),
  ];
  return {
    id: 'contracts', label: 'Component contracts', score: mean(parts.map(p => p[1])),
    evidence: parts.flatMap(([label, , missing]) => [label, ...missing.map(m => `   ✗ ${m}`)]),
    how: 'Average of five per-component ratios over contracts/components/*.json — what helix_get_contract and the npm package hand an agent.',
    command: 'pnpm verify:contract',
  };
}

function types(): Check {
  const [label, score, missing] = coverage('Components with a <Name>.types.ts', components, n => exists(`${componentDir(n)}/${n}.types.ts`));
  return { id: 'types', label: 'Typed props', score, evidence: [label, ...missing.map(m => `   ✗ ${m}`)], how: 'Share of components whose props live in a .types.ts file an agent (or tsc) can read.', command: 'pnpm typecheck' };
}

function tokens(): Check {
  const json = JSON.parse(read('packages/tokens/src/tokens.json'));
  let semantic = 0, described = 0;
  (function walk(node: Record<string, any>) {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$') || !v || typeof v !== 'object') continue;
      if ('$value' in v) { semantic++; if (v.$description) described++; } else walk(v);
    }
  })(json.semantic);
  // Aliases in the source ({semantic.…} references, composite sub-values included) vs var() in the CSS:
  // a token with its own literal value (28px) is a source, not an alias, and rightly stays literal.
  let aliasCount = 0;
  (function walk(node: Record<string, any>) {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$') || !v || typeof v !== 'object') continue;
      if ('$value' in v) {
        const values = typeof v.$value === 'object' ? Object.values(v.$value) : [v.$value];
        aliasCount += values.filter(x => typeof x === 'string' && x.startsWith('{')).length;
      } else walk(v);
    }
  })({ semantic: json.semantic, component: json.component });
  const css = exists('packages/tokens/dist/helix.css') ? read('packages/tokens/dist/helix.css') : '';
  const light = css.split('/* ── Dark mode')[0] ?? '';
  const aliases = (light.match(/:\s*var\(--helix-/g) ?? []).length;
  const items: [string, boolean][] = [
    [`Semantic tokens with a description: ${described}/${semantic}`, semantic > 0 && described === semantic],
    [`Every alias in tokens.json is a var() in helix.css, so the chain is visible: ${aliases}/${aliasCount}`, aliasCount > 0 && aliases === aliasCount],
    ['Dark mode in the CSS (data-theme + prefers-color-scheme)', css.includes('[data-theme="dark"]') && css.includes('prefers-color-scheme')],
    ['DTCG source (packages/tokens/src/tokens.json)', !!json.semantic],
  ];
  const { score, evidence } = tally(items);
  return { id: 'tokens', label: 'Readable tokens', score, evidence, how: 'Whether an agent can tell what each token is for and where its value comes from.', command: 'pnpm --filter @helixds/tokens build && pnpm readiness' };
}

function docs(): Check {
  const llms = read('llms.txt');
  const agents = read('AGENTS.md');
  const stories = (n: string) => exists(`apps/storybook/stories/Components/${n}.stories.tsx`) || exists(`apps/storybook/stories/Layout/${n}.stories.tsx`)
    || fs.readdirSync(rel('apps/storybook/stories'), { recursive: true }).some(f => String(f).endsWith(`${n}.stories.tsx`));
  const parts = [
    coverage('Named in llms.txt', components, n => new RegExp(`\\b${n}\\b`).test(llms)),
    coverage('Named in AGENTS.md', components, n => new RegExp(`\\b${n}\\b`).test(agents)),
    coverage('With a Storybook story', components, stories),
  ];
  return {
    id: 'docs', label: 'Findable docs', score: mean(parts.map(p => p[1])),
    evidence: parts.flatMap(([label, , missing]) => [label, ...missing.map(m => `   ✗ ${m}`)]),
    how: 'Whether an agent that searches the docs finds every component.', command: 'pnpm docs:readme',
  };
}

function changeHistory(): Check {
  const changelog = exists('CHANGELOG.md') ? read('CHANGELOG.md') : '';
  const propMap = exists('.ai/maps/prop-map.md') ? read('.ai/maps/prop-map.md') : '';
  const antiSynonyms = (propMap.match(/^\|\s*`[^`]+`\s*\|\s*`/gm) ?? []).length;
  const { score, evidence } = tally([
    ['CHANGELOG.md at the root', !!changelog],
    ['Version headings an agent can parse (## [x.y.z])', /^## \[\d+\.\d+/m.test(changelog)],
    ['Breaking changes listed first', /### ⚠️ Breaking changes/.test(changelog)],
    [`Renamed props mapped to their new names (prop-map.md: ${antiSynonyms} rows)`, antiSynonyms > 0],
  ]);
  return { id: 'history', label: 'Change history', score, evidence, how: 'Whether an agent that learned an older Helix can find what changed.', command: 'pnpm docs:changelog:md' };
}

function guardrails(): Check {
  const plugin = read('packages/eslint-plugin/src/index.js');
  const settings = exists('.claude/settings.json') ? read('.claude/settings.json') : '';
  const { score, evidence } = tally([
    ...['unknown-prop', 'prop-vocabulary', 'import-source', 'no-raw-color', 'no-raw-spacing'].map(r => [`Lint rule helix/${r}`, plugin.includes(`'helix/${r}'`)] as [string, boolean]),
    ['Claude hook: contracts read before writing (claude-contract-hook.mjs)', settings.includes('claude-contract-hook')],
    ['Claude hook: lint after writing (claude-lint-hook.mjs)', settings.includes('claude-lint-hook')],
  ]);
  return { id: 'guardrails', label: 'Guardrails', score, evidence, how: 'What catches an agent\'s mistake while it works, before a person has to.', command: 'pnpm --filter @helixds/eslint-plugin test && pnpm test:contract-hook && pnpm test:lint-hook' };
}

// ── ② Used well ──────────────────────────────────────────────────────────────

// The last breaking change: answers from before it used names that no longer exist.
const changelogJson = JSON.parse(read('.ai/maps/changelog.json'));
const lastBreaking = changelogJson.days.flatMap((d: any) => d.commits).find((c: any) => c.bump === 'major');
const epoch = lastBreaking
  ? { hash: lastBreaking.hash, subject: lastBreaking.subject, at: Number(execSync(`git show -s --format=%ct ${lastBreaking.hash}`, { cwd: root, encoding: 'utf8' }).trim()) * 1000 }
  : { hash: null, subject: null, at: 0 };
// For people reading the page: a date, not a commit hash.
const since = epoch.at ? new Date(epoch.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'the start';

const prompts = new Map(loadPrompts().map(p => [p.id, p]));
const all = loadRuns().filter(r => r.source === 'claude-cli');
// Only the latest measurement round of each task × level — the same rule as the Eval Gallery and Proof —
// so a round run after a fix replaces the one before it instead of averaging with it.
const sinceEpoch = all.filter(r => r.timestamp >= epoch.at);
const latestRound = new Map<string, string>();
for (const r of sinceEpoch) {
  const key = `${r.promptId}|${r.variant}`;
  if ((latestRound.get(key) ?? '') < (r.round ?? '')) latestRound.set(key, r.round!);
}
const current = sinceEpoch.filter(r => (r.round ?? '') === (latestRound.get(`${r.promptId}|${r.variant}`) ?? '')).map(r => {
  const p = prompts.get(r.promptId);
  return p ? { ...r, ...scorePrompt(p, r.generatedCode) } : r;
});

// Per task first, then the mean over tasks: a task answered 25 times must not outweigh five answered once.
function rate(id: string, label: string, how: string, runs: LoadedRun[], ok: (r: LoadedRun) => boolean, command: string): Check {
  const tasks = [...new Set(runs.map(r => r.promptId))].sort();
  const perTask = tasks.map(t => {
    const rs = runs.filter(r => r.promptId === t);
    return { t, good: rs.filter(ok).length, total: rs.length, misses: rs.filter(r => !ok(r)) };
  });
  return {
    id, label, command, n: runs.length,
    how: `${how} Each task weighs the same (mean of per-task shares), however many answers it has.`,
    score: tasks.length ? mean(perTask.map(p => (p.good / p.total) * 100)) : null,
    evidence: tasks.length
      ? perTask.flatMap(p => [`${p.good === p.total ? '✓' : '✗'} ${p.t}: ${p.good}/${p.total}`,
          ...p.misses.slice(0, 3).map(r => `     ${r.variant} · rep ${r.rep} — evals/outputs/${r.file}`)])
      : [`No ${id === 'design' ? 'judged answers' : 'answers'} since ${since} — run ${command} to measure.`],
  };
}

function lift(): Check {
  const byLevel = (v: string) => current.filter(r => r.variant === v);
  const bare = byLevel('no-context'), mcp = byLevel('mcp');
  const shared = [...new Set(bare.map(r => r.promptId))].filter(id => mcp.some(r => r.promptId === id));
  // Per task first, then over tasks — same weighting as the rates above.
  const avg = (rs: LoadedRun[]) => mean(shared.map(t => mean(rs.filter(r => r.promptId === t).map(r => r.score * 100))));
  const has = shared.length > 0;
  return {
    id: 'lift', label: 'Checklist score with the MCP', n: has ? bare.length + mcp.length : 0,
    score: has ? Math.max(0, Math.min(100, avg(mcp))) : null,
    how: 'Mean checklist score of the MCP level, on the tasks also answered with no Helix context; the gap between the two is in the evidence.',
    evidence: has ? [`Same tasks: ${shared.join(', ')}`, `No context: ${avg(bare)} · MCP: ${avg(mcp)} · gap ${avg(mcp) - avg(bare) >= 0 ? '+' : ''}${avg(mcp) - avg(bare)}`]
      : [`No task measured at both levels since ${since} — pnpm eval:ladder --levels no-context,mcp --yes`],
    command: 'pnpm eval:ladder --levels no-context,mcp',
  };
}

const readable = [agentEntryPoints(), contracts(), types(), tokens(), docs(), changeHistory(), guardrails()];
// ② rates are about Helix, so they use answers that HAD Helix context: the no-context level measures the
// model's own guesses and only serves as the baseline in "What the MCP adds".
// Only the context ladder's levels (evals/ladder.json) — a one-off experiment isn't how agents use Helix.
const ladderLevels = new Set<string>(JSON.parse(read('evals/ladder.json')).levels.map((l: { variant: string }) => l.variant));
const guided = current.filter(r => r.variant !== 'no-context' && ladderLevels.has(r.variant));
const judged = guided.filter(r => (r as any).judge);
// "Compiles" alone would reward an answer that skipped Helix (plain HTML compiles) or used a former package
// name (eval-mechanical.ts resolves those for old answers): today it must import @helixds/react and nothing
// else that looks like Helix.
const importsHelixRight = (code: string) => {
  const specs = [...code.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(m => m[1]!);
  return specs.includes('@helixds/react') && !specs.some(s => /helix/i.test(s) && !/^@helixds\/(react|tokens)(\/|$)/.test(s));
};
const used = [
  rate('compiles', 'Imports @helixds/react and compiles', 'Share of answers (with Helix context) that import the real package — no made-up or former package name — and type-check against Helix\'s source (eval-mechanical.ts).', guided.filter(r => (r as any).mechanical), r => importsHelixRight(r.generatedCode) && (r as any).mechanical.compiles, 'pnpm eval:rescore'),
  rate('no-invented-props', 'No invented props', 'Share of answers that import @helixds/react with no invented or wrong prop — helix/unknown-prop, helix/prop-vocabulary, or a tsc "property does not exist" (the lint lets native attributes like title through). Answers with a made-up package are left out: their props can\'t be checked (the row above already counts them).', guided.filter(r => (r as any).mechanical && importsHelixRight(r.generatedCode)), r => !r.globalChecks?.['invented-prop'], 'pnpm eval:rescore'),
  rate('checklist', 'Task checklist passed', 'Share of answers (with Helix context) that meet every checkable criterion of their prompt.', guided, r => r.passed, 'pnpm eval:report'),
  rate('design', 'Design judged good', 'Share of judged answers (with Helix context) that pass every critical item of the design rubric (LLM judge, calibrated by pnpm eval:calibrate --judge).', judged, r => (r as any).judge.passed, 'pnpm eval:judge'),
  lift(),
];

// ② only counts when it covers enough of Helix: answers for one easy task aren't "how agents use Helix".
const MIN_TASKS = 5, MIN_SCREENS = 3;
const tasksCovered = [...new Set(current.map(r => r.promptId))].sort();
const screensCovered = tasksCovered.filter(id => prompts.get(id)?.category === 'screen');
const enough = tasksCovered.length >= MIN_TASKS && screensCovered.length >= MIN_SCREENS;
const coverageNote = `${tasksCovered.length} of ${prompts.size} tasks (${screensCovered.length} of them screens) measured since ${since}` +
  (enough ? '' : ` — needs ${MIN_TASKS}+ tasks incl. ${MIN_SCREENS}+ screens to count in the score`);

const readableScore = mean(readable.map(c => c.score!));
const measured = used.filter(c => c.score !== null);
const usedScore = enough && measured.length ? mean(measured.map(c => c.score!)) : null;
// The overall score IS ②: ① only says the pieces are there (and Helix built most of them to pass it), so
// averaging it in would lift the score whatever agents do. ① stays on the page as the prerequisites.
const total = usedScore;
const tier = total === null ? null : total >= 70 ? 'AI-native' : total >= 40 ? 'Invested' : 'Emerging';

const head = execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim();

const report = {
  $comment: 'Generated by scripts/ai-readiness.ts (pnpm readiness) — do not hand-edit.',
  generatedAt: new Date().toISOString(),
  commit: head,
  score: total,
  tier,
  basis: usedScore === null ? 'not rated — not enough eval answers since the last breaking change' : 'used well (readable is shown as prerequisites, not averaged in)',
  readable: { score: readableScore, checks: readable },
  used: {
    score: usedScore, enough, coverageNote, supersededAnswers: sinceEpoch.length - current.length, tasksCovered, screensCovered, minTasks: MIN_TASKS, minScreens: MIN_SCREENS,
    epoch: { ...epoch, date: since }, answers: current.length, olderAnswersExcluded: all.length - current.length, checks: used,
  },
};
fs.writeFileSync(rel('quality/ai-readiness.json'), JSON.stringify(report, null, 2) + '\n');

const historyFile = rel('quality/ai-readiness-history.json');
const history: { date: string; commit: string; score: number | null; readable: number; used: number | null }[] = fs.existsSync(historyFile) ? JSON.parse(fs.readFileSync(historyFile, 'utf8')) : [];
const point = { date: report.generatedAt.slice(0, 10), commit: head, score: total, readable: readableScore, used: usedScore };
const last = history[history.length - 1];
if (last && last.commit === head) history[history.length - 1] = point; else history.push(point);
fs.writeFileSync(historyFile, JSON.stringify(history, null, 2) + '\n');

console.log(`AI Readiness ${total === null ? 'not rated yet' : `${total}/100 · ${tier}`} (${report.basis})`);
console.log(`  Readable ${readableScore}: ${readable.map(c => `${c.label} ${c.score}`).join(' · ')}`);
console.log(`  Used well ${usedScore ?? 'n/a'}: ${used.map(c => `${c.label} ${c.score ?? 'n/a'}${c.n !== undefined ? ` (n=${c.n})` : ''}`).join(' · ')}`);
console.log(`     ${current.length} answers since ${epoch.hash} "${epoch.subject}"; ${all.length - current.length} older ones excluded.`);
console.log(`     Coverage: ${coverageNote}`);
