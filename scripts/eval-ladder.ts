/**
 * The context ladder (evals/ladder.json): every eval task × every level × `runs` answers.
 *
 * Two modes, both a free dry run unless --yes is passed:
 *   fill     (default)  generate only the task × level answers that are missing
 *   --round             a new measurement round: fresh answers for every selected task × level, recorded
 *                       in evals/rounds.json with its date and commit, so rounds can be compared over time
 *                       (Metrics → Agent Context Ladder; Proof's "Run evals" button starts one)
 *
 * Run: pnpm eval:ladder [--round] [--runs <n>] [--levels <variant>,…] [--prompt <id>,…] [--model <alias>]
 *                       [--yes] [--json]
 *   pnpm eval:ladder                                          what's missing and its estimated tokens
 *   pnpm eval:ladder --prompt button-basic --runs 1 --yes     cheap pilot: measures tokens per level
 *   pnpm eval:ladder --round --runs 1 --yes                   measure everything once, recorded
 *   --json prints the plan as JSON (for Proof's button) and never generates.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { loadPrompts, loadRuns, scorePrompt, outputsDir, argValue, gitCommit } from './eval-lib';

type Level = { variant: string; label: string; detail: string; flags: string[] };
const repoRoot = path.resolve(import.meta.dirname, '..');
const ladder = JSON.parse(fs.readFileSync(path.join(repoRoot, 'evals/ladder.json'), 'utf-8')) as { runs: number; levels: Level[] };
export const roundsFile = path.join(repoRoot, 'evals/rounds.json');

const args = process.argv.slice(2);
const isRound = args.includes('--round');
const runs = Number(argValue(args, '--runs') ?? ladder.runs);
const levelFilter = argValue(args, '--levels')?.split(',');
const model = argValue(args, '--model');
const asJson = args.includes('--json');
const go = args.includes('--yes') && !asJson;
const levels = ladder.levels.filter(l => !levelFilter || levelFilter.includes(l.variant));
const prompts = loadPrompts(argValue(args, '--prompt'));

// What's on disk: answers per (variant, task), and tokens per answer where it was recorded.
const have = new Map<string, number>();
const tokens = new Map<string, number[]>();
for (const file of fs.readdirSync(outputsDir).filter(f => f.endsWith('.json'))) {
  const run = JSON.parse(fs.readFileSync(path.join(outputsDir, file), 'utf-8'));
  if (!run.variant) continue;
  const key = `${run.variant}|${run.promptId}`;
  have.set(key, (have.get(key) ?? 0) + 1);
  if (run.usage?.totalTokens) tokens.set(run.variant, [...(tokens.get(run.variant) ?? []), run.usage.totalTokens]);
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const allMeasured = [...tokens.values()].flat();
const perAnswer = (variant: string) =>
  tokens.get(variant)?.length ? { tokens: mean(tokens.get(variant)!), basis: 'measured' as const }
  : allMeasured.length ? { tokens: mean(allMeasured), basis: 'other levels' as const }
  : null;
const fmt = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(Math.round(n));

// Per level: which tasks need how many answers — all of them in a round, only the missing ones otherwise.
const plan = levels.map(level => {
  const needed = prompts
    .map(p => ({ id: p.id, count: isRound ? runs : Math.max(0, runs - (have.get(`${level.variant}|${p.id}`) ?? 0)) }))
    .filter(m => m.count > 0);
  const answers = needed.reduce((n, m) => n + m.count, 0);
  const estimate = perAnswer(level.variant);
  return { level, needed, answers, estimate, estTokens: estimate ? estimate.tokens * answers : null };
});
const totalAnswers = plan.reduce((n, p) => n + p.answers, 0);
const estimable = plan.filter(p => p.answers && p.estTokens !== null);
const totalTokens = estimable.reduce((n, p) => n + p.estTokens!, 0);

if (asJson) {
  console.log(JSON.stringify({
    mode: isRound ? 'round' : 'fill', runs, tasks: prompts.length, answers: totalAnswers,
    estTokens: estimable.length ? Math.round(totalTokens) : null,
    complete: estimable.length === plan.filter(p => p.answers).length,
    levels: plan.map(p => ({ variant: p.level.variant, label: p.level.label, answers: p.answers, estTokens: p.estTokens === null ? null : Math.round(p.estTokens), basis: p.estimate?.basis ?? null })),
  }));
  process.exit(0);
}

console.log(`\n${isRound ? 'New measurement round' : 'Fill missing answers'} · ${prompts.length} task(s) × ${levels.length} level(s) × ${runs} run(s)\n`);
console.log('level                 tasks   answers   est. tokens');
for (const { level, needed, answers, estimate, estTokens } of plan) {
  const est = !answers ? '—' : estTokens !== null ? `~${fmt(estTokens)}${estimate!.basis === 'measured' ? '' : '*'}` : 'unknown';
  console.log(`${level.label.padEnd(22)}${String(needed.length).padStart(5)}${String(answers).padStart(10)}   ${est}`);
}
console.log(`\nTotal: ${totalAnswers} answer(s)${estimable.length ? `, ~${fmt(totalTokens)} tokens` : ''}${estimable.length < plan.filter(p => p.answers).length ? ' (+ levels with no estimate)' : ''}`);
if (plan.some(p => p.answers && p.estimate?.basis === 'other levels')) {
  console.log('* estimated from other levels — MCP calls and lint rounds make those levels cost more.');
}
if (!allMeasured.length && totalAnswers) {
  console.log('No answer has recorded tokens yet — measure first with a cheap pilot:\n  pnpm eval:ladder --prompt button-basic --runs 1 --yes');
}
if (!totalAnswers) { console.log('Nothing to generate.'); process.exit(0); }
if (!go) { console.log('\nDry run — nothing generated. Add --yes to generate.'); process.exit(0); }

// To the second: two rounds started in the same minute (a stopped one, then its rerun) must not share an id.
const roundId = isRound ? new Date().toISOString().slice(0, 19).replace(/:/g, '-') : null;
for (const { level, needed } of plan) {
  // eval:generate takes one --runs per call: group the tasks by how many answers each needs.
  const byCount = new Map<number, string[]>();
  for (const m of needed) byCount.set(m.count, [...(byCount.get(m.count) ?? []), m.id]);
  for (const [count, ids] of byCount) {
    console.log(`\n▶ ${level.label}: ${ids.length} task(s) × ${count}`);
    const genArgs = ['tsx', 'scripts/eval-generate.ts', '--variant', level.variant, '--note', `${level.label} — ${level.detail}`,
      ...level.flags, '--prompt', ids.join(','), '--runs', String(count),
      ...(model ? ['--model', model] : []), ...(roundId ? ['--round', roundId] : [])];
    const { status } = spawnSync('npx', genArgs, { cwd: repoRoot, stdio: 'inherit' });
    if (status !== 0) { console.error(`eval:generate failed for ${level.label} — stopping.`); process.exit(status ?? 1); }
  }
}

if (roundId && !loadRuns().some(run => (run as { round?: string }).round === roundId)) {
  console.log('\nNo answers were generated, so no round was recorded.');
} else if (roundId) {
  // Record the round: per level, how its answers did and what they cost — Metrics charts these over time.
  const promptById = new Map(loadPrompts().map(p => [p.id, p]));
  const roundRuns = loadRuns().filter(run => (run as { round?: string }).round === roundId).map(run => {
    const prompt = promptById.get(run.promptId);
    return prompt ? { ...run, ...scorePrompt(prompt, run.generatedCode) } : run;
  });
  const entry = {
    id: roundId,
    date: new Date().toISOString(),
    commit: gitCommit(),
    runs,
    tasks: prompts.map(p => p.id),
    levels: levels.map(level => {
      const rs = roundRuns.filter(run => run.variant === level.variant);
      const measured = rs.filter(run => run.usage?.totalTokens);
      const spent = measured.reduce((n, run) => n + (run.usage?.totalTokens ?? 0), 0);
      return {
        variant: level.variant, label: level.label, answers: rs.length,
        passRate: rs.length ? rs.filter(run => run.passed).length / rs.length : null,
        meanScore: rs.length ? rs.reduce((n, run) => n + run.score, 0) / rs.length : null,
        tokensPerAnswer: measured.length ? spent / measured.length : null,
        totalTokens: measured.length ? spent : null,
      };
    }),
  };
  const rounds = fs.existsSync(roundsFile) ? JSON.parse(fs.readFileSync(roundsFile, 'utf-8')) : [];
  fs.writeFileSync(roundsFile, JSON.stringify([...rounds, entry], null, 2) + '\n');
  console.log(`\nRound ${roundId} recorded in evals/rounds.json.`);
}
console.log('\nDone. See it: eg  (Proof)  ·  pnpm eval:gallery  (Storybook)  ·  pnpm quality snapshot  (Metrics)');
