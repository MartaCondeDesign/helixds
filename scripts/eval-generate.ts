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
 *                         [--mcp] [--lint-loop] [--round <id>]
 *
 * The context ladder the eval galleries compare (one --variant per level) is evals/ladder.json;
 * `pnpm eval:ladder` runs whatever is missing from it.
 *
 * Every stored answer records its token usage (all calls, lint rounds included) — `pnpm eval:ladder`
 * estimates a run's cost from it.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { validateSnippet } from '../packages/mcp/src/validate.ts';
import { checkMechanical } from './eval-mechanical.ts';
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
// --mcp: the agent can call the Helix MCP tools (contracts, token search, snippet validation) while it works.
const useMcp = args.includes('--mcp');
// --lint-loop: after each answer, the Helix lint problems go back to the agent to fix — what the Claude Code
// lint hook (scripts/claude-lint-hook.mjs) does in a real session — up to LINT_ROUNDS times.
const lintLoop = args.includes('--lint-loop');
const LINT_ROUNDS = 2;
// --round: the measurement round (pnpm eval:ladder --round) this answer belongs to.
const round = argValue(args, '--round');

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

// Every run gets an explicit MCP config (--strict-mcp-config), so a level only has the servers it names —
// never whatever .mcp.json or user settings happen to load.
const mcpConfigPath = path.join(os.tmpdir(), `helix-eval-mcp-${process.pid}.json`);
fs.writeFileSync(mcpConfigPath, JSON.stringify({
  mcpServers: useMcp ? { helix: { command: 'pnpm', args: ['-s', '--dir', repoRoot, 'helix:mcp'] } } : {},
}));

const runId = newRunId();
const commit = gitCommit();
const candidatesDir = path.join(outputsDir, 'candidates', runId);
fs.mkdirSync(candidatesDir, { recursive: true });

export type Usage = { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number; totalTokens: number; costUsd: number; calls: number };
const emptyUsage = (): Usage => ({ inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, totalTokens: 0, costUsd: 0, calls: 0 });

function addUsage(total: Usage, raw: any) {
  const u = raw?.usage ?? {};
  const add = { inputTokens: u.input_tokens ?? 0, outputTokens: u.output_tokens ?? 0, cacheReadTokens: u.cache_read_input_tokens ?? 0, cacheWriteTokens: u.cache_creation_input_tokens ?? 0 };
  total.inputTokens += add.inputTokens;
  total.outputTokens += add.outputTokens;
  total.cacheReadTokens += add.cacheReadTokens;
  total.cacheWriteTokens += add.cacheWriteTokens;
  total.totalTokens += add.inputTokens + add.outputTokens + add.cacheReadTokens + add.cacheWriteTokens;
  total.costUsd += raw?.total_cost_usd ?? 0;
  total.calls++;
}

// Returns the answer text; adds the call's tokens to `usage`.
function generate(promptText: string, usage: Usage): Promise<string> {
  const cliArgs = [
    '-p', promptText,
    '--append-system-prompt', systemPrompt,
    '--disallowedTools', 'Edit,Write,NotebookEdit,Bash,Agent,Artifact',
    '--output-format', 'json',
    '--strict-mcp-config', '--mcp-config', mcpConfigPath,
  ];
  if (useMcp) cliArgs.push('--allowedTools', 'mcp__helix');
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
      let result: any;
      try { result = JSON.parse(stdout); } catch { /* not JSON: report below */ }
      if (code !== 0 || !result || result.is_error) {
        reject(new Error(`claude ${code !== 0 ? `exited with code ${code}` : 'failed'}: ${(result?.result ?? stderr ?? stdout).toString().trim().slice(0, 300)}`));
        return;
      }
      addUsage(usage, result);
      resolve(String(result.result ?? ''));
    });
  });
}

