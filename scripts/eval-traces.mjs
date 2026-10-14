#!/usr/bin/env node
/**
 * Summarizes what the Claude Code hooks caught in real sessions (evals/traces/hooks/, written by
 * scripts/hook-trace.mjs) — the live counterpart of `pnpm eval:report`, for step 1 of the eval loop
 * (evals/error-analysis.md): which Helix rules agents break most, which contracts they skip, whether they
 * recover after a lint block, and in which projects.
 *
 *   pnpm eval:traces [--since YYYY-MM-DD] [--project <name>] [--json]
 */
import { readHookTraces, tracesDir } from './hook-trace.mjs';

const args = process.argv.slice(2);
const arg = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const since = arg('--since');
const project = arg('--project');

const traces = readHookTraces().filter(t => (!since || t.timestamp >= since) && (!project || t.project === project));

const count = (items, key) => {
  const map = new Map();
  for (const item of items) { const k = key(item); if (k) map.set(k, (map.get(k) ?? 0) + 1); }
  return [...map].sort((a, b) => b[1] - a[1]);
};

const lint = traces.filter(t => t.hook === 'lint');
const blocks = lint.filter(t => t.decision === 'block');
// A block episode: one session + file, from its first block to a `resolved` (or never).
const episodes = new Map();
for (const t of lint) {
  const key = `${t.session}\0${t.project}\0${t.file}`;
  const ep = episodes.get(key) ?? { blocks: 0, resolved: false };
  if (t.decision === 'block') { if (ep.resolved) { ep.resolved = false; ep.blocks = 0; } ep.blocks++; }
  if (t.decision === 'resolved') ep.resolved = true;
  episodes.set(key, ep);
}
const eps = [...episodes.values()].filter(e => e.blocks > 0 || e.resolved);
const resolved = eps.filter(e => e.resolved);

const summary = {
  tracesDir: tracesDir(),
  period: traces.length ? { from: traces[0].timestamp, to: traces.at(-1).timestamp } : null,
  total: traces.length,
  byHook: Object.fromEntries(count(traces, t => `${t.hook}:${t.decision}`)),
  byProject: Object.fromEntries(count(traces, t => t.project)),
  lint: {
    blocks: blocks.length,
    topRules: count(blocks.flatMap(t => t.findings ?? []), f => f.rule).slice(0, 10),
    episodes: eps.length,
    resolved: resolved.length,
    blocksBeforeResolved: resolved.length ? +(resolved.reduce((n, e) => n + e.blocks, 0) / resolved.length).toFixed(1) : null,
  },
  contract: {
    denials: traces.filter(t => t.hook === 'contract').length,
    topComponents: count(traces.filter(t => t.hook === 'contract').flatMap(t => t.findings ?? []), f => f.component).slice(0, 10),
  },
  ownerGate: {
    asks: traces.filter(t => t.hook === 'owner-gate').length,
    byGate: count(traces.filter(t => t.hook === 'owner-gate').flatMap(t => t.findings ?? []), f => f.gate),
  },
};

if (args.includes('--json')) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

if (!traces.length) {
  console.log(`No hook traces yet${since || project ? ' for this filter' : ''} (${summary.tracesDir}).`);
  console.log('They are recorded as agents work in Claude Code — in this repo, or in an app set up with `pnpm setup:ai`.');
  process.exit(0);
}

const rows = list => list.map(([k, n]) => `   ${String(n).padStart(4)}  ${k}`).join('\n');
console.log(`\nHelix hook traces — ${traces.length} from ${summary.period.from.slice(0, 10)} to ${summary.period.to.slice(0, 10)}`);
console.log(`Projects:\n${rows(count(traces, t => t.project))}`);
console.log(`\nLint blocks: ${blocks.length} — rules broken most:\n${rows(summary.lint.topRules) || '   none'}`);
if (eps.length) {
  console.log(`   Recovered: ${resolved.length} of ${eps.length} blocked files (${Math.round(resolved.length / eps.length * 100)}%)` +
    (resolved.length ? `, after ${summary.lint.blocksBeforeResolved} block(s) on average` : ''));
}
console.log(`\nContract denials: ${summary.contract.denials} — components written before reading their contract:\n${rows(summary.contract.topComponents) || '   none'}`);
console.log(`\nOwner-gate asks: ${summary.ownerGate.asks}\n${rows(summary.ownerGate.byGate) || '   none'}`);
console.log('\nNext: annotate the patterns in evals/error-analysis.md, then fix the guide, contract or rule behind the top ones.\n');
