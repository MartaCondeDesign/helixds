import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import { Badge, Button, Card, Chart, SegmentedControl, Table, TableCell, TableHead, TableHeaderCell } from '@helix-ds/core';
import rawSnapshot from '../../../quality/dashboard.json';
import history from '../../../quality/history.json';
import rawChangelog from '../../../.ai/maps/changelog.json';
import { StoryHeader } from './_shared/StoryHeader';

type HistoryPoint = { date: string; score: number | null; evalPassRate?: number | null; tokens?: number; components?: Record<string, number>; figma?: Record<string, number> };

type DashboardSnapshot = {
  generatedAt: string;
  components: { total: number; byStatus: Record<string, number> };
  figma: Record<string, number>;
  tokens: { defined: number };
  healthScore: number | null;
  evals: { generations: number; passRate: number | null; promptsCovered: number; globalChecks: Array<{ id: string; label: string; failed: number; rate: number }> };
  weekly: { from: string; to: string; evals: { passRate: number | null } };
  changes: Array<{ id: string; date: string; area: string; summary: string; status: string }>;
};

const snapshot = rawSnapshot as DashboardSnapshot;
const metricHistory = history as HistoryPoint[];
type Changelog = { commitCount: number; days: Array<{ date: string; commits: unknown[] }> };
const changelog = rawChangelog as Changelog;

const pct = (value: number | null) => value === null ? '—' : `${Math.round(value * 100)}%`;
const riskLabel: Record<string, string> = {
  'hardcoded-color': 'Colores escritos fuera de tokens',
  'hardcoded-size': 'Tamaños fijos sin tokens',
  'inline-style': 'Estilos fuera de Helix',
  'raw-div': 'Layout manual sin componentes Helix',
  'raw-icon': 'Icono sin el componente Icon de Helix',
  'icon-element-prop': 'Icono pasado de forma incorrecta',
  'on-click': 'Usó onClick en vez de onPress',
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
  const latestChanges = snapshot.changes.slice(0, 5);
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
        <Chart variant="bar" label="Design-system health score" description="Average of component readiness, Figma alignment, agent reliability, Helix-rule compliance, and governance coverage (contracts with rationale, neverUseFor and governance boundaries). Day shows the rolling 30-day window; Month the rolling 12-month window; Year starts at 2024 and adds each calendar year. Missing periods have no bar." categories={healthHistory.map(point => point.date)} series={[{ name: 'Health score', data: healthHistory.map(point => point.score) }]} />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--helix-spacing-m)' }}>
        <Metric label="Components" value={snapshot.components.total} detail={`${snapshot.components.byStatus.stable ?? 0} stable · ${snapshot.components.byStatus.beta ?? 0} beta`} />
        <Metric label="Figma alignment" value={snapshot.figma.synced ?? 0} detail={`${snapshot.figma.missing ?? 0} components not modelled`} />
        <Metric label="Agent eval pass rate" value={pct(snapshot.evals.passRate)} detail={`${snapshot.evals.generations} runs · ${snapshot.evals.promptsCovered} prompts`} />
        <Metric label="Design tokens" value={snapshot.tokens.defined} detail="Tokens indexed in this snapshot" />
      </div>

      <Card header={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--helix-spacing-m)' }}><span>Explore Metrics</span>{(detail === 'components' || detail === 'figma') && <Button size="s" variant="secondary" onPress={() => window.top?.location.assign('/?path=/story/data-status--overview')}>View more</Button>}</div>}>
        <SegmentedControl label="Metric detail" value={detail} onChange={setDetail} options={[{ value: 'components', label: 'Components' }, { value: 'figma', label: 'Figma' }, { value: 'agents', label: 'Agents' }, { value: 'tokens', label: 'Tokens' }]} />
        {detail === 'components' ? <Chart variant="bar" label="Component status over time" description="Daily percentage of components in Draft, Beta, and Stable status across the rolling 30-day window." height={240} categories={recentMetricHistory.map(point => point.label)} series={[{ name: 'Draft', data: recentMetricHistory.map(point => point.components ? Math.round(((point.components.draft ?? 0) / snapshot.components.total) * 100) : null) }, { name: 'Beta', data: recentMetricHistory.map(point => point.components ? Math.round(((point.components.beta ?? 0) / snapshot.components.total) * 100) : null) }, { name: 'Stable', data: recentMetricHistory.map(point => point.components ? Math.round(((point.components.stable ?? 0) / snapshot.components.total) * 100) : null) }]} />
          : detail === 'figma' ? <Chart variant="bar" label="Figma alignment over time" description="Daily percentage of components aligned, out of date, or not modelled in Figma across the rolling 30-day window." height={240} categories={recentMetricHistory.map(point => point.label)} series={[{ name: 'Aligned', data: recentMetricHistory.map(point => point.figma ? Math.round(((point.figma.synced ?? 0) / snapshot.components.total) * 100) : null) }, { name: 'Out of date', data: recentMetricHistory.map(point => point.figma ? Math.round(((point.figma.stale ?? 0) / snapshot.components.total) * 100) : null) }, { name: 'Not modelled', data: recentMetricHistory.map(point => point.figma ? Math.round(((point.figma.missing ?? 0) / snapshot.components.total) * 100) : null) }]} />
          : detail === 'agents' ? <Chart variant="area" label="Agent evaluation pass rate" description="Pass rate over the last 30 days. Historical points appear as quality snapshots are recorded." height={240} categories={recentMetricHistory.map(point => point.label)} series={[{ name: 'Pass rate', data: recentMetricHistory.map(point => point.passRate === null ? null : Math.round(point.passRate * 100)) }]} />
              : <Chart variant="area" label="Token inventory" description="Tokens indexed during the last 30 days. Historical points appear as quality snapshots are recorded." height={240} categories={recentMetricHistory.map(point => point.label)} series={[{ name: 'Tokens', data: recentMetricHistory.map(point => point.tokens) }]} />}
      </Card>

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


      <Card header="Improvement history">
        {latestChanges.length ? (
          <Table>
            <TableHead><tr data-helix-part="table-row"><TableHeaderCell>Date</TableHeaderCell><TableHeaderCell>Area</TableHeaderCell><TableHeaderCell>Observation</TableHeaderCell><TableHeaderCell>Status</TableHeaderCell></tr></TableHead>
            <tbody data-helix-part="table-body">
              {latestChanges.map(change => <tr key={change.id} data-helix-part="table-row"><TableCell>{change.date}</TableCell><TableCell>{change.area}</TableCell><TableCell>{change.summary}</TableCell><TableCell><Badge variant={change.status === 'verified' ? 'success' : 'neutral'} label={change.status} /></TableCell></tr>)}
            </tbody>
          </Table>
        ) : <p style={{ color: 'var(--helix-color-text-neutral-light)' }}>No reviewed improvements recorded yet. Add one with pnpm quality record, then run pnpm quality snapshot.</p>}
      </Card>

      <p style={{ margin: 0, color: 'var(--helix-color-text-neutral-lightest)', fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)' }}>
        Snapshot generated {new Date(snapshot.generatedAt).toLocaleString()} · rolling eval window {snapshot.weekly.from}–{snapshot.weekly.to}
      </p>
    </div>
  );
}

const meta: Meta = { title: 'Data/Metrics', parameters: { layout: 'padded' } };
export default meta;
type Story = StoryObj;

export const Quality: Story = { render: () => <DataAnalyticsPage /> };