// Usage/rate limits surface as a non-zero exit — wait and retry instead of losing the generation.
async function generateWithRetry(promptText: string, usage: Usage, attempts = 3): Promise<string> {
  for (let i = 1; ; i++) {
    try {
      return await generate(promptText, usage);
    } catch (err) {
      // A logged-out CLI won't fix itself by waiting.
      if (i >= attempts || /authenticat|log ?in/i.test((err as Error).message)) throw err;
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
  `model ${model ?? 'default'} · context ${contextArg} · cwd ${isolated ? 'isolated' : 'repo'}` +
  `${useMcp ? ' · Helix MCP' : ''}${lintLoop ? ' · lint loop' : ''} · ${concurrency} at a time`,
);

const results: ScoreResult[] = [];
let runTokens = 0;
let loggedOut = false;
let failures = 0;

async function worker() {
  while (jobs.length > 0) {
    const { prompt: p, rep } = jobs.shift()!;
    try {
      const usage = emptyUsage();
      let code = extractCodeBlock(await generateWithRetry(p.prompt, usage));
      let lintRounds = 0;
      while (lintLoop && lintRounds < LINT_ROUNDS) {
        const { problems } = await validateSnippet(code);
        if (!problems.length) break;
        lintRounds++;
        const report = problems.map(m => `${m.line}:${m.column} ${m.rule} — ${m.message}`).join('\n');
        code = extractCodeBlock(await generateWithRetry(
          `${p.prompt}\n\nYour previous answer:\n\n\`\`\`tsx\n${code}\n\`\`\`\n\nHelix lint found ${problems.length} problem(s) in it. Fix them and answer again:\n${report}`,
          usage,
        ));
      }
      fs.writeFileSync(path.join(candidatesDir, `${p.id}-${rep}.tsx`), code);

      const result = scorePrompt(p, code);
      results.push(result);
      reportOne(result, rep);
      const mechanical = await checkMechanical(code);
      console.log(`   ${mechanical.compiles ? 'compiles' : `doesn't compile (${mechanical.compileErrors.length} error${mechanical.compileErrors.length > 1 ? 's' : ''}): ${mechanical.compileErrors[0]}`}`);
      console.log(`   ${usage.totalTokens.toLocaleString()} tokens (${usage.calls} call${usage.calls > 1 ? 's' : ''})`);
      runTokens += usage.totalTokens;

      const meta: RunMeta = {
        runId, variant, model: model ?? 'default', rep, timestamp: Date.now(), commit,
        context: contextArg, cwd: isolated ? 'isolated' : 'repo',
        mcp: useMcp, ...(lintLoop ? { lintRounds } : {}), ...(round ? { round } : {}),
      };
      fs.writeFileSync(
        path.join(outputsDir, `${p.id}-${meta.timestamp}-${rep}.json`),
        JSON.stringify({ ...result, ...meta, source: 'claude-cli', globalChecks: runGlobalChecks(code, mechanical), mechanical, usage, generatedCode: code }, null, 2),
      );
    } catch (err) {
      failures++;
      console.error(`\n💥 ${p.id} #${rep + 1} failed to generate: ${(err as Error).message}`);
      // Logged out: every remaining generation would fail the same way — stop instead of trying them all.
      if (/authenticat|log ?in/i.test((err as Error).message)) {
        loggedOut = true;
        jobs.length = 0;
      }
    }
  }
}

Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker)).then(() => {
  const passedCount = results.filter(r => r.passed).length;
  console.log(`\n${passedCount}/${results.length} generations passed (variant "${variant}", run ${runId}).`);
  console.log(`Tokens used: ${runTokens.toLocaleString()} (${results.length ? Math.round(runTokens / results.length).toLocaleString() : 0} per answer).`);
  if (failures) console.log(`${failures} generation(s) errored and weren't recorded.`);
  if (loggedOut) {
    console.error('\nClaude Code is logged out — run `claude`, then /login, and try again.');
    process.exit(1);
  }
  console.log(`See pass rates: pnpm eval:report --variant ${variant}`);
});
