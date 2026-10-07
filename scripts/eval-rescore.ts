/**
 * Re-scores every saved answer in evals/outputs/ against the current prompts and global checks — no agent
 * runs, no tokens. Run it after changing a prompt's criteria or the prop vocabulary (ADR-022 renamed
 * onPress → onClick and loading → isLoading, so older answers were scored against the old names), so
 * the galleries' stored scores match what Metrics computes.
 *
 * Run: pnpm eval:rescore
 */
import fs from 'fs';
import path from 'path';
import { loadPrompts, scorePrompt, runGlobalChecks, outputsDir } from './eval-lib';

const prompts = new Map(loadPrompts().map(p => [p.id, p]));
let rescored = 0, changed = 0;
for (const file of fs.readdirSync(outputsDir).filter(f => f.endsWith('.json'))) {
  const full = path.join(outputsDir, file);
  const run = JSON.parse(fs.readFileSync(full, 'utf-8'));
  const prompt = prompts.get(run.promptId);
  if (!prompt || typeof run.generatedCode !== 'string') continue;
  const result = scorePrompt(prompt, run.generatedCode);
  rescored++;
  if (result.score !== run.score || result.passed !== run.passed) changed++;
  fs.writeFileSync(full, JSON.stringify({ ...run, ...result, globalChecks: runGlobalChecks(run.generatedCode) }, null, 2));
}
console.log(`Re-scored ${rescored} answer(s) against the current prompts — ${changed} changed score or pass.`);
