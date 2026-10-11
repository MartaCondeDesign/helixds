import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Chart, IconButton, Input, SegmentedControl, Table, TableCell, TableHead, TableHeaderCell } from '@helixds/react';
import rawSnapshot from '../../../quality/dashboard.json';
import history from '../../../quality/history.json';
import rawChangelog from '../../../.ai/maps/changelog.json';
import { IconCalendar, IconChartBar, IconChevronLeft, IconChevronRight, IconTable } from '@tabler/icons-react';
import { StoryHeader } from './_shared/StoryHeader';

type HistoryPoint = { date: string; score: number | null; evalPassRate?: number | null; tokens?: number; components?: Record<string, number>; figma?: Record<string, number> };

// One row per context level (evals/ladder.json) — `pnpm quality snapshot` computes it from the eval runs.
type LadderLevel = { variant: string; label: string; detail: string; answers: number; tasks: number; passRate: number | null; meanScore: number | null; tokensPerAnswer: number | null; totalTokens: number | null };
// One day × context level of eval answers: counts and summed score, so months can be averaged exactly.
type LadderDay = { date: string; variant: string; answers: number; scoreSum: number; passed: number; tasks: string[]; tokenSum: number; measured: number };
// One eval round compared with the one before it — computed by `pnpm quality snapshot`, nothing manual.
type RoundStats = { answers: number; passRate: number; meanScore: number };
type RoundImprovement = { id: string; date: string; previous: string; commit: string; commits: string[]; uncommitted: boolean; tasksCompared: number; levels: Array<{ variant: string; label: string; before: RoundStats; after: RoundStats }>; verdict: 'better' | 'worse' | 'same' | 'not comparable'; meanDelta: number | null };
// One recorded measurement round (evals/rounds.json) — what each level scored and cost that time.
type LadderRound = { id: string; date: string; commit: string; runs: number; tasks: string[]; levels: Array<{ variant: string; label: string; answers: number; passRate: number | null; meanScore: number | null; tokensPerAnswer: number | null; totalTokens: number | null }> };

type DashboardSnapshot = {
  generatedAt: string;
  components: { total: number; byStatus: Record<string, number> };
  figma: Record<string, number>;
  tokens: { defined: number };
  healthScore: number | null;
  healthScoreBreakdown: Record<string, number | null>;
  evals: { generations: number; passRate: number | null; promptsCovered: number; globalChecks: Array<{ id: string; label: string; failed: number; rate: number }>; ladder?: LadderLevel[]; rounds?: LadderRound[]; daily?: LadderDay[]; improvements?: RoundImprovement[] };
  weekly: { from: string; to: string; evals: { passRate: number | null } };
  changes: Array<{ id: string; date: string; area: string; summary: string; status: string }>;
};

const snapshot = rawSnapshot as unknown as DashboardSnapshot;

// What the health score averages — equal weight, each a 0–1 rate (scripts/quality-lib.ts → createHelixSnapshot).
const HEALTH_SIGNALS: Array<{ key: string; label: string; measures: string; command: string }> = [
  { key: 'componentReadiness', label: 'Component readiness', measures: 'Share of components that are stable: the 8 automatic criteria pass and they are aligned in Figma.', command: 'pnpm verify:stable' },
  { key: 'figmaAlignment', label: 'Figma alignment', measures: 'Share of components in Figma and aligned with code (colors, sizes, typography, variables).', command: 'pnpm verify:stable · pnpm figma:audit' },
  { key: 'agentReliability', label: 'Agent reliability', measures: 'Share of current eval answers that pass their task checklist.', command: 'pnpm eval:report' },
  { key: 'ruleCompliance', label: 'Rule compliance', measures: 'Share of current eval answers free of each global mistake (doesn’t compile, invented props…), averaged over the rules.', command: 'pnpm eval:report' },
  { key: 'governanceCoverage', label: 'Governance coverage', measures: 'Share of contracts with rationale, neverUseFor and governance boundaries.', command: 'pnpm verify:governance' },
  { key: 'accessibility', label: 'Accessibility', measures: 'Average of the per-component accessibility scores: % of the automatic checks (contract, keys, focus return, keyboard, axe, contrast, focus visible, target size, reflow, screen reader) that apply and pass.', command: 'pnpm a11y' },
];
const metricHistory = history as HistoryPoint[];
type Changelog = { commitCount: number; days: Array<{ date: string; commits: unknown[] }> };
const changelog = rawChangelog as Changelog;

