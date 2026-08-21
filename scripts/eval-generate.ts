/**
 * Generates candidate code for eval prompts by invoking the Claude Code CLI
 * headlessly (`claude -p`) — runs under your existing Claude Code session/plan,
 * not a separate pay-per-token API key. Then scores the result with the same
 * scorer eval-run.ts uses. Mutating tools are disallowed on the sub-invocation
 * so it can only answer with code, not touch files in this repo.
 * Run: pnpm eval:generate [--prompt <id>] [--model <alias>]
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { loadPrompts, scorePrompt, extractCodeBlock, type ScoreResult } from './eval-lib';

const args = process.argv.slice(2);
const promptIdx = args.indexOf('--prompt');
const promptFilter = promptIdx !== -1 ? args[promptIdx + 1] : undefined;
const modelIdx = args.indexOf('--model');
const model = modelIdx !== -1 ? args[modelIdx + 1] : undefined;

const prompts = loadPrompts(promptFilter);
if (prompts.length === 0) {
  console.error(`No eval prompts found${promptFilter ? ` matching "${promptFilter}"` : ''}.`);
  process.exit(1);
}

const agentsMd = fs.readFileSync(path.resolve(import.meta.dirname, '../AGENTS.md'), 'utf-8');
const systemPrompt = `You are an engineer using the Helix design system in your app. Follow this guide exactly, and answer with a single tsx code block only — no explanation before or after it.\n\n${agentsMd}`;

const outputsDir = path.resolve(import.meta.dirname, '../evals/outputs');
const candidatesDir = path.join(outputsDir, 'candidates');
fs.mkdirSync(candidatesDir, { recursive: true });

function generate(promptText: string): string {
  const cliArgs = [
    '-p', promptText,
    '--append-system-prompt', systemPrompt,
    '--disallowedTools', 'Edit,Write,NotebookEdit,Bash,Agent,Artifact',
    '--output-format', 'text',
  ];
  if (model) cliArgs.push('--model', model);

  const result = spawnSync('claude', cliArgs, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 180_000,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`claude exited with code ${result.status}: ${result.stderr}`);
  }
  return result.stdout;
}

function report(result: ScoreResult) {
  const icon = result.passed ? '✅' : '❌';
  console.log(`\n${icon} ${result.promptId} — score ${(result.score * 100).toFixed(0)}%`);
  for (const r of result.successResults) {
    const mark = r.pass === null ? '➖' : r.pass ? '✓' : '✗';
    console.log(`   ${mark} ${r.text}`);
  }
  for (const r of result.invalidResults) {
    if (r.pass === false) console.log(`   ⚠️  INVALID PATTERN TRIGGERED: ${r.text}`);
  }
  if (result.unchecked > 0) {
    console.log(`   (${result.unchecked} criteria not mechanically checkable — needs manual review)`);
  }
}

const results: ScoreResult[] = [];

for (const p of prompts) {
  console.log(`\n⏳ generating candidate for "${p.id}" via claude -p ...`);
  const raw = generate(p.prompt);
  const code = extractCodeBlock(raw);
  fs.writeFileSync(path.join(candidatesDir, `${p.id}.tsx`), code);

  const result = scorePrompt(p, code);
  results.push(result);
  report(result);

  fs.writeFileSync(
    path.join(outputsDir, `${p.id}-${Date.now()}.json`),
    JSON.stringify({ ...result, source: 'claude-cli', generatedCode: code }, null, 2),
  );
}

const passedCount = results.filter(r => r.passed).length;
console.log(`\n${passedCount}/${results.length} prompts passed (claude -p mode).`);
