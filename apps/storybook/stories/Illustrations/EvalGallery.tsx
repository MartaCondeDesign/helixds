import { Illustration } from './Illustration';
import { color, hide, show, untransform, drawn, type Card } from './runtime';

// The Eval Gallery in one picture: a component is scanned, then a grid of runs is scored one by one.
// Rows are context levels (least → most guidance, like evals/ladder.json), so scores climb row by row.
// Thresholds match the gallery's score badge: under 40% danger, under 80% warning, else success.
const ROWS = [[20, 0, 20, 20], [60, 40, 60, 60], [80, 100, 100, 80]];
const tone = (pct: number) => (pct < 40 ? 'danger' : pct < 80 ? 'warning' : 'success');
const TINT = {
  danger: '--helix-color-fill-danger-interactive-light-default',
  warning: '--helix-color-fill-warning-light',
  success: '--helix-color-fill-success-light',
};
const CELL = { w: 72, h: 46, gapX: 10, gapY: 14, x0: 190, y0: 32 };
const cells = ROWS.flatMap((row, r) => row.map((pct, c) => ({
  pct, r, c,
  x: CELL.x0 + c * (CELL.w + CELL.gapX),
  y: CELL.y0 + r * (CELL.h + CELL.gapY),
})));

const card: Card = {
  reset(q) {
    hide([q('#evg-subject'), ...q.all('.evg-corner'), q('#evg-scan'), ...q.all('.evg-cell'), ...q.all('.evg-dash'), ...q.all('.evg-pct')]);
    untransform([q('#evg-subject'), q('#evg-scan')]);
    q.all('.evg-box').forEach((el) => el.setAttribute('fill', color('--helix-color-fill-page')));
  },
  script(b, q) {
    const { M } = b, S = M.stagger;
    const subject = q('#evg-subject'), scan = q('#evg-scan');
    const page = color('--helix-color-fill-page');

    // 1 · The component under test is scanned
    let t = 0.3;
    b.pop(subject, t);
    q.all('.evg-corner').forEach((el, i) => { b.enter(el, t + 0.3); b.draw(el, t + 0.3 + i * 0.05, M.draw * 0.6); });
    t += 0.3 + M.draw * 0.6;
    b.enter(scan, t);
    b.add(scan, { y: [0, 66, 0, 66] }, t, 1.8, M.eDraw);
    b.exit(scan, t + 1.8);
    t += 1.8 + M.hold * 0.5;

    // 2 · It moves aside; the grid of runs appears, unscored
    q.all('.evg-corner').forEach((el) => b.exit(el, t));
    b.add(subject, { x: [0, -185], scale: [1, 0.6] }, t, M.emphasis * 1.4, M.eExit);
    b.draw(q('#evg-wire'), t + M.emphasis);
    q.all('.evg-cell').forEach((el, i) => b.add(el, { opacity: [0, 1], scale: [0.85, 1] }, t + M.emphasis + i * 0.05, M.enter, M.eEnter));
    q.all('.evg-dash').forEach((el, i) => b.enter(el, t + M.emphasis + i * 0.05));
    t += M.emphasis + cells.length * 0.05 + M.enter + M.hold * 0.6;

    // 3 · Each run gets its score, one square at a time
    const step = 0.28;
    cells.forEach((cell, i) => {
      const at = t + i * step;
      b.exit(q(`#evg-dash-${i}`), at);
      b.add(q(`#evg-box-${i}`), { fill: [page, color(TINT[tone(cell.pct)])] }, at, M.recolor, M.eExit);
      b.pop(q(`#evg-pct-${i}`), at + 0.1);
    });
    t += cells.length * step + M.emphasis + M.hold;

    // 4 · The best-guided row pulses: that's the context worth keeping
    q.all('.evg-row-2').forEach((el, i) => b.add(el, { scale: [1, 1.08, 1] }, t + i * S, M.emphasis, M.eExit));
    return t + 3 * S + M.emphasis + M.hold * 1.2;
  },
  still(q) {
    show([q('#evg-subject'), ...q.all('.evg-cell'), ...q.all('.evg-pct')]);
    q('#evg-subject').style.transform = 'translateX(-185px) scale(0.6)';
    cells.forEach((cell, i) => q(`#evg-box-${i}`).setAttribute('fill', color(TINT[tone(cell.pct)])));
    drawn(q('#evg-wire'));
  },
};

// Viewfinder corners around the button (strokes, drawn by the runtime with Motion).
const corners = ['M200 92 V76 H216', 'M344 76 H360 V92', 'M360 138 V154 H344', 'M216 154 H200 V138'];

export function EvalGallery() {
  return (
    <Illustration
      card={card}
      viewBox="0 0 560 230"
      label="An eval gallery: a button is scanned, then a grid of runs is scored one by one. Runs with less context score low, runs with more context score high."
    >
      <path id="evg-wire" className="wire" data-stroke d="M140 115 H184" />

      <g id="evg-subject" className="pivot">
        <rect x={215} y={91} width={130} height={48} rx={8} style={{ fill: 'var(--helix-primitive-color-blue-600)' }} />
        <text className="sans" x={280} y={121} textAnchor="middle" fontSize={17} fontWeight={600}
          style={{ fill: 'var(--helix-primitive-color-gray-0)' }}>Save</text>
      </g>
      {corners.map((d, i) => (
        <path key={i} className="evg-corner" data-stroke d={d} fill="none"
          style={{ stroke: 'var(--helix-color-text-primary)', strokeWidth: 2, strokeLinecap: 'round' }} />
      ))}
      <rect id="evg-scan" x={196} y={80} width={168} height={4} rx={2} style={{ fill: 'var(--helix-color-text-primary)', fillOpacity: 0.6 }} />

      {cells.map((cell, i) => (
        <g key={i} className={`evg-cell pivot evg-row-${cell.r}`}>
          <rect id={`evg-box-${i}`} className="evg-box" x={cell.x} y={cell.y} width={CELL.w} height={CELL.h} rx={8}
            style={{ stroke: 'var(--helix-color-border-neutral-light)', strokeWidth: 1 }} />
          <text id={`evg-dash-${i}`} className="mono muted evg-dash" x={cell.x + CELL.w / 2} y={cell.y + 28} textAnchor="middle" fontSize={14}>—</text>
          <text id={`evg-pct-${i}`} className={`sans pivot evg-pct on-${tone(cell.pct)}`} x={cell.x + CELL.w / 2} y={cell.y + 29}
            textAnchor="middle" fontSize={16} fontWeight={600}>{cell.pct}%</text>
        </g>
      ))}
    </Illustration>
  );
}
