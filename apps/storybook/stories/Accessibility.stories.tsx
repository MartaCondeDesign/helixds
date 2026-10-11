import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { IconSearch } from '@tabler/icons-react';
import { Badge, Card, Chart, Input, Menu, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@helixds/react';
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
const scores = report.scores as Record<string, { score: number | null; passed: number; applicable: number; meetsMinimum: boolean }>;

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

// One field to search AND pick a component (an editable combobox, WAI-ARIA APG): typing filters the list,
// Arrow Up/Down move through it, Enter or a click picks, Escape closes. Built from Helix's own Input (the
// field) and Menu (the list) — Helix has no searchable select yet.
function ComponentPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const failing = (n: string) => checks.filter(c => c.kind !== 'review' && components[n]?.[c.id]?.status === 'fail').length; // reviews aren't scored
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);
  // The list hangs from the whole field (icon included), so it spans the search box edge to edge.
  const fieldRef = useRef<HTMLElement | null>(null);
  useEffect(() => { fieldRef.current = inputRef.current?.closest<HTMLElement>('[data-helix-part="input-wrapper"]') ?? inputRef.current; }, []);
  const menuId = 'a11y-component-list';
  // While the text is the picked name, show every component; once edited, only the matches.
  const matches = text === value ? names : names.filter(n => n.toLowerCase().includes(text.trim().toLowerCase()));
  const pick = (n: string) => { onChange(n); setText(n); setOpen(false); setActive(undefined); };
  const move = (step: number) => {
    if (!matches.length) return;
    setOpen(true);
    const i = active ? matches.indexOf(active) : -1;
    setActive(matches[(i + step + matches.length) % matches.length]);
  };
  return (
    <div style={{ maxWidth: 360 }}>
      <Input
        ref={inputRef}
        label="Component"
        icon={IconSearch}
        placeholder="Search or pick a component"
        description={`${matches.length} of ${names.length} components`}
        value={text}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={menuId}
        aria-activedescendant={open && active ? `${menuId}-option-${active}` : undefined}
        onFocus={e => { e.target.select(); setOpen(true); }}
        onClick={() => setOpen(true)}
        onBlur={() => { setOpen(false); setText(value); }}
        onChange={e => { setText(e.target.value); setOpen(true); setActive(undefined); }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
          else if (e.key === 'Enter') { e.preventDefault(); const n = active ?? (matches.length === 1 ? matches[0] : undefined); if (n) pick(n); }
          else if (e.key === 'Escape' && open) { e.preventDefault(); setOpen(false); setText(value); }
        }}
      />
      <Menu
        id={menuId}
        expanded={open && matches.length > 0}
        anchorRef={fieldRef}
        options={matches.map(n => ({ value: n, label: n, ...(failing(n) ? { labelEnd: `${failing(n)} failing` } : {}) }))}
        value={value}
        {...(active ? { activeValue: active } : {})}
        onSelect={pick}
      />
    </div>
  );
}

// The picked component's every check: result, why, when it ran, and how to re-run it.
function ComponentDetails() {
  const failing = (n: string) => checks.filter(c => c.kind !== 'review' && components[n]?.[c.id]?.status === 'fail').length; // reviews aren't scored
  const [current, setCurrent] = useState<string>(names.find(n => failing(n)) ?? names[0]!);
  return (
    <section style={{ display: 'grid', gap: 'var(--helix-spacing-s)' }}>
      <h2 style={{ margin: 0, fontSize: 'var(--helix-textStyle-heading-l-bold-fontSize)' }}>Component details</h2>
      <ComponentPicker value={current} onChange={setCurrent} />
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Check</TableHeaderCell>
            <TableHeaderCell>Result</TableHeaderCell>
            <TableHeaderCell>Why</TableHeaderCell>
            <TableHeaderCell>Checked</TableHeaderCell>
            <TableHeaderCell>Re-run</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {checks.map(c => {
            const r = components[current]?.[c.id];
            return (
              <TableRow key={c.id}>
                <TableCell><strong>{c.label}</strong><div style={muted}>WCAG {c.wcag}</div></TableCell>
                <TableCell><StatusBadge r={r} /></TableCell>
                <TableCell><pre style={{ ...mono, margin: 0, whiteSpace: 'pre-wrap' }}>{r?.details.length ? r.details.join('\n') : r?.status === 'pass' ? c.how : '—'}</pre></TableCell>
                <TableCell><span style={muted}>{r ? fmt(r.checkedAt) : 'never'}</span></TableCell>
                <TableCell><code style={mono}>{c.command} {current}</code></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
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
        <Card header="Accessibility score">
          <div style={{ display: 'grid', gap: 'var(--helix-spacing-xs)' }}>
            <strong style={{ fontSize: 'var(--helix-textStyle-heading-xl-bold-fontSize)' }}>{report.score ?? '—'} / 100</strong>
            <span style={muted}>Average of the component scores below — each one the % of automatic checks that apply to it and pass (not run = not passed; reviews aren’t scored). Feeds Design System Health.</span>
          </div>
        </Card>
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
                <TableHeaderCell>Score</TableHeaderCell>
                {checks.map(c => <TableHeaderCell key={c.id}>{c.label}</TableHeaderCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {names.map(n => (
                <TableRow key={n}>
                  <TableCell><strong>{n}</strong></TableCell>
                  <TableCell>
                    <Badge variant={scores[n]?.meetsMinimum ? 'success' : 'danger'} label={`${scores[n]?.score ?? '—'}`} />
                  </TableCell>
                  {checks.map(c => <TableCell key={c.id}><StatusBadge r={components[n]?.[c.id]} /></TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <ComponentDetails />
    </div>
  );
}

const meta: Meta = { title: 'Data/Accessibility', parameters: { layout: 'padded' } };
export default meta;
type Story = StoryObj;

export const Report: Story = { render: () => <AccessibilityPage /> };
