/**
 * `pnpm helix dashboard` — one terminal view of Helix's AI-readiness: the health score, the signal behind
 * each part of it, the biggest gaps, and how fresh each source is. Read-only: it computes the same
 * snapshot as `pnpm quality snapshot` (quality-lib.ts) but records nothing — run that to update the
 * Storybook Metrics page and the score history.
 */
import { createHelixSnapshot, percent, type QualitySnapshot } from './quality-lib.ts';

const DAY = 24 * 60 * 60 * 1000;

function bar(rate: number | null, width = 20) {
  if (rate === null) return '·'.repeat(width);
  const filled = Math.round(rate * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function age(iso: string | null, now: Date) {
  if (!iso) return 'never';
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / DAY);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}

function signals(snapshot: QualitySnapshot) {
  const breakdown = snapshot.healthScoreBreakdown;
  const { byStatus, total } = snapshot.components;
  const topRisk = [...snapshot.evals.globalChecks].sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))[0];
  return [
    { label: 'Component readiness', rate: breakdown.componentReadiness, detail: `${byStatus.stable ?? 0}/${total} stable`, source: 'pnpm verify:stable' },
    { label: 'Figma alignment', rate: breakdown.figmaAlignment, detail: `${snapshot.figma.synced ?? 0} aligned · ${snapshot.figma.stale ?? 0} out of date · ${snapshot.figma.missing ?? 0} missing`, source: 'pnpm verify:stable (figma-drift)' },
    { label: 'Agent reliability', rate: breakdown.agentReliability, detail: `${snapshot.evals.generations} runs · ${snapshot.evals.promptsCovered} prompts`, source: 'pnpm eval:report' },
    { label: 'Rule compliance', rate: breakdown.ruleCompliance, detail: topRisk?.failed ? `worst: ${topRisk.id} in ${percent(topRisk.rate)} of runs` : 'no rule failures', source: 'pnpm eval:report' },
    { label: 'Governance coverage', rate: breakdown.governanceCoverage, detail: `${snapshot.governance.complete}/${snapshot.governance.total} contracts`, source: 'pnpm verify:governance' },
  ];
}

/** The concrete gaps pulling the score down, biggest first within each signal. */
function gaps(snapshot: QualitySnapshot) {
  const out: string[] = [];
  const notStable = snapshot.components.total - (snapshot.components.byStatus.stable ?? 0);
  const failing = snapshot.components.failedCriteria.filter(criterion => criterion.failed > 0).sort((a, b) => b.failed - a.failed);
  if (failing.length) out.push(`Readiness: ${failing.map(criterion => `${criterion.label} fails in ${criterion.failed}`).join(' · ')} — pnpm verify:stable --details`);
  else if (notStable) out.push(`Readiness: ${notStable} component(s) pass every criterion — only Figma keeps them beta (not modelled or out of date, below)`);
  if (snapshot.figma.stale) out.push(`Figma: ${snapshot.figma.stale} component(s) changed in code since their Figma sync — pnpm verify:stable --details lists them`);
  if (snapshot.figma.missing) out.push(`Figma: ${snapshot.figma.missing} component(s) not modelled in Figma yet (done on request)`);
  for (const check of snapshot.evals.globalChecks.filter(check => check.failed > 0).sort((a, b) => b.failed - a.failed).slice(0, 3)) {
    out.push(`Agents: ${check.id} in ${check.failed}/${snapshot.evals.generations} runs (${percent(check.rate)}) — ${check.label}`);
  }
  if (snapshot.governance.incomplete.length) out.push(`Governance: missing rationale/neverUseFor/governance in ${snapshot.governance.incomplete.join(', ')}`);
  return out;
}

function freshness(snapshot: QualitySnapshot, now: Date) {
  const out: string[] = [];
  const { stabilityGeneratedAt, lastEvalRunAt, unscoredComponents } = snapshot.sources;
  const stabilityLine = `Stability + Figma: computed ${age(stabilityGeneratedAt, now)}`;
  out.push(unscoredComponents.length
    ? `${stabilityLine} — not scored yet: ${unscoredComponents.join(', ')} (run pnpm verify:stable with Storybook running)`
    : stabilityLine);
  out.push(`Agent evals: last run ${age(lastEvalRunAt, now)}`);
  out.push(`Governance: read live from contracts/components`);
  return out;
}

export function dashboard(args: string[]) {
  const now = new Date();
  const snapshot = createHelixSnapshot(now);

  if (args.includes('--json')) {
    console.log(JSON.stringify({
      generatedAt: snapshot.generatedAt,
      healthScore: snapshot.healthScore,
      signals: signals(snapshot),
      gaps: gaps(snapshot),
      freshness: freshness(snapshot, now),
    }, null, 2));
    return;
  }

  const rows = signals(snapshot);
  const labelWidth = Math.max(...rows.map(row => row.label.length));
  console.log(`\nHelix AI-readiness`);
  console.log(`\n  Health score  ${percent(snapshot.healthScore).padStart(4)}  ${bar(snapshot.healthScore)}`);
  console.log(`  Equal-weight average of the ${rows.filter(row => row.rate !== null).length} signals below.\n`);
  for (const row of rows) {
    console.log(`  ${row.label.padEnd(labelWidth)}  ${percent(row.rate).padStart(4)}  ${bar(row.rate, 10)}  ${row.detail}`);
    console.log(`  ${''.padEnd(labelWidth)}                    ↳ ${row.source}`);
  }
  const gapLines = gaps(snapshot);
  console.log(`\nGaps`);
  console.log(gapLines.length ? gapLines.map(line => `  • ${line}`).join('\n') : '  None — every signal is at its maximum.');
  console.log(`\nFreshness`);
  console.log(freshness(snapshot, now).map(line => `  • ${line}`).join('\n'));
  console.log(`\nRead-only view. Record it for Storybook's Metrics page and the score history with: pnpm quality snapshot\n`);
}
