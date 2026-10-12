/**
 * Summarizes stored eval runs (evals/outputs/*.json) as error RATES per experiment variant.
 * Self-tests are excluded — they check the eval itself, not the design system (see "Eval health").
 * Every run is re-scored from its stored generatedCode with the CURRENT prompt criteria, so fixing a
 * badly-phrased criterion updates old runs too (pass --stored to use the score saved at run time).
 *
 * Run: pnpm eval:report                        every variant, one line each
 *      pnpm eval:report --variant <id>         per-prompt pass rates, error categories, global checks
 *      pnpm eval:report --compare <a> <b>      variant b vs a (baseline), per prompt + per error
 */
import {
  loadPrompts, loadRuns, loadExperiments, scorePrompt, categorizeFailure, argValue,
  GLOBAL_CHECKS, type LoadedRun,
} from './eval-lib';

const args = process.argv.slice(2);
const variantArg = argValue(args, '--variant');
const compareIdx = args.indexOf('--compare');
const compare = compareIdx !== -1 ? [args[compareIdx + 1], args[compareIdx + 2]] as const : undefined;
const useStored = args.includes('--stored');

const prompts = new Map(loadPrompts().map(p => [p.id, p]));

// ── Re-score with current criteria ───────────────────────────────────────────
const runs: (LoadedRun & { storedPassed: boolean })[] = loadRuns().map(run => {
  const prompt = prompts.get(run.promptId);
  if (useStored || !prompt) return { ...run, storedPassed: run.passed };
  return { ...run, ...scorePrompt(prompt, run.generatedCode), storedPassed: run.passed };
});

// Average agent time per answer; '–' when none of them recorded a duration (runs from before it was tracked).
const avgTime = (rs: LoadedRun[]) => {
  const timed = rs.filter(r => typeof r.durationMs === 'number');
  return timed.length ? `${(timed.reduce((s, r) => s + r.durationMs!, 0) / timed.length / 1000).toFixed(1)}s` : '–';
};
const pct = (n: number, d: number) => (d === 0 ? '  –' : `${Math.round((n / d) * 100)}%`.padStart(4));
const byVariant = groupBy(runs, r => r.variant);

function groupBy<T>(items: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) m.set(key(it), [...(m.get(key(it)) ?? []), it]);
  return m;
}

function evalHealth() {
  const all = [...prompts.values()];
  const broken = all.filter(p => !scorePrompt(p, p.expectedOutput).passed);
  console.log(
    broken.length === 0
      ? `🩺 Eval health: ${all.length}/${all.length} reference answers score 100% — the criteria themselves are sound.`
      : `🩺 Eval health: ${broken.length} prompt(s) fail on their OWN reference answer (${broken.map(p => p.id).join(', ')}) — fix those criteria before trusting results.`,
  );
}

interface ErrorTally { category: string; text: string; promptId: string; count: number }

