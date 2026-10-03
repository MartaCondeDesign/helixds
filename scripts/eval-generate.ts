/**
 * Generates candidate code for eval prompts by invoking the Claude Code CLI
 * headlessly (`claude -p`) — runs under your existing Claude Code session/plan,
 * not a separate pay-per-token API key. Then scores the result with the same
 * scorer eval-run.ts uses. Mutating tools are disallowed on the sub-invocation
 * so it can only answer with code, not touch files in this repo.
 *
 * LLM output varies run to run, so one answer per prompt isn't a measurement —
 * use --runs N to ask the same prompt N times and get a pass *rate*.
 * Every run is tagged with an experiment (--variant), the model, and the git commit,
 * so eval:report can compare a variant against the baseline.
 *
 * Run: pnpm eval:generate [--prompt <id>[,<id>…]] [--runs <n>] [--variant <id> --note "<what changed>"]
 *                         [--model <alias>] [--concurrency <n>] [--context <file>|none] [--isolated]
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import {
  loadPrompts, scorePrompt, extractCodeBlock, runGlobalChecks, registerExperiment,
  gitCommit, newRunId, argValue, outputsDir, type EvalPrompt, type ScoreResult, type RunMeta,
} from './eval-lib';

const args = process.argv.slice(2);
const promptFilter = argValue(args, '--prompt');
const model = argValue(args, '--model');
const runs = Number(argValue(args, '--runs') ?? 1);
const concurrency = Number(argValue(args, '--concurrency') ?? 3);
const variant = argValue(args, '--variant') ?? 'baseline';
const note = argValue(args, '--note');
const hypothesis = argValue(args, '--hypothesis');
const contextArg = argValue(args, '--context') ?? 'AGENTS.md';
const isolated = args.includes('--isolated');

const prompts = loadPrompts(promptFilter);
if (prompts.length === 0) {
  console.error(`No eval prompts found${promptFilter ? ` matching "${promptFilter}"` : ''}.`);
  process.exit(1);
}

registerExperiment(
  variant,
  note ?? (variant === 'baseline' ? 'Current repo state, unchanged — the reference every variant is compared against.' : undefined),
  hypothesis,
);

// --context: which guide the agent gets as system prompt. "none" = no Helix guide at all.
const repoRoot = path.resolve(import.meta.dirname, '..');
const guide = contextArg === 'none' ? '' : fs.readFileSync(path.resolve(repoRoot, contextArg), 'utf-8');
const systemPrompt = `You are an engineer using the Helix design system in your app. ${guide ? 'Follow this guide exactly, and answer' : 'Answer'} with a single tsx code block only — no explanation before or after it.${guide ? `\n\n${guide}` : ''}`;

// --isolated: run claude from an empty temp dir so it can't read CLAUDE.md / contracts / .ai from this repo —
// the only Helix knowledge it has is --context. Default (repo) matches how every earlier run was made.
const cwd = isolated ? fs.mkdtempSync(path.join(os.tmpdir(), 'helix-eval-')) : repoRoot;

const runId = newRunId();
const commit = gitCommit();
const candidatesDir = path.join(outputsDir, 'candidates', runId);
fs.mkdirSync(candidatesDir, { recursive: true });

function generate(promptText: string): Promise<string> {
  const cliArgs = [
    '-p', promptText,
    '--append-system-prompt', systemPrompt,
    '--disallowedTools', 'Edit,Write,NotebookEdit,Bash,Agent,Artifact',
    '--output-format', 'text',
  ];
  if (model) cliArgs.push('--model', model);

  return new Promise((resolve, reject) => {
    const child = spawn('claude', cliArgs, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('timed out after 180s')); }, 180_000);
    child.stdout.on('data', d => (stdout += d));
    child.stderr.on('data', d => (stderr += d));
    child.on('error', err => { clearTimeout(timer); reject(err); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`claude exited with code ${code}: ${(stderr || stdout).trim().slice(0, 300)}`));
      else resolve(stdout);
    });
  });
}

// Usage/rate limits surface as a non-zero exit — wait and retry instead of losing the generation.
async function generateWithRetry(promptText: string, attempts = 3): Promise<string> {
  for (let i = 1; ; i++) {
    try {
      return await generate(promptText);
    } catch (err) {
      if (i >= attempts) throw err;
      const waitS = 30 * i;
      console.error(`   ↻ retry ${i}/${attempts - 1} in ${waitS}s — ${(err as Error).message}`);
      await new Promise(r => setTimeout(r, waitS * 1000));
    }
  }
}

function reportOne(result: ScoreResult, rep: number) {
  const icon = result.passed ? '✅' : '❌';
  const repLabel = runs > 1 ? ` #${rep + 1}` : '';
  console.log(`\n${icon} ${result.promptId}${repLabel} — score ${(result.score * 100).toFixed(0)}%`);
  for (const r of result.successResults) {
    if (r.pass === false) console.log(`   ✗ ${r.text}`);
  }
  for (const r of result.invalidResults) {
    if (r.pass === false) console.log(`   ⚠️  INVALID PATTERN TRIGGERED: ${r.text}`);
  }
}

const jobs: { prompt: EvalPrompt; rep: number }[] = [];
for (const p of prompts) for (let rep = 0; rep < runs; rep++) jobs.push({ prompt: p, rep });

console.log(
  `\n⏳ ${jobs.length} generation(s): ${prompts.length} prompt(s) × ${runs} run(s) · variant "${variant}" · ` +
  `model ${model ?? 'default'} · context ${contextArg} · cwd ${isolated ? 'isolated' : 'repo'} · ${concurrency} at a time`,
);

const results: ScoreResult[] = [];
let failures = 0;

async function worker() {
  while (jobs.length > 0) {
    const { prompt: p, rep } = jobs.shift()!;
    try {
      const code = extractCodeBlock(await generateWithRetry(p.prompt));
      fs.writeFileSync(path.join(candidatesDir, `${p.id}-${rep}.tsx`), code);

      const result = scorePrompt(p, code);
      results.push(result);
      reportOne(result, rep);

      const meta: RunMeta = {
        runId, variant, model: model ?? 'default', rep, timestamp: Date.now(), commit,
        context: contextArg, cwd: isolated ? 'isolated' : 'repo',
      };
      fs.writeFileSync(
        path.join(outputsDir, `${p.id}-${meta.timestamp}-${rep}.json`),
        JSON.stringify({ ...result, ...meta, source: 'claude-cli', globalChecks: runGlobalChecks(code), generatedCode: code }, null, 2),
      );
    } catch (err) {
      failures++;
      console.error(`\n💥 ${p.id} #${rep + 1} failed to generate: ${(err as Error).message}`);
    }
  }
}

Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker)).then(() => {
  const passedCount = results.filter(r => r.passed).length;
  console.log(`\n${passedCount}/${results.length} generations passed (variant "${variant}", run ${runId}).`);
  if (failures) console.log(`${failures} generation(s) errored and weren't recorded.`);
  console.log(`See pass rates: pnpm eval:report --variant ${variant}`);
});
