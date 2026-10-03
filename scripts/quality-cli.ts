#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { assertPortableSnapshot, createHelixSnapshot, loadChanges, percent, recordSnapshot, saveChange, snapshotHtml, type ChangeStatus, type QualitySnapshot } from './quality-lib.ts';

const args = process.argv.slice(2);
const command = args.find(arg => !arg.startsWith('--')) ?? 'summary';
const json = args.includes('--json');
const value = (flag: string) => {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
};

function usage(): never {
  console.error(`Usage: pnpm quality <command> [options]\n\nCommands:\n  summary [--input snapshot.json] [--json]    All current quality signals\n  weekly [--json]                             Rolling seven-day Helix eval view\n  snapshot [--output quality/dashboard.json]  Refresh Storybook analytics data\n  changes [--json]                            Improvement history\n  record --area … --summary … --change … --metric … --evidence … [--status proposed|implemented|verified|reverted]\n  export [--input snapshot.json] [--output quality/reports/quality-report.html]`);
  process.exit(1);
}

function snapshotFromInput(): QualitySnapshot {
  const input = value('--input');
  if (!input) return createHelixSnapshot();
  const source = path.resolve(process.cwd(), input);
  if (!fs.existsSync(source)) throw new Error(`Snapshot not found: ${input}`);
  const snapshot: unknown = JSON.parse(fs.readFileSync(source, 'utf8'));
  assertPortableSnapshot(snapshot);
  return snapshot;
}

function printSummary(snapshot: QualitySnapshot, weeklyOnly = false) {
  const evals = weeklyOnly ? snapshot.weekly.evals : snapshot.evals;
  console.log(`\nHelix quality ${weeklyOnly ? `weekly (${snapshot.weekly.from} → ${snapshot.weekly.to})` : 'summary'}`);
  console.log(`Components: ${snapshot.components.total} (${snapshot.components.byStatus.stable ?? 0} stable, ${snapshot.components.byStatus.beta ?? 0} beta, ${snapshot.components.byStatus.draft ?? 0} draft)`);
  console.log(`Figma: ${snapshot.figma.synced ?? 0} aligned, ${snapshot.figma.stale ?? 0} stale, ${snapshot.figma.missing ?? 0} missing`);
  console.log(`Tokens: ${snapshot.tokens.defined} defined`);
  console.log(`Agent evals: ${evals.generations} generation(s), ${percent(evals.passRate)} pass rate, ${evals.promptsCovered} prompt(s) covered`);
  const failures = weeklyOnly ? snapshot.changes.filter(change => change.date >= snapshot.weekly.from) : snapshot.changes;
  console.log(`Improvement records: ${failures.length}${weeklyOnly ? ' in this period' : ''}`);
  const failing = evals.globalChecks.filter(check => check.failed > 0);
  if (failing.length) console.log(`Top agent-rule risks: ${failing.slice(0, 3).map(check => `${check.id} ${percent(check.rate)}`).join(', ')}`);
  else if (evals.generations) console.log('Top agent-rule risks: none recorded');
  else console.log('Top agent-rule risks: unavailable — collect eval generations first');
}

if (command === 'summary' || command === 'weekly') {
  if (command === 'weekly' && value('--input')) throw new Error('weekly is produced by the Helix adapter; use summary --input for an external snapshot.');
  const snapshot = snapshotFromInput();
  if (json) console.log(JSON.stringify(command === 'weekly' ? snapshot.weekly : snapshot, null, 2));
  else printSummary(snapshot, command === 'weekly');
} else if (command === 'changes') {
  const changes = loadChanges();
  if (json) console.log(JSON.stringify(changes, null, 2));
  else if (!changes.length) console.log('No improvement records yet. Use `pnpm quality record` after a reviewed observation.');
  else changes.forEach(change => console.log(`${change.date} · ${change.area} · ${change.status}\n  ${change.summary}\n  Change: ${change.change}\n  Metric: ${change.metric}\n  Evidence: ${change.evidence}${change.outcome ? `\n  Outcome: ${change.outcome}` : ''}`));
} else if (command === 'record') {
  const required = ['--area', '--summary', '--change', '--metric', '--evidence'] as const;
  if (required.some(flag => !value(flag))) usage();
  const status = (value('--status') ?? 'proposed') as ChangeStatus;
  if (!['proposed', 'implemented', 'verified', 'reverted'].includes(status)) throw new Error(`Invalid status "${status}".`);
  const date = value('--date') ?? new Date().toISOString().slice(0, 10);
  const area = value('--area')!;
  const change = {
    id: `${date}-${area.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
    date, area, summary: value('--summary')!, change: value('--change')!, metric: value('--metric')!, evidence: value('--evidence')!, status,
  };
  saveChange(change);
  console.log(`Recorded ${change.id} (${status}).`);
} else if (command === 'snapshot') {
  if (!value('--input')) {
    const audit = spawnSync('pnpm', ['audit:token-usage'], { cwd: path.resolve(import.meta.dirname, '..'), stdio: 'inherit' });
    if (audit.status !== 0) throw new Error('Token usage audit failed; snapshot was not recorded.');
  }
  const snapshot = snapshotFromInput();
  if (!value('--input')) recordSnapshot(snapshot);
  const requested = value('--output') ?? 'quality/dashboard.json';
  const output = path.resolve(process.cwd(), requested);
  const root = path.resolve(import.meta.dirname, '..');
  if (!output.startsWith(root + path.sep)) throw new Error('--output must stay inside this repository.');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Wrote ${path.relative(root, output)} for Storybook.`);
} else if (command === 'export') {
  const snapshot = snapshotFromInput();
  const requested = value('--output') ?? 'quality/reports/quality-report.html';
  const output = path.resolve(process.cwd(), requested);
  const root = path.resolve(import.meta.dirname, '..');
  if (!output.startsWith(root + path.sep)) throw new Error('--output must stay inside this repository.');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, snapshotHtml(snapshot));
  console.log(`Exported ${path.relative(root, output)}.`);
} else usage();