function tallyErrors(rs: LoadedRun[]): ErrorTally[] {
  const m = new Map<string, ErrorTally>();
  for (const r of rs) {
    const failed = [
      ...r.successResults.filter(c => c.pass === false).map(c => ({ c, kind: 'success' as const })),
      ...r.invalidResults.filter(c => c.pass === false).map(c => ({ c, kind: 'invalid' as const })),
    ];
    for (const { c, kind } of failed) {
      const key = `${r.promptId}::${c.text}`;
      const t = m.get(key) ?? { category: categorizeFailure(c.text, kind), text: c.text, promptId: r.promptId, count: 0 };
      t.count++;
      m.set(key, t);
    }
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}

function globalRates(rs: LoadedRun[]) {
  return GLOBAL_CHECKS.map(c => ({ ...c, failed: rs.filter(r => r.globalChecks?.[c.id]).length }));
}

// ── Views ────────────────────────────────────────────────────────────────────

function overview() {
  const experiments = new Map(loadExperiments().map(e => [e.id, e]));
  console.log(`\n📊 eval:report — ${runs.length} recorded generation(s) across ${byVariant.size} variant(s)\n`);
  evalHealth();
  if (runs.length === 0) {
    console.log('\nNo generations yet — run `pnpm eval:generate --runs 5` to collect a baseline.');
    return;
  }
  console.log(`\n${'variant'.padEnd(18)} ${'gens'.padStart(5)} ${'prompts'.padStart(8)} ${'pass rate'.padStart(10)} ${'avg score'.padStart(10)} ${'avg time'.padStart(9)}  model · commit`);
  for (const [variant, rs] of [...byVariant].sort((a, b) => a[1][0].timestamp - b[1][0].timestamp)) {
    const promptsCovered = new Set(rs.map(r => r.promptId)).size;
    const passed = rs.filter(r => r.passed).length;
    const avg = rs.reduce((s, r) => s + r.score, 0) / rs.length;
    const models = [...new Set(rs.map(r => r.model))].join(',');
    const commits = [...new Set(rs.map(r => r.commit))].join(',');
    console.log(
      `${variant.padEnd(18)} ${String(rs.length).padStart(5)} ${String(promptsCovered).padStart(8)} ` +
      `${`${passed}/${rs.length}`.padStart(6)} ${pct(passed, rs.length)} ${`${Math.round(avg * 100)}%`.padStart(10)} ${avgTime(rs).padStart(9)}  ${models} · ${commits}`,
    );
    const storedPassed = rs.filter(r => r.storedPassed).length;
    if (!useStored && storedPassed !== passed) {
      console.log(`${''.padEnd(18)} ↳ scored ${storedPassed}/${rs.length} with the criteria it was run against — the prompt criteria changed since (--stored shows the old scoring)`);
    }
    const exp = experiments.get(variant);
    if (exp) console.log(`${''.padEnd(18)} ↳ ${exp.description}`);
    else if (variant.startsWith('legacy')) console.log(`${''.padEnd(18)} ↳ recorded before run metadata existed — 1 run per prompt, commit inferred from the date`);
  }
  console.log('\nDetail: pnpm eval:report --variant <id>   ·   Compare: pnpm eval:report --compare <baseline> <variant>');
}

function detail(variant: string) {
  const rs = byVariant.get(variant);
  if (!rs) {
    console.error(`No runs for variant "${variant}". Known: ${[...byVariant.keys()].join(', ') || '(none)'}`);
    process.exit(1);
  }
  const passed = rs.filter(r => r.passed).length;
  console.log(`\n📊 variant "${variant}" — ${rs.length} generation(s), pass rate ${passed}/${rs.length} (${pct(passed, rs.length).trim()}), ${avgTime(rs)} per answer\n`);
  evalHealth();

  console.log('\nPer prompt (pass rate over its runs — a prompt that passes 3/5 is NOT reliable):');
  const byPrompt = groupBy(rs, r => r.promptId);
  const rows = [...byPrompt].map(([id, prs]) => ({ id, n: prs.length, k: prs.filter(r => r.passed).length, avg: prs.reduce((s, r) => s + r.score, 0) / prs.length, time: avgTime(prs) }));
  rows.sort((a, b) => a.k / a.n - b.k / b.n || a.id.localeCompare(b.id));
  for (const r of rows) {
    const icon = r.k === r.n ? '✅' : r.k === 0 ? '❌' : '⚠️ ';
    console.log(`  ${icon} ${r.id.padEnd(30)} ${`${r.k}/${r.n}`.padStart(5)} ${pct(r.k, r.n)}   avg score ${Math.round(r.avg * 100)}%   ${r.time}`);
  }
  const flaky = rows.filter(r => r.k > 0 && r.k < r.n).length;
  if (rows.every(r => r.n === 1)) console.log('  (1 run per prompt — rerun with --runs 5 to see which passes are luck)');
  else if (flaky) console.log(`  ${flaky} prompt(s) pass only sometimes — the model is guessing there.`);

  const errors = tallyErrors(rs);
  console.log(`\nErrors by category (how often each happened, out of ${rs.length} generations):`);
  if (errors.length === 0) console.log('  none');
  for (const [cat, items] of [...groupBy(errors, e => e.category)].sort((a, b) => sum(b[1]) - sum(a[1]))) {
    console.log(`  ${cat.padEnd(28)} ${String(sum(items)).padStart(3)}`);
    for (const e of items.slice(0, 5)) console.log(`     ${String(e.count).padStart(3)}× ${e.promptId}: ${e.text}`);
    if (items.length > 5) console.log(`     … ${items.length - 5} more`);
  }

  console.log(`\nGlobal checks (AGENTS.md "don't" rules, on every generation — don't affect the score):`);
  for (const g of globalRates(rs)) {
    console.log(`  ${g.failed === 0 ? '✓' : '✗'} ${g.description.padEnd(70)} ${`${g.failed}/${rs.length}`.padStart(6)} ${pct(g.failed, rs.length)}`);
  }
  console.log(`\nRead the failing answers: pnpm eval:review --variant ${variant}`);
}

function sum(items: ErrorTally[]) {
  return items.reduce((s, e) => s + e.count, 0);
}

function compareView(a: string, b: string) {
  let ra = byVariant.get(a);
  let rb = byVariant.get(b);
  if (!ra || !rb) {
    console.error(`Need runs for both "${a}" and "${b}". Known: ${[...byVariant.keys()].join(', ')}`);
    process.exit(1);
  }
  const rate = (rs: LoadedRun[]) => rs.filter(r => r.passed).length / rs.length;
  const pa = groupBy(ra, r => r.promptId);
  const pb = groupBy(rb, r => r.promptId);
  const shared = [...pa.keys()].filter(id => pb.has(id)).sort();
  // Only compare like with like: totals are computed over the prompts BOTH variants ran.
  ra = ra.filter(r => pb.has(r.promptId));
  rb = rb.filter(r => pa.has(r.promptId));
  console.log(`\n⚖️  "${b}" vs "${a}" (baseline) — over the ${shared.length} prompt(s) both ran\n`);
  evalHealth();
  const fmt = (rs: LoadedRun[]) => `${rs.filter(r => r.passed).length}/${rs.length}`.padStart(6) + ' ' + pct(rs.filter(r => r.passed).length, rs.length);
  console.log(`\nOverall pass rate: ${a} ${fmt(ra).trim()}  →  ${b} ${fmt(rb).trim()}   (${delta(rate(rb) - rate(ra))})`);
  console.log(`Time per answer:   ${a} ${avgTime(ra)}  →  ${b} ${avgTime(rb)}`);

  console.log('\nPer prompt:');
  let better = 0, worse = 0;
  for (const id of shared) {
    const d = rate(pb.get(id)!) - rate(pa.get(id)!);
    if (d > 0) better++;
    if (d < 0) worse++;
    const mark = d > 0 ? '⬆️ ' : d < 0 ? '🔻' : '  ';
    console.log(`  ${mark} ${id.padEnd(30)} ${fmt(pa.get(id)!)}  →  ${fmt(pb.get(id)!)}   ${delta(d)}`);
  }
  console.log(`\n  ${better} improved · ${worse} got worse · ${shared.length - better - worse} unchanged`);
  if (worse) console.log('  🔻 A variant that fixes one thing and breaks another is not an improvement yet.');

  console.log('\nError categories (rate per generation):');
  const ca = groupBy(tallyErrors(ra), e => e.category);
  const cb = groupBy(tallyErrors(rb), e => e.category);
  for (const cat of new Set([...ca.keys(), ...cb.keys()])) {
    const xa = sum(ca.get(cat) ?? []) / ra.length;
    const xb = sum(cb.get(cat) ?? []) / rb.length;
    console.log(`  ${cat.padEnd(28)} ${xa.toFixed(2)} → ${xb.toFixed(2)}   ${delta(xa - xb)}`);
  }

  console.log('\nGlobal checks (share of generations that broke the rule):');
  const ga = globalRates(ra);
  const gb = globalRates(rb);
  ga.forEach((g, i) => {
    const xa = g.failed / ra.length;
    const xb = gb[i].failed / rb.length;
    if (xa === 0 && xb === 0) return;
    console.log(`  ${g.id.padEnd(28)} ${pct(g.failed, ra.length)} → ${pct(gb[i].failed, rb.length)}   ${delta(xa - xb)}`);
  });
  if (shared.length && Math.min(...shared.map(id => Math.min(pa.get(id)!.length, pb.get(id)!.length))) < 3) {
    console.log('\n⚠️  Some prompts have < 3 runs on one side — a single lucky/unlucky answer can flip the result.');
  }
}

/** positive = better */
function delta(d: number) {
  if (Math.abs(d) < 0.005) return '=';
  return `${d > 0 ? '+' : ''}${Math.round(d * 100)} pts ${d > 0 ? 'better' : 'worse'}`;
}

if (compare) compareView(compare[0], compare[1]);
else if (variantArg) detail(variantArg);
else overview();

