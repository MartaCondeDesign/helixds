/**
 * Shared parsing + scoring for evals/prompts/*.md.
 * Scoring is pattern-based: each checklist line's backtick-quoted code spans are
 * checked for presence/absence in the candidate code. Lines with no backtick span
 * can't be checked mechanically and are reported as `pass: null` (manual review).
 */
import fs from 'fs';
import path from 'path';

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

export function loadPrompts(filterId?: string): EvalPrompt[] {
  const files = fs.readdirSync(promptsDir).filter(f => f.endsWith('.md'));
  const prompts = files.map(f => parsePromptFile(path.join(promptsDir, f)));
  return filterId ? prompts.filter(p => p.id === filterId) : prompts;
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
  checkable: boolean;
}

function classifySpans(line: string): ClassifiedSpans {
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
  const { required, forbidden, checkable } = classifySpans(line);
  if (!checkable) return { text: line, pass: null };
  const requiredOk = required.every(s => matchesSpan(code, s));
  const forbiddenOk = forbidden.every(s => !matchesSpan(code, s));
  return { text: line, pass: requiredOk && forbiddenOk };
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

