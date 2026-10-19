// pnpm eval:gallery — turns the agent answers already saved in evals/outputs/ into Storybook's
// "Data/Eval Gallery" page: every answer rendered live, per context level and rep, next to its score.
// No agent runs, no tokens: it only reads what `pnpm eval:generate` already produced.
// Writes apps/storybook/eval-gallery/ (git-ignored): one cells/<id>.tsx per answer + index.json.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { extractCodeBlock } from './eval-lib';

const root = path.resolve(import.meta.dirname, '..');
const outputsDir = path.join(root, 'evals/outputs');
const galleryDir = path.join(root, 'apps/storybook/eval-gallery');
const cellsDir = path.join(galleryDir, 'cells');

type Output = {
  promptId: string; variant?: string; context?: string; rep?: number; model?: string;
  score: number; passed: boolean; generatedCode?: string; timestamp?: string; runId?: string;
  usage?: { totalTokens?: number };
  durationMs?: number;
  round?: string;
  successResults?: Array<{ text: string; pass?: boolean | null }>;
  invalidResults?: Array<{ text: string; pass?: boolean | null }>;
  mechanical?: { compiles: boolean; compileErrors: string[]; lintProblems: Array<{ rule: string; message: string }> };
  judge?: { model: string; score: number; passed: boolean; verdicts: Array<{ id: string; pass: boolean; reason: string }> };
};

// What went wrong with one answer, in words: a made-up import first (nothing else matters if it can't
// build), then a compile error and invented props (eval-mechanical.ts), then each success criterion it
// missed and each invalid pattern it used.
// Package names are left out on purpose: "@helixds/react" and "@helixds/design-system" are the same problem,
// and the row status counts problems, not spellings. Code backticks are dropped for plain reading.
const plain = (text: string) => text.replace(/`/g, '');
// tsc prints whole object types; the first sentence is the part a reader needs.
const clip = (text: string) => (text.length > 140 ? `${text.slice(0, 140).trimEnd()}…` : text);
const issuesOf = (out: Output, unresolved: string | undefined, missing?: string, noCode?: string | null) => [
  ...(noCode ? [noCode] : []),
  ...(unresolved ? [out.variant === 'no-context' ? "Imports a package that doesn't exist (expected: Helix isn't public, so with no context the agent can't know it)" : "Imports a package that doesn't exist"] : []),
  ...(missing ? ["Imports a component Helix doesn't have"] : []),
  // tsc against Helix's real types (scripts/eval-mechanical.ts): the first error says what to fix.
  ...(!unresolved && !missing && out.mechanical && !out.mechanical.compiles
    ? [`Doesn't compile: ${clip(plain(out.mechanical.compileErrors[0]?.replace(/^\d+:\d+ /, '') ?? ''))}`] : []),
  ...(out.mechanical?.lintProblems ?? []).filter(p => /^helix\/(unknown-prop|prop-vocabulary)$/.test(p.rule)).map(p => `Invented prop: ${plain(p.message)}`),
  ...(out.successResults ?? []).filter(r => r.pass === false).map(r => `Missed: ${plain(r.text)}`),
  // The LLM judge's design verdict (eval-judge.ts), when the answer has been judged.
  ...(out.judge?.verdicts ?? []).filter(v => !v.pass).map(v => `Design (judge): ${v.id} — ${clip(plain(v.reason))}`),
  ...(out.invalidResults ?? []).filter(r => r.pass === false).map(r => `Used: ${plain(r.text.split(' — ')[0])}`),
];

// Everything @helixds/react really exports (generated from core's index.ts) — an answer importing a name
// that isn't there (an agent's made-up `HxTopBar`) fails to build, same as in a real app.
const coreExports = new Set<string>(JSON.parse(readFileSync(path.join(root, 'packages/eslint-plugin/src/data.json'), 'utf8')).coreExports);
const missingExport = (code: string) => {
  for (const m of code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]@helixds\/react['"]/g)) {
    const names = m[1].split(',').map(n => n.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]).filter(Boolean);
    const missing = names.find(n => !coreExports.has(n));
    if (missing) return missing;
  }
  return undefined;
};

// An answer the model wrote as prose ("Code is valid! The team page includes: …") isn't a .tsx file:
// written as-is it breaks Storybook's whole build (react-docgen: "Missing semicolon"). Take the fenced code
// block when there is one, then keep it only if TypeScript can parse it as TSX — otherwise the cell says
// "no code" instead of shipping a file nothing can compile.
const tsxSyntaxError = (code: string) => {
  const source = ts.createSourceFile('cell.tsx', code, ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX);
  const first = (source as unknown as { parseDiagnostics: ts.Diagnostic[] }).parseDiagnostics[0];
  return first ? ts.flattenDiagnosticMessageText(first.messageText, ' ') : undefined;
};

