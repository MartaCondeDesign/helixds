// Reads saved answers and normalizes them into gallery cells. Pure — no browser, no Vite.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** One saved answer. Only these fields are read; anything else in the file is ignored. */
export type Answer = {
  promptId: string;
  variant?: string;
  rep?: number;
  score: number;
  passed: boolean;
  generatedCode?: string;
  model?: string;
  timestamp?: string;
  /** Tokens the answer cost, all calls included. */
  usage?: { totalTokens?: number };
  /** What went wrong, in words — or, in Helix's eval format, read from the criteria it missed
   * (`successResults`) and the invalid patterns it used (`invalidResults`, `pass: false`). */
  issues?: string[];
  successResults?: Array<{ text: string; pass?: boolean | null }>;
  invalidResults?: Array<{ text: string; pass?: boolean | null }>;
  /** The measurement round the answer belongs to (a sortable timestamp id). Per task × variant, only the
   * latest round is shown, so a new round replaces what you see instead of piling up next to it; answers
   * without a round are all shown until a round exists. */
  round?: string;
};

export type Cell = {
  id: string;
  task: string;
  variant: string;
  rep: number;
  /** 0–100 */
  score: number;
  passed: boolean;
  model: string | null;
  /** Tokens the answer cost; null when not recorded. */
  tokens: number | null;
  /** What went wrong, build-breaking first — the row's status line counts these. */
  issues: string[];
  code: string;
  /** Set when the answer can't be built at all (unknown import, no code). */
  buildError: string | null;
  /** Set after rendering. */
  renderError?: string | null;
  screenshot?: string | null;
  /** axe (WCAG 2.2 AA) violations on the rendered answer; absent when it didn't render. */
  a11y?: { id: string; impact: string | null; help: string; nodes: number }[];
};

const importSpecs = (code: string) =>
  [...code.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g)].map(m => m[1]);

export function unresolvedImport(code: string, allowed: string[]): string | null {
  return importSpecs(code).find(spec =>
    !spec.startsWith('.') && !allowed.some(pkg => spec === pkg || spec.startsWith(`${pkg}/`)),
  ) ?? null;
}

// Package names left out on purpose: two made-up names are the same problem, and the status line counts
// problems, not spellings. Code backticks dropped for plain reading.
const plain = (text: string) => text.replace(/`/g, '');
function issuesOf(answer: Answer, unresolved: string | null) {
  if (answer.issues) return answer.issues;
  return [
    ...(unresolved ? ["Imports a package that doesn't exist"] : []),
    ...(answer.successResults ?? []).filter(r => r.pass === false).map(r => `Missed: ${plain(r.text)}`),
    ...(answer.invalidResults ?? []).filter(r => r.pass === false).map(r => `Used: ${plain(r.text.split(' — ')[0])}`),
  ];
}

export function readCells(outputsDir: string, allowed: string[]): Cell[] {
  const cells: (Cell & { batch: string })[] = [];
  for (const file of readdirSync(outputsDir).filter(f => f.endsWith('.json')).sort()) {
    const answer = JSON.parse(readFileSync(path.join(outputsDir, file), 'utf8')) as Answer;
    // Answers without a variant aren't part of a context comparison.
    if (!answer.variant || !answer.promptId) continue;
    const code = answer.generatedCode?.trim() ?? '';
    const unresolved = code ? unresolvedImport(code, allowed) : null;
    cells.push({
      id: file.replace(/\.json$/, '').replace(/[^\w-]/g, '_'),
      task: answer.promptId,
      variant: answer.variant,
      rep: answer.rep ?? 0,
      score: answer.score <= 1 ? answer.score * 100 : answer.score,
      passed: answer.passed,
      model: answer.model ?? null,
      tokens: answer.usage?.totalTokens ?? null,
      issues: issuesOf(answer, unresolved),
      code,
      buildError: !code ? 'No code in the answer' : unresolved ? `Cannot resolve "${unresolved}"` : null,
      batch: answer.round ?? '',
    });
  }
  // Round ids are timestamps, so the greatest is the latest; no round ('') loses to any round.
  const latest = new Map<string, string>();
  for (const c of cells) {
    const key = `${c.task}|${c.variant}`;
    if ((latest.get(key) ?? '') < c.batch) latest.set(key, c.batch);
  }
  return cells.filter(c => c.batch === (latest.get(`${c.task}|${c.variant}`) ?? '')).map(({ batch: _, ...cell }) => cell);
}
