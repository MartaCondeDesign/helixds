/**
 * Scores eval prompts (evals/prompts/*.md) against code — no API calls, free to run.
 * Default: scores each prompt's own "Expected output shape" (the harness self-check) — this checks the
 * EVAL, not the design system, so it isn't saved to evals/outputs/ unless you pass --save.
 * --input <file>: scores a code file you paste in by hand (e.g. output from another
 * tool) against one prompt's criteria — pass --prompt <id> to pick which one. Always saved, tagged with
 * --variant (default "manual") so eval:report can count it.
 * Run: pnpm eval:run [--prompt <id>] [--input <file> [--variant <id>]] [--save]
 */
import fs from 'fs';
import path from 'path';
import {
  loadPrompts, scorePrompt, runGlobalChecks, gitCommit, newRunId, argValue, outputsDir, type ScoreResult,
} from './eval-lib';

const args = process.argv.slice(2);
const promptFilter = argValue(args, '--prompt');
const inputFile = argValue(args, '--input');
const variant = argValue(args, '--variant') ?? 'manual';
const save = args.includes('--save');

if (inputFile && !promptFilter) {
  console.error('--input requires --prompt <id> to pick which prompt to score against.');
  process.exit(1);
}

const prompts = loadPrompts(promptFilter);
if (prompts.length === 0) {
  console.error(`No eval prompts found${promptFilter ? ` matching "${promptFilter}"` : ''}.`);
  process.exit(1);
}

fs.mkdirSync(outputsDir, { recursive: true });

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
    console.log(`   (${result.unchecked} criteria not mechanically checkable — covered by the global checks in eval:report)`);
  }
}

const results: ScoreResult[] = [];
const runId = newRunId();
const commit = inputFile || save ? gitCommit() : '';

for (const p of prompts) {
  const code = inputFile ? fs.readFileSync(inputFile, 'utf-8') : p.expectedOutput;
  const result = scorePrompt(p, code);
  results.push(result);
  report(result);

  if (inputFile || save) {
    const timestamp = Date.now();
    fs.writeFileSync(
      path.join(outputsDir, `${p.id}-${timestamp}.json`),
      JSON.stringify({
        ...result,
        runId, variant: inputFile ? variant : 'self-test', model: inputFile ? 'manual' : 'reference', rep: 0, timestamp, commit,
        source: inputFile ? 'manual-input' : 'self-test',
        globalChecks: runGlobalChecks(code),
        generatedCode: code,
      }, null, 2),
    );
  }
}

const passedCount = results.filter(r => r.passed).length;
console.log(`\n${passedCount}/${results.length} prompts passed.`);

// Self-test mode (no --input) scores each prompt's OWN reference code — a failure there means the prompt's
// criteria are broken, so exit non-zero and let the pre-commit hook block it. With --input, a failing
// score is the measurement itself, not an error.
if (!inputFile && passedCount < results.length) process.exit(1);
