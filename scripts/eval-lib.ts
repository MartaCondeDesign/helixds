/**
 * Shared parsing + scoring for evals/prompts/*.md.
 * Scoring is pattern-based: each checklist line's backtick-quoted code spans are
 * checked for presence/absence in the candidate code. Lines with no backtick span
 * can't be checked mechanically and are reported as `pass: null` (manual review).
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

export interface EvalPrompt {
  id: string;
  category: string;
  difficulty: string;
  turns: number;
  prompt: string;
  successCriteria: string[];
  escapeHatches: string[];
  invalidPatterns: string[];
  expectedOutput: string;
}

export interface CriterionResult {
  text: string;
  pass: boolean | null; // null = not mechanically checkable, needs manual review
}

export interface ScoreResult {
  promptId: string;
  score: number; // 0..1, over mechanically-checkable success criteria only
  passed: boolean; // true iff no invalid pattern triggered and every checkable success criterion passed
  successResults: CriterionResult[];
  invalidResults: CriterionResult[]; // pass: true means the pattern was NOT triggered (good)
  escapeHatchResults: CriterionResult[]; // pass: true means the escape hatch was used
  unchecked: number; // count of criteria that couldn't be checked mechanically
}

const promptsDir = path.resolve(import.meta.dirname, '../evals/prompts');

/** filterId: one prompt id, or several comma-separated. */
export function loadPrompts(filterId?: string): EvalPrompt[] {
  const files = fs.readdirSync(promptsDir).filter(f => f.endsWith('.md'));
  const prompts = files.map(f => parsePromptFile(path.join(promptsDir, f)));
  if (!filterId) return prompts;
  const ids = new Set(filterId.split(',').map(s => s.trim()));
  return prompts.filter(p => ids.has(p.id));
}

function parsePromptFile(filePath: string): EvalPrompt {
  const raw = fs.readFileSync(filePath, 'utf-8');

  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) throw new Error(`${filePath}: missing frontmatter`);
  const fm: Record<string, string> = {};
  for (const line of fmMatch[1].split('\n')) {
    const sep = line.indexOf(':');
    if (sep === -1) continue;
    fm[line.slice(0, sep).trim()] = line.slice(sep + 1).trim();
  }

  const body = raw.slice(fmMatch[0].length);
  const sections = splitSections(body);

  return {
    id: fm.id ?? path.basename(filePath, '.md'),
    category: fm.category ?? 'uncategorized',
    difficulty: fm.difficulty ?? 'unknown',
    turns: Number(fm.turns ?? 1),
    prompt: (sections['Prompt'] ?? '').trim(),
    successCriteria: extractChecklist(sections['Success criteria'] ?? ''),
    escapeHatches: extractBullets(sections['Escape hatches (partial credit)'] ?? ''),
    invalidPatterns: extractBullets(sections['Invalid patterns (auto-fail)'] ?? ''),
    expectedOutput: extractCodeBlock(sections['Expected output shape'] ?? ''),
  };
}

