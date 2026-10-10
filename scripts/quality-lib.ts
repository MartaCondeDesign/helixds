import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { GLOBAL_CHECKS, loadRuns, loadPrompts, scorePrompt, currentAnswers, type LoadedRun } from './eval-lib.ts';

const root = path.resolve(import.meta.dirname, '..');
const qualityDir = path.join(root, 'quality');
export const changesFile = path.join(qualityDir, 'changes.json');
export const historyFile = path.join(qualityDir, 'history.json');

export type ChangeStatus = 'proposed' | 'implemented' | 'verified' | 'reverted';

export interface QualityChange {
  id: string;
  date: string;
  area: string;
  summary: string;
  change: string;
  metric: string;
  evidence: string;
  status: ChangeStatus;
  outcome?: string;
}

type Stability = {
  generatedAt?: string;
  criteria?: Record<string, { label: string }>;
  components?: Array<{
    name: string;
    status: 'draft' | 'beta' | 'stable';
    figma?: { state?: 'synced' | 'drift' | 'missing' };
    checks?: Record<string, { pass: boolean }>;
  }>;
};

function readJson<T>(relativePath: string, fallback: T): T {
  const file = path.join(root, relativePath);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) as T : fallback;
}

function walkTokenLeaves(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  if ('$value' in value) return 1;
  return Object.values(value).reduce<number>((total, child) => total + walkTokenLeaves(child), 0);
}

function asRate(failed: number, total: number) {
  return total === 0 ? null : failed / total;
}

function evalSummary(runs: LoadedRun[]) {
  const prompts = new Map(loadPrompts().map(prompt => [prompt.id, prompt]));
  const rescored = runs.map(run => {
    const prompt = prompts.get(run.promptId);
    return prompt ? { ...run, ...scorePrompt(prompt, run.generatedCode) } : run;
  });
  const passed = rescored.filter(run => run.passed).length;
  return {
    generations: rescored.length,
    passRate: rescored.length ? passed / rescored.length : null,
    promptsCovered: new Set(rescored.map(run => run.promptId)).size,
    globalChecks: GLOBAL_CHECKS.map(check => ({
      id: check.id,
      label: check.description,
      failed: rescored.filter(run => run.globalChecks?.[check.id]).length,
      rate: asRate(rescored.filter(run => run.globalChecks?.[check.id]).length, rescored.length),
    })),
  };
}

type Ladder = { levels: Array<{ variant: string; label: string; detail: string }> };

/** Per context level (evals/ladder.json): how agents do with that much guidance, and what it costs. */
function ladderSummary(runs: LoadedRun[]) {
  const ladder = readJson<Ladder>('evals/ladder.json', { levels: [] });
  const prompts = new Map(loadPrompts().map(prompt => [prompt.id, prompt]));
  return ladder.levels.map(level => {
    const levelRuns = runs.filter(run => run.variant === level.variant).map(run => {
      const prompt = prompts.get(run.promptId);
      return prompt ? { ...run, ...scorePrompt(prompt, run.generatedCode) } : run;
    });
    const measured = levelRuns.filter(run => run.usage?.totalTokens);
    const totalTokens = measured.reduce((sum, run) => sum + (run.usage?.totalTokens ?? 0), 0);
    return {
      variant: level.variant,
      label: level.label,
      detail: level.detail,
      answers: levelRuns.length,
      tasks: new Set(levelRuns.map(run => run.promptId)).size,
      passRate: levelRuns.length ? levelRuns.filter(run => run.passed).length / levelRuns.length : null,
      meanScore: levelRuns.length ? levelRuns.reduce((sum, run) => sum + run.score, 0) / levelRuns.length : null,
      tokensPerAnswer: measured.length ? totalTokens / measured.length : null,
      totalTokens: measured.length ? totalTokens : null,
    };
  });
}

type RoundEntry = { id: string; date: string; commit: string; levels: Array<{ variant: string; label: string }> };

