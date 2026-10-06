import type { Meta, StoryObj } from '@storybook/react';
import { Component, useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Badge, Card, IconButton, Select, Tooltip } from '@helix-ds/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { StoryHeader } from './_shared/StoryHeader';
import ladder from '../../../evals/ladder.json';

// Data from `pnpm eval:gallery` (apps/storybook/eval-gallery/, git-ignored). Globs, not imports, so the
// page still loads — with instructions — before the script has ever run.
type Cell = { id: string; promptId: string; variant: string; context: string | null; rep: number | null; score: number; passed: boolean; tokens: number | null; issues?: string[] };
const indexFiles = import.meta.glob<{ default: { generatedAt: string; tasks?: string[]; cells: Cell[] } }>('../eval-gallery/index.json', { eager: true });
const cellModules = import.meta.glob<Record<string, unknown>>('../eval-gallery/cells/*.tsx');
const gallery = Object.values(indexFiles)[0]?.default ?? null;

// Rows: the context ladder (evals/ladder.json, shared with `pnpm eval:ladder` and Proof), least to most
// guidance. A one-off experiment on a few tasks (chip-rule, agents-props…) isn't a level, so it's left out.
const variantInfo: Record<string, { label: string; detail: string; explain: string }> = Object.fromEntries(
  ladder.levels.map(level => [level.variant, { label: level.label, detail: level.detail, explain: level.explain }]),
);

// Score badge: the row's mean score on the scale of its answers — a mean of 80 over 5 answers reads 4/5.
// Red at ≤ 1 in 5, orange at 2–3, green at 4–5 (as a share, so rows of any size read the same way).
// Scored, not counted: an answer at 80 that misses one criterion still counts as 80, not as a fail.
const scoreOutOf = (mean: number, total: number) => Math.round(mean * total);
const scoreVariant = (outOf: number, total: number): 'danger' | 'warning' | 'success' =>
  outOf / total < 0.4 ? 'danger' : outOf / total < 0.8 ? 'warning' : 'success';

// One line on what's wrong with a row: its most common problem — the badge beside the score already gives
// the count. On a tie the earlier problem wins — issues are listed build-breaking first.
function rowStatus(cells: Cell[]) {
  const failing = cells.filter(cell => !cell.passed);
  if (!failing.length) return 'Every answer passes its checks.';
  const counts = new Map<string, number>();
  for (const cell of failing) for (const issue of new Set(cell.issues ?? [])) counts.set(issue, (counts.get(issue) ?? 0) + 1);
  const [top] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return top ? `${top[0]}.` : 'Answers fail their checks.';
}
const variantOrder = Object.keys(variantInfo);

const DEFAULT_TASK = 'button-basic';
const score100 = (score: number) => (score * 100).toFixed(2);
const fmtTokens = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(Math.round(n));

class CellBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: unknown) { return { error: error instanceof Error ? error.message : String(error) }; }
  render() { return this.state.error ? <CellMessage tone="danger">Render failed: {this.state.error}</CellMessage> : this.props.children; }
}

function CellMessage({ tone, children }: { tone: 'danger' | 'neutral'; children: ReactNode }) {
  return (
    <p style={{ margin: 0, padding: 'var(--helix-spacing-m)', fontFamily: 'monospace', fontSize: 12, color: tone === 'danger' ? 'var(--helix-color-text-danger)' : 'var(--helix-color-text-neutral-light)' }}>
      {children}
    </p>
  );
}

// The agent's own answer, loaded and rendered for real: a broken import or syntax error shows up here
// the same way it would in a consumer's app.
function LiveCell({ id }: { id: string }) {
  const [state, setState] = useState<{ Comp?: ComponentType; error?: string }>({});
  useEffect(() => {
    const load = cellModules[`../eval-gallery/cells/${id}.tsx`];
    if (!load) { setState({ error: 'Answer file missing — rerun pnpm eval:gallery' }); return; }
    load().then(mod => {
      if (typeof mod.__buildError === 'string') { setState({ error: `Build failed: ${mod.__buildError}` }); return; }
      const Comp = (mod.default ?? Object.entries(mod).find(([name, value]) => /^[A-Z]/.test(name) && typeof value === 'function')?.[1]) as ComponentType | undefined;
      setState(Comp ? { Comp } : { error: 'No component exported' });
    }, (error: unknown) => setState({ error: `Build failed: ${error instanceof Error ? error.message : String(error)}` }));
  }, [id]);
  if (state.error) return <CellMessage tone="danger">{state.error}</CellMessage>;
  if (!state.Comp) return <CellMessage tone="neutral">Loading…</CellMessage>;
  const Comp = state.Comp;
  return <CellBoundary><Comp /></CellBoundary>;
}

// Level name + an info button whose tooltip says, in plain words, what the agent was given at that level.
function LevelTitle({ label, explain }: { label: string; explain: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-2xs)' }}>
      <h2 style={{ margin: 0, fontSize: 16, color: 'var(--helix-color-text-neutral)' }}>{label}</h2>
      <Tooltip label={explain} placement="right">
        <IconButton icon={IconInfoCircle} label={`What is ${label}?`} variant="ghost" size="s" />
      </Tooltip>
    </div>
  );
}

