/**
 * The eval score for a pull request — from runs already stored in evals/outputs/. It never runs an agent:
 * evals are generated only on purpose (`pnpm eval:generate`), never as a side effect of opening a PR.
 *
 *   pnpm eval:pr                                  print the score of the latest variant vs "baseline"
 *   pnpm eval:pr --variant <id> --baseline <id>   pick both sides
 *   pnpm eval:pr --post                           also post it on this branch's PR (one comment, updated in place)
 *
 * The comment says how many prompts both sides ran, the pass rate, time and tokens per answer, and every
 * prompt that got worse — so a regression is visible on the PR before it is merged.
 */
import { spawnSync } from 'child_process';
import { loadRuns, argValue, type LoadedRun } from './eval-lib';

const args = process.argv.slice(2);
const runs = loadRuns();
const baseline = argValue(args, '--baseline') ?? 'baseline';
const latest = [...runs].filter(r => r.variant !== baseline).sort((a, b) => b.timestamp - a.timestamp)[0]?.variant;
const variant = argValue(args, '--variant') ?? latest;
const MARKER = '<!-- helix-eval-score -->';

if (!variant) {
  console.error('No eval runs to report. Generate some first: pnpm eval:generate --variant <id> --note "<what changed>"');
  process.exit(1);
}

const byPrompt = (rs: LoadedRun[]) => {
  const m = new Map<string, LoadedRun[]>();
  for (const r of rs) m.set(r.promptId, [...(m.get(r.promptId) ?? []), r]);
  return m;
};
const a = byPrompt(runs.filter(r => r.variant === baseline));
const b = byPrompt(runs.filter(r => r.variant === variant));
if (!b.size) { console.error(`No runs for variant "${variant}".`); process.exit(1); }
const shared = [...b.keys()].filter(id => a.has(id)).sort();

const passRate = (rs: LoadedRun[]) => rs.length ? rs.filter(r => r.passed).length / rs.length : 0;
const flat = (m: Map<string, LoadedRun[]>, ids: string[]) => ids.flatMap(id => m.get(id) ?? []);
const avg = (rs: LoadedRun[], pick: (r: LoadedRun) => number | undefined) => {
  const xs = rs.map(pick).filter((x): x is number => typeof x === 'number');
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
};
const secs = (ms: number | null) => ms === null ? '–' : `${(ms / 1000).toFixed(1)}s`;
const toks = (n: number | null) => n === null ? '–' : `${Math.round(n / 1000)}k`;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const frac = (rs: LoadedRun[]) => `${rs.filter(r => r.passed).length}/${rs.length}`;

const lines: string[] = [MARKER, `### Helix evals — \`${variant}\``, ''];
const vb = [...b.values()].flat();
if (!shared.length) {
  lines.push(`No prompt in common with \`${baseline}\` — showing \`${variant}\` alone.`, '',
    `**Pass rate:** ${frac(vb)} (${pct(passRate(vb))}) · ${secs(avg(vb, r => r.durationMs))} and ${toks(avg(vb, r => r.usage?.totalTokens))} tokens per answer`);
} else {
  const ra = flat(a, shared), rb = flat(b, shared);
  const d = passRate(rb) - passRate(ra);
  const verdict = Math.abs(d) < 0.005 ? 'same as baseline' : d > 0 ? `+${Math.round(d * 100)} pts better` : `${Math.round(d * 100)} pts worse`;
  lines.push(
    `Compared with \`${baseline}\` on the ${shared.length} prompt(s) both ran.`, '',
    '| | Baseline | This PR |', '|---|---|---|',
    `| Pass rate | ${frac(ra)} (${pct(passRate(ra))}) | **${frac(rb)} (${pct(passRate(rb))})** — ${verdict} |`,
    `| Time per answer | ${secs(avg(ra, r => r.durationMs))} | ${secs(avg(rb, r => r.durationMs))} |`,
    `| Tokens per answer | ${toks(avg(ra, r => r.usage?.totalTokens))} | ${toks(avg(rb, r => r.usage?.totalTokens))} |`, '',
  );
  const worse = shared.filter(id => passRate(b.get(id)!) < passRate(a.get(id)!));
  lines.push(worse.length
    ? `**Got worse:** ${worse.map(id => `\`${id}\` ${frac(a.get(id)!)} → ${frac(b.get(id)!)}`).join(' · ')}`
    : '**No prompt got worse.**');
  if (Math.min(...shared.map(id => Math.min(a.get(id)!.length, b.get(id)!.length))) < 3) {
    lines.push('', '_Some prompts have fewer than 3 runs on one side — one lucky or unlucky answer can flip the result._');
  }
}
lines.push('', `<sub>From stored runs (\`pnpm eval:pr\`) — no agent was run for this comment. Detail: \`pnpm eval:report --compare ${baseline} ${variant}\`</sub>`);
const body = lines.join('\n');
console.log(body);

if (args.includes('--post')) {
  const gh = (...a: string[]) => spawnSync('gh', a, { encoding: 'utf8' });
  const pr = gh('pr', 'view', '--json', 'number,url', '--jq', '.number');
  if (pr.status !== 0 || !pr.stdout.trim()) {
    console.error('\nNo open PR for this branch (or gh is not logged in) — nothing posted.');
    process.exit(1);
  }
  const number = pr.stdout.trim();
  // One comment per PR, updated on every run, so the PR shows the latest score instead of a pile of them.
  const existing = gh('api', `repos/{owner}/{repo}/issues/${number}/comments`, '--paginate', '--jq',
    `.[] | select(.body | startswith("${MARKER}")) | .id`).stdout.trim().split('\n')[0];
  const res = existing
    ? gh('api', '-X', 'PATCH', `repos/{owner}/{repo}/issues/comments/${existing}`, '-f', `body=${body}`)
    : gh('pr', 'comment', number, '--body', body);
  if (res.status !== 0) { console.error(`\nCould not post: ${res.stderr.trim()}`); process.exit(1); }
  console.log(`\n${existing ? 'Updated' : 'Posted'} the eval score on PR #${number}.`);
}