/** Commit subjects between two rounds' commits (oldest first). A "-dirty" commit also had uncommitted edits. */
function commitsBetween(from: string, to: string): string[] {
  const [a, b] = [from.replace(/-dirty$/, ''), to.replace(/-dirty$/, '')];
  if (!a || !b || a === b || a === 'unknown' || b === 'unknown') return [];
  try {
    return execFileSync('git', ['log', '--reverse', '--format=%s', `${a}..${b}`], { cwd: root, encoding: 'utf8' }).split('\n')
      // The old post-commit hook's automatic changelog commits aren't changes to the system.
      .filter(subject => subject && subject !== 'Regenerate changelog');
  } catch { return []; }
}

/**
 * Improvement history, with nothing to fill in by hand: every eval round compared with the one before it.
 * What changed = the commits between their two commits (plus a flag for uncommitted edits); the effect =
 * each level's pass rate and mean score, on the tasks both rounds ran, so a round on fewer tasks doesn't
 * read as a drop.
 */
// Rounds as Metrics shows them: only the levels still on the context ladder (evals/ladder.json). A level
// taken off it (the one-off "npm install" level, 2026-10-09) keeps its rounds in rounds.json, unshown.
function ladderRounds(): RoundEntry[] {
  const onLadder = new Set(readJson<Ladder>('evals/ladder.json', { levels: [] }).levels.map(level => level.variant));
  return readJson<RoundEntry[]>('evals/rounds.json', [])
    .map(round => ({ ...round, levels: round.levels.filter(level => onLadder.has(level.variant)) }))
    .filter(round => round.levels.length > 0);
}

function roundImprovements(runs: LoadedRun[]) {
  const rounds = ladderRounds();
  const prompts = new Map(loadPrompts().map(prompt => [prompt.id, prompt]));
  const byRound = new Map<string, LoadedRun[]>();
  for (const run of runs) {
    const round = (run as LoadedRun & { round?: string }).round;
    if (round) byRound.set(round, [...(byRound.get(round) ?? []), run]);
  }
  const stats = (rs: LoadedRun[]) => {
    if (!rs.length) return null;
    const scored = rs.map(run => { const prompt = prompts.get(run.promptId); return prompt ? scorePrompt(prompt, run.generatedCode) : run; });
    return { answers: rs.length, passRate: scored.filter(run => run.passed).length / rs.length, meanScore: scored.reduce((sum, run) => sum + run.score, 0) / rs.length };
  };
  return rounds.slice(1).map((round, i) => {
    const previous = rounds[i];
    const now = byRound.get(round.id) ?? [];
    const before = byRound.get(previous.id) ?? [];
    const common = new Set(now.map(run => run.promptId).filter(task => before.some(run => run.promptId === task)));
    const levels = round.levels.map(level => {
      const after = stats(now.filter(run => run.variant === level.variant && common.has(run.promptId)));
      const prior = stats(before.filter(run => run.variant === level.variant && common.has(run.promptId)));
      return { variant: level.variant, label: level.label, before: prior, after };
    }).filter(level => level.before && level.after);
    const deltas = levels.map(level => level.after!.meanScore - level.before!.meanScore);
    const meanDelta = deltas.length ? deltas.reduce((sum, d) => sum + d, 0) / deltas.length : null;
    return {
      id: round.id,
      date: round.date,
      previous: previous.id,
      commit: round.commit,
      commits: commitsBetween(previous.commit, round.commit),
      uncommitted: round.commit.endsWith('-dirty'),
      tasksCompared: common.size,
      levels,
      // Mean score is 0–1: two points either way is noise between rounds, not a trend.
      verdict: meanDelta === null ? 'not comparable' : meanDelta > 0.02 ? 'better' : meanDelta < -0.02 ? 'worse' : 'same',
      meanDelta,
    };
  }).reverse();
}

/** Per day × context level: answers, their summed score, how many passed, which tasks, and tokens — Metrics
 * sums these over a day, a month or all time and divides, so a period's mean weighs every answer equally. */