function EvalGallery() {
  const ran = useMemo(() => new Set(gallery?.cells.filter(cell => cell.variant in variantInfo).map(cell => cell.promptId)), []);
  // Every task, run or not, so what's still missing is visible.
  const tasks = useMemo(() => [...new Set([...ran, ...(gallery?.tasks ?? [])])].sort(), [ran]);
  // Each task's mean score over the answers shown (every level, latest round), or "–" if never run.
  const taskMean = (t: string) => {
    const cells = gallery?.cells.filter(cell => cell.promptId === t && cell.variant in variantInfo) ?? [];
    return cells.length ? `${Math.round((cells.reduce((sum, cell) => sum + cell.score, 0) / cells.length) * 100)}%` : '–';
  };
  // The gallery always opens on button-basic — the reference task every level is compared on first.
  const [task, setTask] = useState(tasks.includes(DEFAULT_TASK) ? DEFAULT_TASK : tasks[0] ?? '');
  // Opens at actual size — the answers as they really render; Small and Medium are for scanning.
  const [scale, setScale] = useState('1');

  const rows = useMemo(() => {
    // Every level gets a row, run or not, so the whole ladder is visible from the start.
    const byVariant = new Map<string, Cell[]>(variantOrder.map(variant => [variant, []]));
    for (const cell of gallery?.cells ?? []) {
      if (cell.promptId !== task || !(cell.variant in variantInfo)) continue;
      byVariant.set(cell.variant, [...(byVariant.get(cell.variant) ?? []), cell]);
    }
    return [...byVariant.entries()]
      .sort(([a], [b]) => variantOrder.indexOf(a) - variantOrder.indexOf(b))
      .map(([variant, cells]) => ({ variant, cells: cells.sort((a, b) => (a.rep ?? 0) - (b.rep ?? 0)) }));
  }, [task]);

  if (!gallery) {
    return <Card><CellMessage tone="neutral">No gallery data yet. Run pnpm eval:gallery from the repo root, then reload.</CellMessage></Card>;
  }

  const zoom = Number(scale);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-spacing-l)' }}>
      <div style={{ display: 'flex', gap: 'var(--helix-spacing-m)', alignItems: 'end', flexWrap: 'wrap' }}>
        {/* Fixed width — as wide as the longest task — so picking another task never resizes the field. */}
        <div style={{ width: `${Math.max(...tasks.map(t => t.length)) + 4}ch`, maxWidth: '100%' }}>
          <Select label="Task" fullWidth value={task} onChange={setTask} options={tasks.map(t => ({ value: t, label: t, labelEnd: taskMean(t) }))} />
        </div>
        <Select label="Preview size" value={scale} onChange={setScale} options={[{ value: '0.4', label: 'Small' }, { value: '0.6', label: 'Medium' }, { value: '1', label: 'Actual size' }]} />
      </div>

      {rows.map(({ variant, cells }) => {
        const info = variantInfo[variant];
        if (!cells.length) {
          return (
            <section key={variant} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 'var(--helix-spacing-m)' }}>
              <div style={{ paddingLeft: 'var(--helix-spacing-m)' }}>
                <LevelTitle label={info.label} explain={info.explain} />
              </div>
              <Card>
                <CellMessage tone="neutral">Not run yet — generate it with:<br /><code style={{ color: 'var(--helix-color-text-neutral)' }}>pnpm eval:ladder --levels {variant} --prompt {task} --yes</code></CellMessage>
              </Card>
            </section>
          );
        }
        const mean = cells.reduce((sum, cell) => sum + cell.score, 0) / cells.length;
        const measured = cells.filter(cell => cell.tokens);
        const tokens = measured.reduce((sum, cell) => sum + (cell.tokens ?? 0), 0);
        return (
          <section key={variant} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 'var(--helix-spacing-m)' }}>
            <div style={{ paddingLeft: 'var(--helix-spacing-m)' }}>
              <LevelTitle label={info.label} explain={info.explain} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-xs)', marginTop: 'var(--helix-spacing-xs)' }}>
                <span style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.2, color: 'var(--helix-color-text-neutral)' }}>{score100(mean)}</span>
                <Badge size="xs" variant={scoreVariant(scoreOutOf(mean, cells.length), cells.length)} label={`${scoreOutOf(mean, cells.length)}/${cells.length}`} />
              </div>
              <p style={{ margin: 'var(--helix-spacing-2xs) 0 0', fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{rowStatus(cells)}</p>
              {measured.length > 0 && <p style={{ margin: 0, fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>~{fmtTokens(tokens / measured.length)} tokens/answer · {fmtTokens(tokens)} total</p>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--helix-spacing-s)' }}>
              {cells.map((cell, i) => (
                <Card key={cell.id} header={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--helix-spacing-2xs)', fontFamily: 'monospace', fontSize: 12 }}>
                    <span>rep{cell.rep ?? i}</span>
                    <span>{score100(cell.score)}</span>
                    {cell.tokens ? <span>{fmtTokens(cell.tokens)} tok</span> : null}
                    <Badge size="xs" variant={cell.passed ? 'success' : 'danger'} label={cell.passed ? 'PASS' : 'FAIL'} />
                  </div>
                }>
                  <div style={{ height: 220, overflow: 'auto', background: 'var(--helix-color-fill-page)', borderRadius: 'var(--helix-radius-s)' }}>
                    <div style={{ zoom }}>
                      <LiveCell id={cell.id} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const meta: Meta = { title: 'Data/Eval Gallery', parameters: { layout: 'padded' } };
export default meta;

export const Gallery: StoryObj = {
  render: () => (
    <div>
      <StoryHeader
        title="Eval Gallery"
        description="What the agents actually built for each eval task, rendered live, per context level and rep, next to its score. Data comes from evals/outputs via pnpm eval:gallery — no agent runs, no tokens."
      />
      <EvalGallery />
    </div>
  ),
};
