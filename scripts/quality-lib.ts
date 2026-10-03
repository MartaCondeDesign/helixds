import fs from 'fs';
import path from 'path';
import { GLOBAL_CHECKS, loadRuns, loadPrompts, scorePrompt, type LoadedRun } from './eval-lib.ts';

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

  const evals = evalSummary(allRuns);
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
    weekly: { from: new Date(weekAgo).toISOString().slice(0, 10), to: now.toISOString().slice(0, 10), evals: evalSummary(weeklyRuns) },
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