function ladderDaily(runs: LoadedRun[]) {
  const levels = new Set(readJson<Ladder>('evals/ladder.json', { levels: [] }).levels.map(level => level.variant));
  const prompts = new Map(loadPrompts().map(prompt => [prompt.id, prompt]));
  const days = new Map<string, { date: string; variant: string; answers: number; scoreSum: number; passed: number; tasks: string[]; tokenSum: number; measured: number }>();
  for (const run of runs) {
    if (!levels.has(run.variant)) continue;
    const prompt = prompts.get(run.promptId);
    const scored = prompt ? scorePrompt(prompt, run.generatedCode) : run;
    // Local calendar day — an eval run at 01:00 in Madrid belongs to that day, not the previous UTC one.
    const at = new Date(run.timestamp);
    const date = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
    const key = `${date}|${run.variant}`;
    const day = days.get(key) ?? { date, variant: run.variant, answers: 0, scoreSum: 0, passed: 0, tasks: [], tokenSum: 0, measured: 0 };
    day.answers++;
    day.scoreSum += scored.score;
    if (scored.passed) day.passed++;
    if (!day.tasks.includes(run.promptId)) day.tasks.push(run.promptId);
    if (run.usage?.totalTokens) { day.tokenSum += run.usage.totalTokens; day.measured++; }
    days.set(key, day);
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export interface GovernanceEntry { name: string; status: string; hasNeverUseFor: boolean; hasRationale: boolean; hasGovernance: boolean; }

/** Decision coverage: does every contract tell an agent why the component exists, when not to use it, and what it may change locally? */
export function governanceCoverage() {
  const contractsDir = path.join(root, 'contracts/components');
  const contracts: GovernanceEntry[] = fs.readdirSync(contractsDir).filter(file => file.endsWith('.json')).sort().map(file => {
    const contract = JSON.parse(fs.readFileSync(path.join(contractsDir, file), 'utf8'));
    return {
      name: contract.name || file.replace('.json', ''),
      status: contract.status || 'unknown',
      hasNeverUseFor: Array.isArray(contract.neverUseFor) && contract.neverUseFor.length > 0,
      hasRationale: typeof contract.rationale === 'string' && contract.rationale.trim().length > 0,
      hasGovernance: Boolean(contract.governance && (Array.isArray(contract.governance.mayExtendLocally) || Array.isArray(contract.governance.mustEscalateToDS))),
    };
  });
  const complete = contracts.filter(entry => entry.hasNeverUseFor && entry.hasRationale && entry.hasGovernance).length;
  return { total: contracts.length, complete, rate: contracts.length ? complete / contracts.length : null, contracts };
}

export function loadChanges(): QualityChange[] {
  const changes = readJson<QualityChange[]>('quality/changes.json', []);
  return [...changes].sort((a, b) => b.date.localeCompare(a.date));
}

export function saveChange(change: QualityChange) {
  fs.mkdirSync(qualityDir, { recursive: true });
  const changes = readJson<QualityChange[]>('quality/changes.json', []);
  if (changes.some(existing => existing.id === change.id)) throw new Error(`Quality change "${change.id}" already exists.`);
  changes.push(change);
  fs.writeFileSync(changesFile, JSON.stringify(changes, null, 2) + '\n');
}

/** Helix adapter: maps this repository's contracts, tokens and eval format to the portable snapshot. */
export function createHelixSnapshot(now = new Date()) {
  const stability = readJson<Stability>('contracts/stability.json', {});
  const components = stability.components ?? [];
  const byStatus = Object.fromEntries(['draft', 'beta', 'stable'].map(status => [status, components.filter(c => c.status === status).length]));
  const failedCriteria = Object.entries(stability.criteria ?? {}).map(([id, criterion]) => ({
    id,
    label: criterion.label,
    failed: components.filter(component => component.checks?.[id]?.pass === false).length,
  }));
  // verify:stable calls an out-of-date Figma component 'drift'; the snapshot reports it as 'stale'.
  const figma = { synced: components.filter(c => c.figma?.state === 'synced').length, stale: components.filter(c => c.figma?.state === 'drift').length, missing: components.filter(c => c.figma?.state === 'missing').length };
  const allRuns = loadRuns();
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const weeklyRuns = allRuns.filter(run => run.timestamp >= weekAgo);

  // Rounds: each `pnpm eval:ladder --round` (Proof's "Run evals" button) — per level, over time.
  // Agent reliability and rule compliance describe Helix TODAY: the shared rule in eval-lib.ts (answers
  // since the last breaking change, latest round per task × level, ladder levels, no control group) —
  // the same answers AI Readiness rates. Every answer, old ones included, still feeds the per-level
  // history (ladder, daily, rounds) below. Before 2026-10-10 these two used every saved answer, so
  // history.json points before that date aren't comparable.
  const current = currentAnswers(allRuns);
  const evals = { ...evalSummary(current.answers), basis: { since: current.epoch, olderExcluded: current.olderExcluded, superseded: current.superseded }, ladder: ladderSummary(allRuns), daily: ladderDaily(allRuns), improvements: roundImprovements(allRuns), rounds: ladderRounds() };
  const ruleCompliance = evals.globalChecks.length ? evals.globalChecks.reduce((sum, check) => sum + (1 - (check.rate ?? 0)), 0) / evals.globalChecks.length : null;
  const governance = governanceCoverage();
  // Components the manifest knows about but verify:stable hasn't scored yet — their status is unknown,
  // so readiness and Figma alignment are computed without them until `pnpm verify:stable` runs again.
  const scored = new Set(components.map(component => component.name));
  const unscored = readJson<{ components?: Array<{ name: string }> }>('contracts/manifest.json', {}).components?.map(c => c.name).filter(name => !scored.has(name)) ?? [];
  const rates = [components.length ? (byStatus.stable as number) / components.length : null, components.length ? (figma.synced as number) / components.length : null, evals.passRate, ruleCompliance, governance.rate].filter((rate): rate is number => rate !== null);
  // Health is an equal-weight average of independent DS quality signals. Keeping the breakdown beside
  // the score makes a change in the headline auditable instead of a black-box “quality” number.
  const healthScore = rates.length ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : null;
  return {
    generatedAt: now.toISOString(),
    sources: {
      stabilityGeneratedAt: stability.generatedAt ?? null,
      evalRuns: allRuns.length,
      lastEvalRunAt: allRuns.length ? new Date(Math.max(...allRuns.map(run => run.timestamp))).toISOString() : null,
      weeklyEvalRuns: weeklyRuns.length,
      improvementRecords: loadChanges().length,
      unscoredComponents: unscored,
    },
    components: { total: components.length, byStatus, failedCriteria },
    figma,
    tokens: { defined: walkTokenLeaves(readJson<Record<string, unknown>>('packages/tokens/src/tokens.json', {})) },
    evals,
    governance: { total: governance.total, complete: governance.complete, rate: governance.rate, incomplete: governance.contracts.filter(entry => !(entry.hasNeverUseFor && entry.hasRationale && entry.hasGovernance)).map(entry => entry.name) },
    healthScore,
    healthScoreBreakdown: { componentReadiness: components.length ? (byStatus.stable as number) / components.length : null, figmaAlignment: components.length ? (figma.synced as number) / components.length : null, agentReliability: evals.passRate, ruleCompliance, governanceCoverage: governance.rate },
    weekly: { from: new Date(weekAgo).toISOString().slice(0, 10), to: now.toISOString().slice(0, 10), evals: evalSummary(current.answers.filter(run => run.timestamp >= weekAgo)) },
    changes: loadChanges(),
  };
}

export interface QualityHistoryPoint { date: string; score: number | null; evalPassRate?: number | null; tokens?: number; components?: Record<string, number>; figma?: Record<string, number>; }
export function recordSnapshot(snapshot: ReturnType<typeof createHelixSnapshot>) {
  const history = fs.existsSync(historyFile) ? JSON.parse(fs.readFileSync(historyFile, 'utf8')) as QualityHistoryPoint[] : [];
  const point = { date: snapshot.generatedAt.slice(0, 10), score: snapshot.healthScore, evalPassRate: snapshot.evals.passRate, tokens: snapshot.tokens.defined, components: snapshot.components.byStatus, figma: snapshot.figma };
  const withoutToday = history.filter(item => item.date !== point.date);
  fs.writeFileSync(historyFile, JSON.stringify([...withoutToday, point], null, 2) + '\n');
}

export function percent(value: number | null) {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}

export type QualitySnapshot = ReturnType<typeof createHelixSnapshot>;

export function assertPortableSnapshot(value: unknown): asserts value is QualitySnapshot {
  if (!value || typeof value !== 'object') throw new Error('Quality snapshot must be a JSON object.');
  const snapshot = value as Record<string, unknown>;
  const required = ['generatedAt', 'components', 'tokens', 'evals', 'changes'];
  const missing = required.filter(key => !(key in snapshot));
  if (missing.length) throw new Error(`Quality snapshot is missing: ${missing.join(', ')}. See quality/snapshot.schema.json.`);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]!));
}

