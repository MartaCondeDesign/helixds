/**
 * Summarizes past `pnpm eval:run` results from evals/outputs/*.json.
 * Run: pnpm eval:report
 */
import fs from 'fs';
import path from 'path';

const outputsDir = path.resolve(import.meta.dirname, '../evals/outputs');

if (!fs.existsSync(outputsDir) || fs.readdirSync(outputsDir).filter(f => f.endsWith('.json')).length === 0) {
  console.log('No eval runs found — run `pnpm eval:run` (or `pnpm eval:run --self-test`) first.');
  process.exit(0);
}

interface StoredRun {
  promptId: string;
  score: number;
  passed: boolean;
  source: 'live' | 'self-test';
  unchecked: number;
}

const files = fs.readdirSync(outputsDir).filter(f => f.endsWith('.json'));
const runs: (StoredRun & { file: string })[] = files.map(f => ({
  ...(JSON.parse(fs.readFileSync(path.join(outputsDir, f), 'utf-8')) as StoredRun),
  file: f,
}));

// keep only the latest run per promptId (filenames are `${id}-${timestamp}.json`)
const latestByPrompt = new Map<string, (typeof runs)[number]>();
for (const run of runs) {
  const existing = latestByPrompt.get(run.promptId);
  if (!existing || run.file > existing.file) latestByPrompt.set(run.promptId, run);
}

const latest = [...latestByPrompt.values()].sort((a, b) => a.promptId.localeCompare(b.promptId));

console.log(`\n📊 eval:report — ${latest.length} prompt(s), ${runs.length} total run(s) on disk\n`);
for (const run of latest) {
  const icon = run.passed ? '✅' : '❌';
  console.log(`${icon} ${run.promptId.padEnd(20)} score ${(run.score * 100).toFixed(0).padStart(3)}%  (${run.source}${run.unchecked ? `, ${run.unchecked} unchecked` : ''})`);
}

const avg = latest.reduce((sum, r) => sum + r.score, 0) / latest.length;
console.log(`\nAverage score: ${(avg * 100).toFixed(0)}%`);
