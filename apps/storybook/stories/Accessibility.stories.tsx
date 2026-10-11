import type { Meta, StoryObj } from '@storybook/react';
import { Accordion, Badge, Card, Chart, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@helixds/react';
import report from '../../../quality/accessibility.json';
import { StoryHeader } from './_shared/StoryHeader';

// Data from `pnpm a11y` (scripts/a11y.ts): every accessibility check, run on every component in code — Figma
// isn't involved. Each check runs on its own too (`pnpm a11y:<check> [Name,…]`), and this page shows the latest
// result of each, with the date it ran, what it measures and the command that re-runs it.

type Status = 'pass' | 'fail' | 'n/a' | 'pending';
type Result = { status: Status; details: string[]; checkedAt: string };
type CheckDef = { id: string; label: string; wcag: string; kind: 'static' | 'browser' | 'review'; how: string; command: string };
type Summary = { id: string; pass: number; fail: number; na: number; pending: number };

const checks = report.checks as CheckDef[];
const summary = report.summary as Summary[];
const components = report.components as Record<string, Record<string, Result>>;
const names = Object.keys(components);

const muted = { color: 'var(--helix-color-text-neutral-light)', fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)' };
const mono = { fontFamily: 'var(--font-mono)', fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)' };
const VARIANT: Record<Status, 'success' | 'danger' | 'neutral' | 'warning'> = { pass: 'success', fail: 'danger', 'n/a': 'neutral', pending: 'warning' };
const TEXT: Record<Status, string> = { pass: 'Pass', fail: 'Fail', 'n/a': 'n/a', pending: 'Pending' };
const KIND: Record<CheckDef['kind'], string> = { static: 'Contract + stories (no browser)', browser: 'Real browser', review: 'Review (not blocking)' };

// Pass rate among components the check applies to and has run on — n/a and pending are shown, never counted as passes.
const rate = (s: Summary) => (s.pass + s.fail ? Math.round((s.pass / (s.pass + s.fail)) * 100) : null);
const fmt = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function StatusBadge({ r }: { r: Result | undefined }) {
  const status = r?.status ?? 'pending';
  return <Badge variant={VARIANT[status]} label={TEXT[status]} />;
}

function AccessibilityPage() {
  // A check nobody has run yet has no rate — it's left out of the chart rather than drawn as 0%.
  const rated = checks.filter(c => rate(summary.find(s => s.id === c.id)!) !== null);
  const blocking = summary.filter(s => checks.find(c => c.id === s.id)?.kind !== 'review');
  const failing = blocking.reduce((n, s) => n + s.fail, 0);
  const allPass = names.filter(n => checks.filter(c => c.kind !== 'review').every(c => ['pass', 'n/a'].includes(components[n]?.[c.id]?.status ?? 'pending')));
  return (
    <div style={{ display: 'grid', gap: 'var(--helix-spacing-l)' }}>
      <StoryHeader
        title="Accessibility"
        description="Every accessibility check, run on every component in code. Each check is independent: run it alone with pnpm a11y:<check> [Name,…], or all at once with pnpm a11y. Reviews (AI visual, human) are recorded for people and never block."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--helix-spacing-m)' }}>
        <Card header="Automatic checks">
          <div style={{ display: 'grid', gap: 'var(--helix-spacing-xs)' }}>
            <strong style={{ fontSize: 'var(--helix-textStyle-heading-xl-bold-fontSize)' }}>{allPass.length} / {names.length} components</strong>
            <span style={muted}>pass every automatic check that applies to them · {failing} failing result{failing === 1 ? '' : 's'}</span>
          </div>
        </Card>
        <Card header="Human review">
          <div style={{ display: 'grid', gap: 'var(--helix-spacing-xs)' }}>
            <strong style={{ fontSize: 'var(--helix-textStyle-heading-xl-bold-fontSize)' }}>{summary.find(s => s.id === 'human')!.pass} / {names.length}</strong>
            <span style={muted}>reviewed by a person with a real screen reader. Record one with <code style={mono}>pnpm a11y:review</code>.</span>
          </div>
        </Card>
        <Card header="Last run">
          <div style={{ display: 'grid', gap: 'var(--helix-spacing-xs)' }}>
            <strong>{fmt(report.generatedAt)}</strong>
            <span style={muted}>Helix version {report.commit}. Each check below shows when it last ran.</span>
          </div>
        </Card>
      </div>

      <Chart
        variant="bar"
        label="Pass rate per accessibility check"
        description="Per check, the share of components that pass, among those it applies to and has run on. Doesn't-apply and pending results aren't counted as passes — the table below shows them."
        categories={rated.map(c => c.label)}
        series={[{ name: 'Components passing (%)', data: rated.map(c => rate(summary.find(s => s.id === c.id)!)) }]}
      />

      <section style={{ display: 'grid', gap: 'var(--helix-spacing-s)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--helix-textStyle-heading-l-bold-fontSize)' }}>The checks</h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Check</TableHeaderCell>
              <TableHeaderCell>WCAG</TableHeaderCell>
              <TableHeaderCell>Pass rate</TableHeaderCell>
              <TableHeaderCell>What it measures</TableHeaderCell>
              <TableHeaderCell>Run it</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {checks.map(c => {
              const s = summary.find(x => x.id === c.id)!;
              const r = rate(s);
              return (
                <TableRow key={c.id}>
                  <TableCell><strong>{c.label}</strong><div style={muted}>{KIND[c.kind]}</div></TableCell>
                  <TableCell>{c.wcag}</TableCell>
                  <TableCell>
                    <Badge variant={r === null ? 'neutral' : r === 100 ? 'success' : 'danger'} label={r === null ? 'not run' : `${r}%`} />
                    <div style={muted}>{s.pass} pass · {s.fail} fail · {s.na} n/a · {s.pending} pending</div>
                  </TableCell>
                  <TableCell><span style={muted}>{c.how}</span></TableCell>
                  <TableCell><code style={mono}>{c.command}</code></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      <section style={{ display: 'grid', gap: 'var(--helix-spacing-s)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--helix-textStyle-heading-l-bold-fontSize)' }}>Every component, every check</h2>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Component</TableHeaderCell>
                {checks.map(c => <TableHeaderCell key={c.id}>{c.label}</TableHeaderCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {names.map(n => (
                <TableRow key={n}>
                  <TableCell><strong>{n}</strong></TableCell>
                  {checks.map(c => <TableCell key={c.id}><StatusBadge r={components[n]?.[c.id]} /></TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 'var(--helix-spacing-s)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--helix-textStyle-heading-l-bold-fontSize)' }}>Details</h2>
        <span style={muted}>What each failing, pending or reviewed result says — and when it was checked.</span>
        {names.map(n => {
          const rows = checks.map(c => ({ c, r: components[n]?.[c.id] })).filter(({ r }) => r && r.details.length);
          if (!rows.length) return null;
          return (
            <Accordion key={n} label={n}>
              <div style={{ display: 'grid', gap: 'var(--helix-spacing-xs)' }}>
                {rows.map(({ c, r }) => (
                  <div key={c.id}>
                    <strong>{c.label}</strong> <StatusBadge r={r} /> <span style={muted}>· {fmt(r!.checkedAt)}</span>
                    <pre style={{ ...mono, margin: 0, whiteSpace: 'pre-wrap' }}>{r!.details.join('\n')}</pre>
                  </div>
                ))}
              </div>
            </Accordion>
          );
        })}
      </section>
    </div>
  );
}

const meta: Meta = { title: 'Data/Accessibility', parameters: { layout: 'padded' } };
export default meta;
type Story = StoryObj;

export const Report: Story = { render: () => <AccessibilityPage /> };