// A Helix subpath only resolves if the package's "exports" lists it — "@helixds/react/Button" (a deep import
// an agent guessed) doesn't, and would fail the whole Storybook build, not just its cell.
const helixExports = new Map(['react', 'tokens'].map(dir => [
  dir === 'react' ? '@helixds/react' : '@helixds/tokens',
  Object.keys(JSON.parse(readFileSync(path.join(root, 'packages', dir === 'react' ? 'core' : dir, 'package.json'), 'utf8')).exports ?? { '.': '' })
    .map(key => new RegExp(`^${key.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.+')}$`)),
]));
const resolvable = (spec: string) => {
  if (/^(react|react-dom)(\/|$)/.test(spec) || spec === '@tabler/icons-react') return true;
  const m = spec.match(/^(@helixds\/(?:react|tokens))(\/.*)?$/);
  return !!m && helixExports.get(m[1])!.some(key => key.test(`.${m[2] ?? ''}`));
};

rmSync(galleryDir, { recursive: true, force: true });
mkdirSync(cellsDir, { recursive: true });

const outputs = readdirSync(outputsDir).filter(f => f.endsWith('.json')).sort()
  .map(file => ({ file, out: JSON.parse(readFileSync(path.join(outputsDir, file), 'utf8')) as Output }))
  // Only experiment runs have a variant — older single answers can't be compared across contexts.
  .filter(({ out }) => out.variant);
// Same rule as Proof: per task × level, only the latest measurement round (eval:ladder --round) is shown;
// answers from before any round are all shown until a round replaces them.
const latestRound = new Map<string, string>();
for (const { out } of outputs) {
  const key = `${out.promptId}|${out.variant}`;
  if ((latestRound.get(key) ?? '') < (out.round ?? '')) latestRound.set(key, out.round!);
}

const cells = [];
for (const { file, out } of outputs) {
  if ((out.round ?? '') !== (latestRound.get(`${out.promptId}|${out.variant}`) ?? '')) continue;
  const id = file.replace(/\.json$/, '');
  const extracted = out.generatedCode?.trim() ? extractCodeBlock(out.generatedCode) : '';
  const syntaxError = extracted ? tsxSyntaxError(extracted) : undefined;
  const noCode = !extracted ? 'The answer has no code' : syntaxError ? `The answer isn't TSX code (${syntaxError})` : null;
  const code = noCode ? 'export {};\n' : extracted;
  // An import Storybook can't resolve (an agent inventing "@helixds/design-system") would raise Vite's
  // error overlay over the whole page — record it as the cell's build failure instead.
  const unresolved = noCode ? undefined : [...code.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)].map(m => m[1]).find(spec => !resolvable(spec));
  const missing = unresolved ? undefined : missingExport(code);
  // The no-context level is the control group: Helix isn't public, so a model told nothing can't know its
  // package or props. Say so on the card, so the red isn't read as a Helix bug.
  const control = out.variant === 'no-context'
    ? " — Expected: this is the control group. Helix isn't public, so an agent with no context can't know its package (@helixds/react) or props. Not a Helix bug; making Helix public is the only fix."
    : '';
  const buildError = noCode ?? (unresolved ? `Cannot resolve "${unresolved}"${control}` : missing ? `"@helixds/react" has no export "${missing}"${control}` : null);
  writeFileSync(path.join(cellsDir, `${id}.tsx`), buildError ? `export const __buildError = ${JSON.stringify(buildError)};\n` : code);
  cells.push({
    id, promptId: out.promptId, variant: out.variant,
    context: out.context && out.context.length > 40 ? path.basename(out.context) : out.context ?? null,
    rep: out.rep ?? null, model: out.model ?? null, score: out.score, passed: out.passed,
    compiles: out.mechanical ? out.mechanical.compiles && !buildError : null,
    judgeScore: out.judge ? out.judge.score : null,
    tokens: out.usage?.totalTokens ?? null,
    durationMs: out.durationMs ?? null,
    issues: issuesOf(out, unresolved, missing, noCode),
    timestamp: out.timestamp ?? out.runId ?? null,
  });
}

// Every task, run or not, so the picker shows what's still missing.
const allTasks = readdirSync(path.join(root, 'evals/prompts')).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')).sort();
writeFileSync(path.join(galleryDir, 'index.json'), JSON.stringify({ generatedAt: new Date().toISOString(), tasks: allTasks, cells }, null, 2));
const tasks = new Set(cells.map(c => c.promptId));
const variants = new Set(cells.map(c => c.variant));
console.log(`eval gallery: ${cells.length} answers · ${tasks.size} tasks · ${variants.size} context variants`);
console.log('Open Storybook → Data → Eval Gallery');