const pct = (value: number | null) => value === null ? '—' : `${Math.round(value * 100)}%`;
const fmtTokens = (n: number | null) => n === null ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(Math.round(n));
const riskLabel: Record<string, string> = {
  'hardcoded-color': 'Colores escritos fuera de tokens',
  'hardcoded-size': 'Tamaños fijos sin tokens',
  'inline-style': 'Estilos fuera de Helix',
  'raw-div': 'Layout manual sin componentes Helix',
  'raw-icon': 'Icono sin el componente Icon de Helix',
  'icon-element-prop': 'Icono pasado de forma incorrecta',
  'on-press': 'Usó onPress en vez de onClick',
  'raw-native-control': 'Control HTML nativo en vez de componente Helix',
};
const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
// The annual view starts with 2024–2026 and grows by one calendar year thereafter.
const HEALTH_HISTORY_START_YEAR = 2024;

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <Card>
      <div style={{ display: 'grid', gap: 'var(--helix-spacing-2xs)' }}>
        <span style={{ color: 'var(--helix-color-text-neutral-lightest)', fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)' }}>{label}</span>
        <strong style={{ color: 'var(--helix-color-text-neutral)', fontSize: 'var(--helix-textStyle-heading-xl-bold-fontSize)' }}>{value}</strong>
        <span style={{ color: 'var(--helix-color-text-neutral-light)', fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)' }}>{detail}</span>
      </div>
    </Card>
  );
}

