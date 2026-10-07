import { Illustration } from './Illustration';
import { EmptyMark, Mark } from './parts';
import { hide, show, untransform, type Card } from './runtime';

// The Status page in one picture: components (ghost names — never real ones) are checked row by row
// against Figma, code, accessibility and eval, and each row earns a status badge.
const COLUMNS = [{ x: 200, label: 'Figma' }, { x: 265, label: 'Code' }, { x: 330, label: 'A11y' }, { x: 395, label: 'Eval' }];
const STATUS = {
  stable: 'success',
  beta: 'info',
  draft: 'warning',
} as const;
const ROWS: { name: number; checks: boolean[]; status: keyof typeof STATUS }[] = [
  { name: 92, checks: [true, true, true, true], status: 'stable' },
  { name: 70, checks: [true, true, true, false], status: 'beta' },
  { name: 104, checks: [false, true, true, true], status: 'beta' },
  { name: 60, checks: [false, true, false, false], status: 'draft' },
  { name: 84, checks: [true, true, true, true], status: 'stable' },
];
const rowY = (i: number) => 64 + i * 36;

const card: Card = {
  reset(q) {
    hide([...q.all('.sth-head'), ...q.all('.sth-name'), ...q.all('.sth-rule'), ...q.all('.slot'), ...q.all('.mark'), ...q.all('.sth-badge'), q('#sth-scan')]);
    untransform(q('#sth-scan'));
  },
  script(b, q) {
    const { M } = b, S = M.stagger, scan = q('#sth-scan');

    // 1 · The empty table: columns, ghost component names, unchecked slots
    let t = 0.3;
    q.all('.sth-head').forEach((el, i) => b.enter(el, t + i * S));
    q.all('.sth-rule').forEach((el, i) => b.enter(el, t + i * 0.05));
    q.all('.sth-name').forEach((el, i) => b.add(el, { opacity: [0, 1], scaleX: [0, 1] }, t + 0.2 + i * S, M.enter, M.eEnter));
    q.all('.slot').forEach((el, i) => b.enter(el, t + 0.4 + i * 0.03));
    t += 0.4 + q.all('.slot').length * 0.03 + M.enter + M.hold * 0.6;

    // 2 · Scan row by row: marks pop across, then the row's badge
    b.enter(scan, t);
    ROWS.forEach((_, r) => {
      const at = t + r * 1.15;
      if (r > 0) b.add(scan, { y: [(r - 1) * 36, r * 36] }, at - 0.25, 0.25, M.eExit);
      q.all(`.mark-r${r}`).forEach((el, c) => b.pop(el, at + c * S));
      b.pop(q(`#sth-badge-${r}`), at + 4 * S + 0.1);
    });
    t += ROWS.length * 1.15;
    b.exit(scan, t);
    return t + M.exit + M.hold * 1.4;
  },
  still(q) {
    show([...q.all('.sth-head'), ...q.all('.sth-name'), ...q.all('.sth-rule'), ...q.all('.mark'), ...q.all('.sth-badge')]);
    untransform([...q.all('.mark'), ...q.all('.sth-badge'), ...q.all('.sth-name')]);
  },
};

export function StatusHealth() {
  return (
    <Illustration
      card={card}
      viewBox="0 0 560 240"
      label="A status table: five components are checked one by one against Figma, code, accessibility and eval. Each gets a badge: stable when everything passes, beta or draft when something is missing."
    >
      {COLUMNS.map((col) => (
        <text key={col.label} className="mono muted sth-head" x={col.x} y={28} textAnchor="middle" fontSize={11}>{col.label}</text>
      ))}
      <text className="mono muted sth-head" x={485} y={28} textAnchor="middle" fontSize={11}>Status</text>

      <rect id="sth-scan" x={12} y={rowY(0) - 16} width={536} height={32} rx={6} style={{ fill: 'var(--helix-color-fill-primary-light)', fillOpacity: 0.3 }} />

      {ROWS.map((row, r) => (
        <g key={r}>
          <line className="rule sth-rule" x1={16} y1={rowY(r) - 18} x2={544} y2={rowY(r) - 18} />
          <rect className="bar pivot-left sth-name" x={24} y={rowY(r) - 4} width={row.name} height={8} rx={4} />
          {COLUMNS.map((col, c) => <EmptyMark key={`s${c}`} x={col.x} y={rowY(r)} r={8} />)}
          {COLUMNS.map((col, c) => <Mark key={`m${c}`} x={col.x} y={rowY(r)} r={8} ok={row.checks[c]} className={`mark mark-r${r}`} />)}
          <g id={`sth-badge-${r}`} className="pivot sth-badge">
            <rect className={`tint-${STATUS[row.status]}`} x={450} y={rowY(r) - 11} width={70} height={22} rx={11} />
            <text className={`mono on-${STATUS[row.status]}`} x={485} y={rowY(r) + 4} textAnchor="middle" fontSize={11}>{row.status}</text>
          </g>
        </g>
      ))}
    </Illustration>
  );
}