function splitSections(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const chunks = body.split(/\n(?=# )/);
  for (const chunk of chunks) {
    const m = chunk.match(/^# (.+)\n([\s\S]*)/);
    if (m) sections[m[1].trim()] = m[2];
  }
  return sections;
}

function extractChecklist(text: string): string[] {
  return [...text.matchAll(/^- \[ \] (.+)$/gm)].map(m => m[1].trim());
}

function extractBullets(text: string): string[] {
  return [...text.matchAll(/^- (.+)$/gm)].map(m => m[1].trim());
}

export function extractCodeBlock(text: string): string {
  const m = text.match(/```(?:tsx|ts|jsx|js)?\n([\s\S]*?)```/);
  return m ? m[1] : text.trim();
}

// ── Scoring ──────────────────────────────────────────────────────────────────

interface ClassifiedSpans {
  required: string[]; // must be present
  forbidden: string[]; // must be absent
  anyOf?: string[]; // at least one must be present
  checkable: boolean;
}

function classifySpans(line: string): ClassifiedSpans {
  // "(any of `A`, `B`)" — alternatives: at least one must be present; the rest of the line is parsed as usual
  const anyOfMatch = line.match(/\(any of[^)]*\)/i);
  if (anyOfMatch) {
    const anyOf = [...anyOfMatch[0].matchAll(/`([^`]+)`/g)].map(m => m[1]);
    return { ...classifySpans(line.replace(anyOfMatch[0], '')), anyOf, checkable: true };
  }

  const allSpans = [...line.matchAll(/`([^`]+)`/g)].map(m => m[1]);
  if (allSpans.length === 0) return { required: [], forbidden: [], checkable: false };

  // "(not `x`, `y`)" style negation
  const parenNot = line.match(/\(not[^)]*\)/i);
  if (parenNot) {
    const forbidden = [...parenNot[0].matchAll(/`([^`]+)`/g)].map(m => m[1]);
    const outside = line.replace(parenNot[0], '');
    const required = [...outside.matchAll(/`([^`]+)`/g)].map(m => m[1]);
    return { required, forbidden, checkable: true };
  }

  // "Does NOT ... `x` — uses `y` instead" style negation (uppercase NOT, no parens)
  const notIdx = line.search(/\bNOT\b/);
  if (notIdx !== -1) {
    const before = line.slice(0, notIdx);
    const after = line.slice(notIdx);
    const dashIdx = after.search(/—/);
    const forbiddenZone = dashIdx !== -1 ? after.slice(0, dashIdx) : after;
    const requiredZoneAfter = dashIdx !== -1 ? after.slice(dashIdx) : '';
    const forbidden = [...forbiddenZone.matchAll(/`([^`]+)`/g)].map(m => m[1]);
    const required = [
      ...[...before.matchAll(/`([^`]+)`/g)].map(m => m[1]),
      ...[...requiredZoneAfter.matchAll(/`([^`]+)`/g)].map(m => m[1]),
    ];
    return { required, forbidden, checkable: true };
  }

  return { required: allSpans, forbidden: [], checkable: true };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Bare identifiers (e.g. `label`, `error`) are matched as whole words, so a
 * criterion naming a prop doesn't false-positive on an unrelated identifier
 * that merely contains it as a substring (e.g. `error` inside `errorMessage`).
 * Spans with symbols (e.g. `variant="primary"`, `loading={isSaving}`) are
 * already precise enough for plain substring matching.
 */
function matchesSpan(code: string, span: string): boolean {
  const isBareIdentifier = /^[A-Za-z_$][\w$]*$/.test(span);
  if (isBareIdentifier) return new RegExp(`\\b${escapeRegExp(span)}\\b`).test(code);
  return code.includes(span);
}

function scoreSuccessCriterion(line: string, code: string): CriterionResult {
  const { required, forbidden, anyOf, checkable } = classifySpans(line);
  if (!checkable) return { text: line, pass: null };
  const requiredOk = required.every(s => matchesSpan(code, s));
  const forbiddenOk = forbidden.every(s => !matchesSpan(code, s));
  const anyOfOk = !anyOf || anyOf.some(s => matchesSpan(code, s));
  return { text: line, pass: requiredOk && forbiddenOk && anyOfOk };
}

function scoreInvalidPattern(line: string, code: string): CriterionResult {
  const { required, forbidden, checkable } = classifySpans(line);
  if (!checkable) return { text: line, pass: null };
  const triggered = required.some(s => matchesSpan(code, s)) || forbidden.some(s => !matchesSpan(code, s));
  return { text: line, pass: !triggered };
}

function scoreEscapeHatch(line: string, code: string): CriterionResult {
  const { required, checkable } = classifySpans(line);
  if (!checkable || required.length === 0) return { text: line, pass: null };
  return { text: line, pass: required.some(s => matchesSpan(code, s)) };
}

export function scorePrompt(prompt: EvalPrompt, code: string): ScoreResult {
  const successResults = prompt.successCriteria.map(c => scoreSuccessCriterion(c, code));
  const invalidResults = prompt.invalidPatterns.map(c => scoreInvalidPattern(c, code));
  const escapeHatchResults = prompt.escapeHatches.map(c => scoreEscapeHatch(c, code));

  const anyInvalidTriggered = invalidResults.some(r => r.pass === false);
  const checkableSuccess = successResults.filter(r => r.pass !== null);
  const passedSuccess = checkableSuccess.filter(r => r.pass === true);
  const unchecked = successResults.filter(r => r.pass === null).length;

  const score = anyInvalidTriggered
    ? 0
    : checkableSuccess.length === 0
      ? 1
      : passedSuccess.length / checkableSuccess.length;

  const passed = !anyInvalidTriggered && checkableSuccess.every(r => r.pass === true);

  return {
    promptId: prompt.id,
    score,
    passed,
    successResults,
    invalidResults,
    escapeHatchResults,
    unchecked,
  };
}


// ── Global checks ────────────────────────────────────────────────────────────
// Code assertions applied to every candidate regardless of prompt — the "What agents should NOT do"
// rules from AGENTS.md. Reported as their own error-rate metrics; they don't change a prompt's score,
// so scores stay comparable with runs recorded before these checks existed.

export interface GlobalCheck {
  id: string;
  description: string;
  pattern: RegExp;
}

export const GLOBAL_CHECKS: GlobalCheck[] = [
  { id: 'hardcoded-color', description: 'Hardcoded color (#hex, rgb(), hsl())', pattern: /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/ },
  { id: 'hardcoded-size', description: 'Hardcoded px/rem value', pattern: /\b\d+(\.\d+)?(px|rem)\b/ },
  { id: 'inline-style', description: 'Inline style={{…}}', pattern: /style=\{\{/ },
  { id: 'raw-icon', description: 'Raw <IconXxx> tag instead of the Icon component / icon prop', pattern: /<Icon(?!Button\b)[A-Z]\w*/ },
  { id: 'icon-element-prop', description: 'icon={<IconXxx />} instead of icon={IconXxx}', pattern: /icon(End)?=\{</ },
  { id: 'on-click', description: 'onClick instead of onPress', pattern: /\bonClick=/ },
  { id: 'raw-div', description: '<div> instead of a Helix layout component', pattern: /<div\b/ },
  { id: 'raw-native-control', description: 'Native <button>/<input>/<select>/<textarea> instead of the Helix component', pattern: /<(button|input|select|textarea)\b/ },
];

export function runGlobalChecks(code: string): Record<string, boolean> {
  // true = the check FAILED (the bad pattern is present)
  return Object.fromEntries(GLOBAL_CHECKS.map(c => [c.id, c.pattern.test(code)]));
}

/** Rough error category for a failed criterion, used to group failures in eval:report / eval:review. */
export function categorizeFailure(text: string, kind: 'success' | 'invalid'): string {
  const t = text.toLowerCase();
  if (/anti-synonym|anti-sinónimo|\(not `/.test(t)) return 'anti-synonym';
  if (/invent|doesn't exist|does not exist|hand-built|instead of/.test(t)) return 'invented-or-bypassed';
  if (/hardcode|hex|color|style=/.test(t)) return 'hardcoded-value';
  if (/import/.test(t)) return 'wrong-import';
  if (/slot|children|start=|end=/.test(t)) return 'wrong-slot-or-composition';
  return kind === 'invalid' ? 'invalid-pattern' : 'missing-required';
}

// ── Run records ──────────────────────────────────────────────────────────────

export const outputsDir = path.resolve(import.meta.dirname, '../evals/outputs');
export const experimentsFile = path.resolve(import.meta.dirname, '../evals/experiments.json');

export type RunSource = 'self-test' | 'manual-input' | 'claude-cli';

export interface RunMeta {
  runId: string; // one per eval:generate / eval:run invocation
  variant: string; // experiment id (evals/experiments.json)
  model: string;
  rep: number; // repetition index within the run (0-based)
  timestamp: number;
  commit: string; // git sha the run was generated against (+"-dirty" if uncommitted changes)
  context?: string; // what system context the agent got (e.g. "AGENTS.md")
  cwd?: 'repo' | 'isolated';
}

export interface StoredRun extends ScoreResult, Partial<RunMeta> {
  source: RunSource;
  generatedCode: string;
  globalChecks?: Record<string, boolean>;
}

export type LoadedRun = Omit<StoredRun, keyof RunMeta> & RunMeta & {
  file: string;
  legacy: boolean; // recorded before run metadata existed — meta was inferred
};

export function gitCommit(at?: number): string {
  const opts = { encoding: 'utf-8' as const, cwd: path.resolve(import.meta.dirname, '..') };
  if (at !== undefined) {
    const r = spawnSync('git', ['rev-list', '-1', `--before=${Math.floor(at / 1000)}`, 'HEAD'], opts);
    return r.stdout.trim().slice(0, 7) || 'unknown';
  }
  const sha = spawnSync('git', ['rev-parse', '--short', 'HEAD'], opts).stdout.trim();
  const dirty = spawnSync('git', ['status', '--porcelain', '--', 'AGENTS.md', 'llms.txt', 'contracts', '.ai', 'packages', 'evals/prompts'], opts).stdout.trim();
  return dirty ? `${sha}-dirty` : sha;
}

/**
 * Loads every stored run. Runs recorded before run metadata existed get it inferred:
 * variant "legacy", runId grouped by source + 15-min gaps, commit from `git rev-list --before`.
 */
export function loadRuns(opts: { includeSelfTests?: boolean } = {}): LoadedRun[] {
  if (!fs.existsSync(outputsDir)) return [];
  const files = fs.readdirSync(outputsDir).filter(f => f.endsWith('.json')).sort();
  const raw: (StoredRun & { file: string; ts: number })[] = [];
  for (const f of files) {
    const run = JSON.parse(fs.readFileSync(path.join(outputsDir, f), 'utf-8')) as StoredRun;
    if (run.source === 'self-test' && !opts.includeSelfTests) continue;
    const ts = run.timestamp ?? Number(f.match(/-(\d+)\.json$/)?.[1] ?? 0);
    raw.push({ ...run, file: f, ts });
  }

  const legacyGroups = new Map<string, { last: number; runId: string }>();
  const commitCache = new Map<string, string>();
  const repCounter = new Map<string, number>();

  return raw
    .sort((a, b) => a.ts - b.ts)
    .map(run => {
      if (run.runId) {
        return { ...run, globalChecks: run.globalChecks ?? runGlobalChecks(run.generatedCode), legacy: false } as LoadedRun;
      }
      const group = legacyGroups.get(run.source);
      let runId: string;
      if (group && run.ts - group.last < 15 * 60_000) {
        runId = group.runId;
      } else {
        runId = `legacy-${run.source}-${new Date(run.ts).toISOString().slice(0, 16)}`;
      }
      legacyGroups.set(run.source, { last: run.ts, runId });
      if (!commitCache.has(runId)) commitCache.set(runId, gitCommit(run.ts));
      const repKey = `${runId}:${run.promptId}`;
      const rep = repCounter.get(repKey) ?? 0;
      repCounter.set(repKey, rep + 1);
      return {
        ...run,
        runId,
        variant: run.source === 'manual-input' ? 'legacy-manual' : 'legacy',
        model: run.source === 'manual-input' ? 'manual' : 'default',
        rep,
        timestamp: run.ts,
        commit: commitCache.get(runId)!,
        context: run.source === 'claude-cli' ? 'AGENTS.md' : 'unknown',
        cwd: 'repo',
        globalChecks: runGlobalChecks(run.generatedCode),
        legacy: true,
      } as LoadedRun;
    });
}

// ── Experiments registry ─────────────────────────────────────────────────────

export interface Experiment {
  id: string;
  description: string;
  hypothesis?: string;
  createdAt: string;
  commit: string;
}

export function loadExperiments(): Experiment[] {
  if (!fs.existsSync(experimentsFile)) return [];
  return JSON.parse(fs.readFileSync(experimentsFile, 'utf-8')) as Experiment[];
}

export function registerExperiment(id: string, description?: string, hypothesis?: string): Experiment {
  const all = loadExperiments();
  const existing = all.find(e => e.id === id);
  if (existing) return existing;
  if (!description) {
    throw new Error(`Experiment "${id}" isn't in evals/experiments.json yet — pass --note "<what changed>" to register it.`);
  }
  const exp: Experiment = { id, description, hypothesis, createdAt: new Date().toISOString(), commit: gitCommit() };
  all.push(exp);
  fs.writeFileSync(experimentsFile, JSON.stringify(all, null, 2) + '\n');
  return exp;
}

export function newRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

export function argValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
}