function CommitCalendar() {
  const commitsByDate = new Map(changelog.days.map(day => [day.date, day.commits.length]));
  const end = new Date(snapshot.generatedAt); end.setHours(0, 0, 0, 0);
  const start = new Date(end); start.setDate(end.getDate() - 364);
  const leadingDays = start.getDay();
  const cells = Array.from({ length: leadingDays + 365 }, (_, index) => {
    if (index < leadingDays) return null;
    const date = new Date(start); date.setDate(start.getDate() + index - leadingDays);
    const key = localDateKey(date);
    return { key, commits: commitsByDate.get(key) ?? 0 };
  });
  const colorFor = (commits: number) => commits === 0 ? 'var(--helix-color-fill-surface-dark)'
    : commits === 1 ? 'var(--helix-color-fill-primary-interactive-light-default)'
      : commits === 2 ? 'var(--helix-color-fill-primary-interactive-light-hover)'
        : commits < 5 ? 'var(--helix-color-fill-primary-interactive-default)'
          : 'var(--helix-color-fill-primary-interactive-hover)';

  return (
    <Card header={`Commit activity · ${changelog.commitCount} commits total`}>
      {/* [CUSTOM] GitHub-style contribution calendar; Helix has no calendar heatmap component. */}
      <div aria-label="Commit activity during the last 365 days" style={{ display: 'grid', gridTemplateRows: 'repeat(7, 12px)', gridAutoFlow: 'column', gridAutoColumns: '12px', gap: 'var(--helix-spacing-3xs)', overflowX: 'auto', paddingBottom: 'var(--helix-spacing-2xs)' }}>
        {cells.map((cell, index) => cell ? <span key={cell.key} aria-label={`${cell.commits} commits on ${cell.key}`} style={{ background: colorFor(cell.commits), borderRadius: 'var(--helix-radius-xs)' }} /> : <span key={`empty-${index}`} aria-hidden="true" />)}
      </div>
      <p style={{ margin: 'var(--helix-spacing-s) 0 0', color: 'var(--helix-color-text-neutral-light)', fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)' }}>Last 365 days. Darker primary cells represent more commits made that day.</p>
    </Card>
  );
}

function DataAnalyticsPage() {
  const [period, setPeriod] = useState('day');
  const [detail, setDetail] = useState('components');
  const risks = snapshot.evals.globalChecks.filter(check => check.failed > 0).sort((a, b) => b.failed - a.failed);
  const recentMetricHistory = useMemo(() => {
    const end = new Date(snapshot.generatedAt); end.setHours(0, 0, 0, 0);
    const byDate = new Map(metricHistory.map(point => [point.date, point]));
    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date(end); date.setDate(end.getDate() - 29 + index);
      const key = localDateKey(date);
      const point = byDate.get(key);
      return { label: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date), passRate: point?.evalPassRate === undefined ? (index === 29 ? snapshot.evals.passRate : null) : point.evalPassRate, tokens: point?.tokens === undefined ? (index === 29 ? snapshot.tokens.defined : null) : point.tokens, components: point?.components ?? (index === 29 ? snapshot.components.byStatus : undefined), figma: point?.figma ?? (index === 29 ? snapshot.figma : undefined) };
    });
  }, []);
  const healthHistory = useMemo(() => {
    const today = new Date(snapshot.generatedAt); today.setHours(0, 0, 0, 0);
    const scoresByPeriod = new Map<string, number[]>();
    for (const point of history) {
      if (point.score === null) continue;
      const key = period === 'month' ? point.date.slice(0, 7) : point.date.slice(0, 4);
      scoresByPeriod.set(key, [...(scoresByPeriod.get(key) ?? []), Math.round(point.score * 100)]);
    }
    const average = (key: string) => {
      const scores = scoresByPeriod.get(key);
      return scores?.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
    };

    if (period === 'day') {
      const byDate = new Map(history.map(point => [point.date, point.score === null ? null : Math.round(point.score * 100)]));
      return Array.from({ length: 30 }, (_, index) => {
        const date = new Date(today); date.setDate(today.getDate() - 29 + index);
        const key = localDateKey(date);
        return { date: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date), score: byDate.get(key) ?? null };
      });
    }

    if (period === 'month') {
      return Array.from({ length: 12 }, (_, index) => {
        const date = new Date(today.getFullYear(), today.getMonth() - 11 + index, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return { date: new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(date), score: average(key) };
      });
    }

    return Array.from({ length: today.getFullYear() - HEALTH_HISTORY_START_YEAR + 1 }, (_, index) => {
      const year = HEALTH_HISTORY_START_YEAR + index;
      return { date: String(year), score: average(String(year)) };
    });
  }, [period]);

  return (
    <div style={{ display: 'grid', gap: 'var(--helix-spacing-l)', maxWidth: '1200px' }}>
      <StoryHeader
        title="Metrics"
        description="A unified quality view of component readiness, design-source alignment, agent evals, and reviewed improvement decisions. Refresh its data with pnpm quality snapshot."
      />

      <Card header={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--helix-spacing-m)' }}><span>Design System Health Evolution</span><SegmentedControl label="Health period" value={period} onChange={setPeriod} options={[{ value: 'day', label: 'Day' }, { value: 'month', label: 'Month' }, { value: 'year', label: 'Year' }]} /></div>}>
        <Chart variant="bar" label="Design-system health score" description="Average of component readiness, Figma alignment, agent reliability, Helix-rule compliance, governance coverage (contracts with rationale, neverUseFor and governance boundaries) and accessibility (the average of per-component accessibility scores, pnpm a11y — from 11 Oct 2026). Agent reliability and rule compliance count only current answers (latest round of each task × level since the last breaking change, no control group) — from 10 Oct 2026; earlier points counted every saved answer. Day shows the rolling 30-day window; Month the rolling 12-month window; Year starts at 2024 and adds each calendar year. Missing periods have no bar." categories={healthHistory.map(point => point.date)} series={[{ name: 'Health score', data: healthHistory.map(point => point.score) }]} />
        <Table>
          <TableHead>
            <tr data-helix-part="table-row">
              <TableHeaderCell>What it measures (today: {pct(snapshot.healthScore)})</TableHeaderCell>
              <TableHeaderCell>Value</TableHeaderCell>
              <TableHeaderCell>How</TableHeaderCell>
              <TableHeaderCell>Recompute</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody data-helix-part="table-body">
            {HEALTH_SIGNALS.map(signal => (
              <tr key={signal.key} data-helix-part="table-row">
                <TableCell><strong>{signal.label}</strong></TableCell>
                <TableCell>{pct(snapshot.healthScoreBreakdown?.[signal.key] ?? null)}</TableCell>
                <TableCell>{signal.measures}</TableCell>
                <TableCell><code>{signal.command}</code></TableCell>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--helix-spacing-m)' }}>
        <Metric label="Components" value={snapshot.components.total} detail={`${snapshot.components.byStatus.stable ?? 0} stable · ${snapshot.components.byStatus.beta ?? 0} beta`} />
        <Metric label="Figma alignment" value={snapshot.figma.synced ?? 0} detail={`${snapshot.figma.missing ?? 0} components not modelled`} />
        <Metric label="Agent eval pass rate" value={pct(snapshot.evals.passRate)} detail={`${snapshot.evals.generations} current answers · ${snapshot.evals.promptsCovered} tasks — latest round of each, since the last breaking change, control group left out`} />
        <Metric label="Design tokens" value={snapshot.tokens.defined} detail="Tokens indexed in this snapshot" />
      </div>

      <Card header={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--helix-spacing-m)' }}><span>Explore Metrics</span>{(detail === 'components' || detail === 'figma') && <Button size="s" variant="secondary" onClick={() => window.top?.location.assign('/?path=/story/data-status--overview')}>View more</Button>}</div>}>
        <SegmentedControl label="Metric detail" value={detail} onChange={setDetail} options={[{ value: 'components', label: 'Components' }, { value: 'figma', label: 'Figma' }, { value: 'agents', label: 'Agents' }, { value: 'tokens', label: 'Tokens' }]} />
        {detail === 'components' ? <Chart variant="bar" label="Component status over time" description="Daily percentage of components in Draft, Beta, and Stable status across the rolling 30-day window." height={240} categories={recentMetricHistory.map(point => point.label)} series={[{ name: 'Draft', data: recentMetricHistory.map(point => point.components ? Math.round(((point.components.draft ?? 0) / snapshot.components.total) * 100) : null) }, { name: 'Beta', data: recentMetricHistory.map(point => point.components ? Math.round(((point.components.beta ?? 0) / snapshot.components.total) * 100) : null) }, { name: 'Stable', data: recentMetricHistory.map(point => point.components ? Math.round(((point.components.stable ?? 0) / snapshot.components.total) * 100) : null) }]} />
          : detail === 'figma' ? <Chart variant="bar" label="Figma alignment over time" description="Daily percentage of components aligned, out of date, or not modelled in Figma across the rolling 30-day window." height={240} categories={recentMetricHistory.map(point => point.label)} series={[{ name: 'Aligned', data: recentMetricHistory.map(point => point.figma ? Math.round(((point.figma.synced ?? 0) / snapshot.components.total) * 100) : null) }, { name: 'Out of date', data: recentMetricHistory.map(point => point.figma ? Math.round(((point.figma.stale ?? 0) / snapshot.components.total) * 100) : null) }, { name: 'Not modelled', data: recentMetricHistory.map(point => point.figma ? Math.round(((point.figma.missing ?? 0) / snapshot.components.total) * 100) : null) }]} />
          : detail === 'agents' ? <Chart variant="area" label="Agent evaluation pass rate" description="Pass rate over the last 30 days. Historical points appear as quality snapshots are recorded." height={240} categories={recentMetricHistory.map(point => point.label)} series={[{ name: 'Pass rate', data: recentMetricHistory.map(point => point.passRate === null ? null : Math.round(point.passRate * 100)) }]} />
              : <Chart variant="area" label="Token inventory" description="Tokens indexed during the last 30 days. Historical points appear as quality snapshots are recorded." height={240} categories={recentMetricHistory.map(point => point.label)} series={[{ name: 'Tokens', data: recentMetricHistory.map(point => point.tokens) }]} />}
      </Card>

      {snapshot.evals.ladder?.length ? <EvalResults levels={snapshot.evals.ladder} days={snapshot.evals.daily ?? []} rounds={snapshot.evals.rounds ?? []} /> : null}

      <CommitCalendar />

      <Card header="Agent Generation Risks">
        {risks.length ? (
          // [CUSTOM] A bounded table keeps a long risk list readable without making the dashboard unbounded.
          <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
            <Table>
              <TableHead><tr data-helix-part="table-row"><TableHeaderCell>Rule</TableHeaderCell><TableHeaderCell>Occurrences</TableHeaderCell><TableHeaderCell>Rate</TableHeaderCell><TableHeaderCell>Priority</TableHeaderCell></tr></TableHead>
              <tbody data-helix-part="table-body">
                {risks.map(risk => (
                  <tr key={risk.id} data-helix-part="table-row">
                    <TableCell>{riskLabel[risk.id] ?? risk.label}</TableCell><TableCell>{risk.failed}/{snapshot.evals.generations}</TableCell><TableCell>{pct(risk.rate)}</TableCell>
                    <TableCell><Badge variant={risk.rate >= 0.15 ? 'danger' : 'warning'} label={risk.rate >= 0.15 ? 'Review now' : 'Monitor'} /></TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : <p style={{ color: 'var(--helix-color-text-neutral-light)' }}>No agent-rule failures are recorded in this snapshot.</p>}
      </Card>


      <ImprovementHistory improvements={snapshot.evals.improvements ?? []} />

      <p style={{ margin: 0, color: 'var(--helix-color-text-neutral-lightest)', fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)' }}>
        Snapshot generated {new Date(snapshot.generatedAt).toLocaleString()} · rolling eval window {snapshot.weekly.from}–{snapshot.weekly.to}
      </p>
    </div>
  );
}



// Eval results — one card for "how do agents do at each context level" and "how did that change over
// time". The chart groups by level (bare … full repo): each block holds a bar per measure (answers, tasks,
// pass rate, mean score, tokens). A date picker narrows every number to that exact day (from the
// snapshot's per-day buckets); "All time" clears it. The icon toggle swaps the chart for the same numbers
// as tables. A level with no answers in the period has no bars.
function EvalResults({ levels, days, rounds }: { levels: LadderLevel[]; days: LadderDay[]; rounds: LadderRound[] }) {
  const [view, setView] = useState('chart');
  // '' = all time; otherwise a YYYY-MM-DD local date, the same keys the snapshot's day buckets use.
  // `preview` is the day under the pointer (or keyboard focus) in the calendar: the card shows it without
  // committing, so sweeping across days compares them; leaving the calendar returns to `date`.
  const [date, setDate] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const shown = preview ?? date;
  const dayLabel = (iso: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${iso}T12:00:00`));
  const dates = [...new Set(days.map(day => day.date))].sort();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const inPeriod = (day: LadderDay) => !shown || day.date === shown;

  // Each level's numbers for the period: sums over its day buckets, divided once — every answer weighs the same.
  const stats = levels.map(level => {
    const inLevel = days.filter(day => day.variant === level.variant && inPeriod(day));
    const answers = inLevel.reduce((sum, day) => sum + day.answers, 0);
    const measured = inLevel.reduce((sum, day) => sum + day.measured, 0);
    return {
      level,
      answers,
      tasks: new Set(inLevel.flatMap(day => day.tasks)).size,
      passRate: answers ? inLevel.reduce((sum, day) => sum + day.passed, 0) / answers : null,
      meanScore: answers ? inLevel.reduce((sum, day) => sum + day.scoreSum, 0) / answers : null,
      tokensPerAnswer: measured ? inLevel.reduce((sum, day) => sum + day.tokenSum, 0) / measured : null,
    };
  });
  const bars = (value: (row: typeof stats[number]) => number | null) => stats.map(row => (row.answers ? value(row) : null));
  const periodName = shown ? dayLabel(shown) : 'all time';
  const empty = stats.every(row => !row.answers);
  const roundLabel = (round: LadderRound) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(round.date));
  const roundTokens = (round: LadderRound) => round.levels.reduce((sum, level) => sum + (level.totalTokens ?? 0), 0);
  const periodRounds = rounds.filter(round => !shown || round.date.startsWith(shown));

  return (
    <Card header={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--helix-spacing-m)', flexWrap: 'wrap' }}><span>Eval Results</span><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-s)' }}><Button size="m" variant="secondary" disabled={!date} onClick={() => setDate('')}>All time</Button><EvalDatePicker value={date} onChange={setDate} onPreview={setPreview} dataDates={dates} min={dates[0] ?? today} max={today} /><SegmentedControl label="Eval results view" value={view} onChange={setView} options={[{ value: 'chart', label: 'Chart view', icon: IconChartBar }, { value: 'table', label: 'Table view', icon: IconTable }]} /></div></div>}>
      {preview && <p style={{ margin: 0, color: 'var(--helix-color-text-neutral-light)' }}>Previewing {periodName} — click the day to keep it.</p>}
      {empty && <p style={{ margin: 0, color: 'var(--helix-color-text-neutral-light)' }}>No evals were run on {periodName}. Pick another date, or All time.</p>}
      {view === 'chart' ? (
        <Chart variant="bar" label={`Eval results by context level — ${periodName}`} description="One block per context level the agent was given; in each block, a bar per measure — answers and tasks measured, the share of answers that pass (%), their mean score (0–100) and the tokens one answer cost, in thousands. Pick a date to see that day alone, or All time; hide a measure from the legend to compare the rest. Levels with no answers in the period have no bars." height={300} categories={levels.map(level => level.label)} series={[
          { name: 'Answers', data: bars(row => row.answers) },
          { name: 'Tasks', data: bars(row => row.tasks) },
          { name: 'Pass rate (%)', data: bars(row => row.passRate === null ? null : Math.round(row.passRate * 100)) },
          { name: 'Mean score (0–100)', data: bars(row => row.meanScore === null ? null : Math.round(row.meanScore * 100)) },
          { name: 'Tokens / answer (k)', data: bars(row => row.tokensPerAnswer === null ? null : Math.round(row.tokensPerAnswer / 100) / 10) },
        ]} />
      ) : (
        <>
          <Table>
            <TableHead><tr data-helix-part="table-row"><TableHeaderCell>Level</TableHeaderCell><TableHeaderCell>Answers</TableHeaderCell><TableHeaderCell>Tasks</TableHeaderCell><TableHeaderCell>Pass rate</TableHeaderCell><TableHeaderCell>Mean score</TableHeaderCell><TableHeaderCell>Tokens / answer</TableHeaderCell></tr></TableHead>
            <tbody data-helix-part="table-body">
              {stats.map(row => (
                <tr key={row.level.variant} data-helix-part="table-row">
                  <TableCell>{row.level.label}</TableCell>
                  {row.answers ? (
                    <>
                      <TableCell>{row.answers}</TableCell><TableCell>{row.tasks}</TableCell><TableCell>{pct(row.passRate)}</TableCell>
                      <TableCell>{row.meanScore === null ? '—' : Math.round(row.meanScore * 100)}</TableCell><TableCell>{fmtTokens(row.tokensPerAnswer)}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell><Badge variant="neutral" label="Not run" /></TableCell>
                      <TableCell>—</TableCell><TableCell>—</TableCell><TableCell>—</TableCell><TableCell>—</TableCell>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
          {periodRounds.length > 0 && (
            <Table>
              <TableHead><tr data-helix-part="table-row"><TableHeaderCell>Round</TableHeaderCell><TableHeaderCell>Commit</TableHeaderCell><TableHeaderCell>Tasks × runs</TableHeaderCell><TableHeaderCell>Answers</TableHeaderCell><TableHeaderCell>Tokens</TableHeaderCell></tr></TableHead>
              <tbody data-helix-part="table-body">
                {[...periodRounds].reverse().map(round => (
                  <tr key={round.id} data-helix-part="table-row">
                    <TableCell>{roundLabel(round)}</TableCell><TableCell>{round.commit.slice(0, 7)}</TableCell><TableCell>{round.tasks.length} × {round.runs}</TableCell>
                    <TableCell>{round.levels.reduce((sum, level) => sum + level.answers, 0)}</TableCell><TableCell>{fmtTokens(roundTokens(round) || null)}</TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
    </Card>
  );
}

// [CUSTOM] Date picker with hover preview. Helix has no DatePicker — a popover calendar has no native
// element and needs its own ADR before it can join core (packages/core/CLAUDE.md) — and the browser's own
// date popup can't tell the page which day the pointer is on, so it can't preview. Built from Helix parts:
// the trigger is a read-only Helix Input (same look as every field), days are ghost Buttons, month arrows
// IconButtons, and the panel uses tokens only. Hover or focus a day to preview it, click or Enter to
// choose; days with evals carry a dot; arrows move by day/week, Escape closes.
const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromIso = (iso: string) => new Date(`${iso}T12:00:00`);

function EvalDatePicker({ value, onChange, onPreview, dataDates, min, max }: { value: string; onChange: (iso: string) => void; onPreview: (iso: string | null) => void; dataDates: string[]; min: string; max: string }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => (value || dataDates[dataDates.length - 1] || max).slice(0, 7));
  const [focusIso, setFocusIso] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const withData = new Set(dataDates);
  const close = (restoreFocus = true) => {
    setOpen(false); onPreview(null); setFocusIso(null);
    if (restoreFocus) root.current?.querySelector<HTMLInputElement>('input')?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) close(false); };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open]);
  useEffect(() => { if (open && focusIso) grid.current?.querySelector<HTMLButtonElement>(`[data-iso="${focusIso}"]`)?.focus(); }, [open, focusIso, month]);

  const first = fromIso(`${month}-01`);
  const lead = (first.getDay() + 6) % 7; // weeks start on Monday
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toIso(new Date(first.getFullYear(), first.getMonth(), i + 1)))];
  const shiftMonth = (by: number) => setMonth(toIso(new Date(first.getFullYear(), first.getMonth() + by, 1)).slice(0, 7));
  const openAt = () => { const start = value || dataDates[dataDates.length - 1] || max; setMonth(start.slice(0, 7)); setFocusIso(start); setOpen(true); };
  const choose = (iso: string) => { onChange(iso); close(); };
  const move = (from: string, days: number) => {
    const next = fromIso(from); next.setDate(next.getDate() + days);
    const iso = toIso(next);
    if (iso < min || iso > max) return;
    setMonth(iso.slice(0, 7)); setFocusIso(iso); onPreview(iso);
  };
  const keys: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  // Weekday initials in the viewer's language, Monday first (5 Jan 2026 is a Monday).
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(2026, 0, 5 + i)));

  return (
    <div ref={root} style={{ position: 'relative', width: '11rem' }}>
      <Input size="m" label="Date" hideLabel readOnly fullWidth placeholder="All time" value={value ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(fromIso(value)) : ''} iconEnd={IconCalendar}
        aria-haspopup="dialog" aria-expanded={open} style={{ cursor: 'pointer' }}
        onClick={() => (open ? close(false) : openAt())}
        onKeyDown={event => { if (['Enter', ' ', 'ArrowDown'].includes(event.key)) { event.preventDefault(); openAt(); } }} />
      {open && (
        <div role="dialog" aria-label="Choose a date" onMouseLeave={() => onPreview(null)}
          onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); close(); } }}
          // Own regular weight: the panel sits inside the Card header, whose title weight would otherwise cascade.
          style={{ position: 'absolute', zIndex: 10, top: 'calc(100% + var(--helix-spacing-2xs))', right: 0, display: 'grid', fontWeight: 'var(--helix-textStyle-body-s-regular-fontWeight)', gap: 'var(--helix-spacing-xs)', padding: 'var(--helix-spacing-s)', background: 'var(--helix-color-fill-page)', border: '1px solid var(--helix-color-border-neutral)', borderRadius: 'var(--helix-radius-l)', boxShadow: 'var(--helix-shadow-m)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--helix-spacing-xs)' }}>
            <IconButton icon={IconChevronLeft} label="Previous month" variant="ghost" size="s" disabled={`${month}-01` <= min.slice(0, 7) + '-01'} onClick={() => shiftMonth(-1)} />
            <span aria-live="polite" style={{ fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)', fontWeight: 'var(--helix-textStyle-body-s-regular-fontWeight)', color: 'var(--helix-color-text-neutral)' }}>{new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(first)}</span>
            <IconButton icon={IconChevronRight} label="Next month" variant="ghost" size="s" disabled={month >= max.slice(0, 7)} onClick={() => shiftMonth(1)} />
          </div>
          <div ref={grid} role="group" aria-label="Days" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, var(--helix-spacing-xl))', gap: 'var(--helix-spacing-3xs)', fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)' }}>
            {weekdays.map(day => <span key={day} aria-hidden="true" style={{ textAlign: 'center', color: 'var(--helix-color-text-neutral-light)' }}>{day}</span>)}
            {cells.map((iso, index) => iso === null ? <span key={`lead-${index}`} /> : iso < min || iso > max ? (
              // Out of range (before the first eval, or in the future): plain muted text, not a disabled button.
              <span key={iso} aria-hidden="true" style={{ display: 'grid', placeItems: 'center', height: 'var(--helix-button-height-s)', color: 'var(--helix-color-text-disabled)' }}>{fromIso(iso).getDate()}</span>
            ) : (
              <Button key={iso} data-iso={iso} size="s" variant={iso === value ? 'primary' : 'ghost'}
                tabIndex={iso === (focusIso ?? value) ? 0 : -1}
                aria-label={`${new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(fromIso(iso))}${withData.has(iso) ? ', evals run' : ''}`}
                aria-pressed={iso === value}
                onMouseEnter={() => onPreview(iso)} onFocus={() => onPreview(iso)}
                onKeyDown={event => { if (keys[event.key]) { event.preventDefault(); move(iso, keys[event.key]); } }}
                onClick={() => choose(iso)}>
                <span style={{ display: 'grid', justifyItems: 'center', lineHeight: 1 }}>
                  {fromIso(iso).getDate()}
                  <span aria-hidden="true" style={{ width: 'var(--helix-spacing-2xs)', height: 'var(--helix-spacing-2xs)', borderRadius: 'var(--helix-radius-full)', background: withData.has(iso) ? 'currentColor' : 'transparent' }} />
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const verdictBadge: Record<RoundImprovement['verdict'], { variant: 'success' | 'danger' | 'neutral'; label: string }> = {
  better: { variant: 'success', label: 'Better' },
  worse: { variant: 'danger', label: 'Worse' },
  same: { variant: 'neutral', label: 'No change' },
  'not comparable': { variant: 'neutral', label: 'Not comparable' },
};

// Why a Metrics line moved, with nothing to record by hand: each eval round against the one before —
// the commits in between are what changed, the per-level score difference is what it did.
function ImprovementHistory({ improvements }: { improvements: RoundImprovement[] }) {
  const when = (date: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
  const change = (commits: string[], uncommitted: boolean) => {
    const shown = commits.slice(0, 3).join(' · ');
    const more = commits.length > 3 ? ` · +${commits.length - 3} more` : '';
    const dirty = uncommitted ? `${commits.length ? ' · ' : ''}uncommitted edits` : '';
    return commits.length || uncommitted ? `${shown}${more}${dirty}` : 'No changes between rounds — run-to-run variation only';
  };
  return (
    <Card header="Improvement history">
      {improvements.length ? (
        <Table>
          <TableHead><tr data-helix-part="table-row"><TableHeaderCell>Round</TableHeaderCell><TableHeaderCell>What changed</TableHeaderCell><TableHeaderCell>Effect (mean score)</TableHeaderCell><TableHeaderCell>Result</TableHeaderCell></tr></TableHead>
          <tbody data-helix-part="table-body">
            {improvements.map(item => (
              <tr key={item.id} data-helix-part="table-row">
                <TableCell>{when(item.date)}</TableCell>
                <TableCell>{change(item.commits, item.uncommitted)}</TableCell>
                <TableCell>{item.levels.map(level => `${level.label} ${Math.round(level.before.meanScore * 100)}→${Math.round(level.after.meanScore * 100)}`).join(' · ') || '—'}{item.tasksCompared ? ` (${item.tasksCompared} task${item.tasksCompared > 1 ? 's' : ''})` : ''}</TableCell>
                <TableCell><Badge variant={verdictBadge[item.verdict].variant} label={verdictBadge[item.verdict].label} /></TableCell>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : <p style={{ color: 'var(--helix-color-text-neutral-light)' }}>Fills in by itself from your second eval round on: each round is compared with the one before — the commits in between are what changed, the score difference per level is what it did.</p>}
    </Card>
  );
}

const meta: Meta = { title: 'Data/Metrics', parameters: { layout: 'padded' } };
export default meta;
type Story = StoryObj;

export const Quality: Story = { render: () => <DataAnalyticsPage /> };
