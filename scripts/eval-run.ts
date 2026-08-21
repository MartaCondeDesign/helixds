/**
 * Scores eval prompts (evals/prompts/*.md) against code — no API calls, free to run.
 * Default: scores each prompt's own "Expected output shape" (the harness self-check).
 * --input <file>: scores a code file you paste in by hand (e.g. output from another
 * tool) against one prompt's criteria — pass --prompt <id> to pick which one.
 * Run: pnpm eval:run [--prompt <id>] [--input <file>]
 */
import fs from 'fs';
import path from 'path';
import { loadPrompts, scorePrompt, type ScoreResult } from './eval-lib';

const args = process.argv.slice(2);
const promptIdx = args.indexOf('--prompt');
const promptFilter = promptIdx !== -1 ? args[promptIdx + 1] : undefined;
const inputIdx = args.indexOf('--input');
const inputFile = inputIdx !== -1 ? args[inputIdx + 1] : undefined;

if (inputFile && !promptFilter) {
  console.error('--input requires --prompt <id> to pick which prompt to score against.');
  process.exit(1);
}

const prompts = loadPrompts(promptFilter);
if (prompts.length === 0) {
  console.error(`No eval prompts found${promptFilter ? ` matching "${promptFilter}"` : ''}.`);
  process.exit(1);
}

const outputsDir = path.resolve(import.meta.dirname, '../evals/outputs');
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
    console.log(`   (${result.unchecked} criteria not mechanically checkable — needs manual review)`);
  }
}

const results: ScoreResult[] = [];

for (const p of prompts) {
  const code = inputFile ? fs.readFileSync(inputFile, 'utf-8') : p.expectedOutput;
  const result = scorePrompt(p, code);
  results.push(result);
  report(result);

  fs.writeFileSync(
    path.join(outputsDir, `${p.id}-${Date.now()}.json`),
    JSON.stringify({ ...result, source: inputFile ? 'manual-input' : 'self-test', generatedCode: code }, null, 2),
  );
}

const passedCount = results.filter(r => r.passed).length;
console.log(`\n${passedCount}/${results.length} prompts passed.`);