export function snapshotHtml(snapshot: QualitySnapshot) {
  const weekly = snapshot.weekly?.evals ?? snapshot.evals;
  const changeRows = snapshot.changes.length
    ? snapshot.changes.map(change => `<tr><td>${escapeHtml(change.date)}</td><td>${escapeHtml(change.area)}</td><td>${escapeHtml(change.summary)}</td><td>${escapeHtml(change.change)}</td><td>${escapeHtml(change.metric)}</td><td>${escapeHtml(change.status)}</td></tr>`).join('')
    : '<tr><td colspan="6">No improvement records yet. Use <code>pnpm quality record</code> after a reviewed observation.</td></tr>';
  const checkRows = snapshot.evals.globalChecks.map(check => `<tr><td>${escapeHtml(check.label)}</td><td>${check.failed}/${snapshot.evals.generations}</td><td>${percent(check.rate)}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Design system quality report</title><style>body{font:15px/1.5 system-ui,sans-serif;color:#172033;max-width:1100px;margin:48px auto;padding:0 24px;background:#f7f8fa}h1{font-size:32px}section{background:#fff;border:1px solid #d9dee8;border-radius:12px;padding:24px;margin:18px 0}dl{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}dt{color:#5e6878;font-size:12px;text-transform:uppercase}dd{font-size:24px;margin:4px 0}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid #e5e9f0}code{background:#eef1f5;padding:2px 4px;border-radius:4px}</style></head><body><h1>Design system quality report</h1><p>Generated ${escapeHtml(snapshot.generatedAt)}. This report aggregates recorded evidence; it does not replace CI gates or human design review.</p><section><h2>System health</h2><dl><div><dt>Components</dt><dd>${snapshot.components.total}</dd></div><div><dt>Stable</dt><dd>${snapshot.components.byStatus.stable ?? 0}</dd></div><div><dt>Figma aligned</dt><dd>${snapshot.figma.synced ?? 0}</dd></div><div><dt>Tokens</dt><dd>${snapshot.tokens.defined}</dd></div></dl></section><section><h2>Agent evals</h2><dl><div><dt>Generations</dt><dd>${snapshot.evals.generations}</dd></div><div><dt>Pass rate</dt><dd>${percent(snapshot.evals.passRate)}</dd></div><div><dt>Past 7 days</dt><dd>${weekly.generations}</dd></div><div><dt>Weekly pass rate</dt><dd>${percent(weekly.passRate)}</dd></div></dl><table><thead><tr><th>Global check</th><th>Failures</th><th>Rate</th></tr></thead><tbody>${checkRows}</tbody></table></section><section><h2>Improvement ledger</h2><table><thead><tr><th>Date</th><th>Area</th><th>Observation</th><th>Change</th><th>Metric</th><th>Status</th></tr></thead><tbody>${changeRows}</tbody></table></section></body></html>`;
}
