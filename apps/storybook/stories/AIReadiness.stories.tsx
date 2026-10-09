import type { Meta, StoryObj } from '@storybook/react';
import { Accordion, Badge, Card, Chart, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@helixds/react';
import report from '../../../quality/ai-readiness.json';
import history from '../../../quality/ai-readiness-history.json';
import { StoryHeader } from './_shared/StoryHeader';

// Data from `pnpm readiness` (scripts/ai-readiness.ts). Every number on this page carries how it's computed,
// its evidence and the command that recomputes it — so it can be checked, not just believed.

type Check = { id: string; label: string; score: number | null; how: string; evidence: string[]; command: string; n?: number };
type Point = { date: string; commit: string; score: number | null; readable: number; used: number | null };

const muted = { color: 'var(--helix-color-text-neutral-light)', fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)' };
const mono = { fontFamily: 'var(--font-mono)', fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)' };

const tone = (score: number | null) => (score === null ? 'neutral' : score >= 70 ? 'success' : score >= 40 ? 'warning' : 'danger');

function Score({ value, label }: { value: number | null; label: string }) {
  return <Badge variant={tone(value)} label={value === null ? `${label}: no data` : `${label}: ${value}`} />;
}

// One row's "where does this number come from?": how, evidence, command.
function Evidence({ check }: { check: Check }) {
  return (
    <Accordion label={`Where does ${check.score ?? 'n/a'} come from?`}>
      <div style={{ display: 'grid', gap: 'var(--helix-spacing-xs)' }}>
        <span style={muted}>{check.how}</span>
        <pre style={{ ...mono, margin: 0, whiteSpace: 'pre-wrap' }}>{check.evidence.join('\n')}</pre>
        <span style={muted}>Recompute: <code style={mono}>{check.command}</code></span>
      </div>
    </Accordion>
  );
}

function ChecksTable({ checks }: { checks: Check[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Check</TableHeaderCell>
          <TableHeaderCell>Score</TableHeaderCell>
          <TableHeaderCell>Evidence</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {checks.map(check => (
          <TableRow key={check.id}>
            <TableCell>{check.label}{check.n !== undefined ? <span style={muted}> · {check.n} answers</span> : null}</TableCell>
            <TableCell><Score value={check.score} label="Score" /></TableCell>
            <TableCell><Evidence check={check} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AIReadinessPage() {
  const points = history as Point[];
  const used = report.used;
  return (
    <div style={{ display: 'grid', gap: 'var(--helix-spacing-l)' }}>
      <StoryHeader
        title="AI Readiness"
        description="Is Helix ready to be read — and used — by a coding agent? ① Readable is computed from the repo, deterministic and free. ② Used well comes from what agents actually wrote in the evals. Every number opens to show how it's computed, its evidence and the command that recomputes it. Refresh with pnpm readiness."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--helix-spacing-m)' }}>
        <Card header="Overall">
          <div style={{ display: 'grid', gap: 'var(--helix-spacing-xs)' }}>
            <strong style={{ fontSize: 'var(--helix-textStyle-heading-xl-bold-fontSize)' }}>
              {report.score === null ? 'Not rated yet' : `${report.score} / 100 · ${report.tier}`}
            </strong>
            <span style={muted}>
              {report.score === null
                ? 'Readable alone only says the pieces exist — not that agents use them well. A score needs ② to cover enough tasks.'
                : 'Mean of ① Readable and ② Used well. Tiers: 70+ AI-native, 40+ Invested, below that Emerging.'}
            </span>
            <span style={muted}>Measured at {report.commit} · {report.generatedAt.slice(0, 10)}</span>
          </div>
        </Card>
        <Card header="① Readable">
          <div style={{ display: 'grid', gap: 'var(--helix-spacing-xs)' }}>
            <Score value={report.readable.score} label="Readable" />
            <span style={muted}>Presence and coverage checks: the pieces an agent needs are there. They don't show the pieces work — ② does.</span>
          </div>
        </Card>
        <Card header="② Used well">
          <div style={{ display: 'grid', gap: 'var(--helix-spacing-xs)' }}>
            <Score value={used.score} label="Used well" />
            <span style={muted}>{used.coverageNote}. {used.olderAnswersExcluded} older answers excluded — they predate {used.epoch.hash} ({used.epoch.subject}).</span>
          </div>
        </Card>
      </div>

      <section style={{ display: 'grid', gap: 'var(--helix-spacing-s)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--helix-textStyle-heading-l-bold-fontSize)' }}>① Can an agent read Helix?</h2>
        <ChecksTable checks={report.readable.checks as Check[]} />
      </section>

      <section style={{ display: 'grid', gap: 'var(--helix-spacing-s)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--helix-textStyle-heading-l-bold-fontSize)' }}>② Do agents use it well?</h2>
        {!used.enough ? (
          <Card>
            <span style={muted}>
              Not enough data to rate: {used.coverageNote}. Tasks answered: {used.tasksCovered.join(', ') || 'none'}.
              Run the screen tasks, e.g. <code style={mono}>pnpm eval:ladder --prompt screen-delete-account,screen-signup-errors,screen-notification-settings,screen-save-feedback,screen-team-members --levels no-context,mcp --runs 1 --yes</code>, then <code style={mono}>pnpm eval:judge</code> and <code style={mono}>pnpm readiness</code>.
            </span>
          </Card>
        ) : null}
        <ChecksTable checks={used.checks as Check[]} />
      </section>

      {points.length > 1 ? (
        <Chart
          variant="line"
          label="AI Readiness over time"
          description="One point per commit where pnpm readiness ran. Gaps mean that part wasn't rated."
          categories={points.map(p => `${p.date} ${p.commit}`)}
          series={[
            { name: 'Readable', data: points.map(p => p.readable) },
            { name: 'Used well', data: points.map(p => p.used) },
            { name: 'Overall', data: points.map(p => p.score) },
          ]}
        />
      ) : null}
    </div>
  );
}

const meta: Meta = { title: 'Data/AI Readiness', parameters: { layout: 'padded' } };
export default meta;
type Story = StoryObj;

export const Readiness: Story = { render: () => <AIReadinessPage /> };
