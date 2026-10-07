import { Illustration } from './Illustration';
import { Mark } from './parts';
import { attrs, color, drawn, hide, show, untransform, type Card } from './runtime';

// Minimal concept tiles: one geometric shape per idea, a short loop, and the words underneath.
// Visual reference: the feature grid on motion.dev — the style only, none of its code.

const blue = () => color('--helix-color-fill-primary');
const green = () => color('--helix-primitive-color-green-700');
const page = () => color('--helix-color-fill-page');
const edge = () => color('--helix-color-border-neutral-dark');

// 01 · Token — one square, one value: change it once and it changes everywhere.
const tokenCard: Card = {
  reset(q) { hide(q('#tile-token')); q('#tile-token').setAttribute('fill', blue()); },
  script(b, q) {
    const { M } = b, sq = q('#tile-token');
    let t = 0.3;
    b.pop(sq, t);
    t += M.emphasis + M.hold * 0.4;
    b.add(sq, { fill: [blue(), green()], scale: [1, 1.12, 1] }, t, M.recolor, M.eExit);
    t += M.recolor + M.hold * 0.4;
    b.add(sq, { fill: [green(), blue()], scale: [1, 1.12, 1] }, t, M.recolor, M.eExit);
    return t + M.recolor + M.hold * 0.4;
  },
  still(q) { show(q('#tile-token')); untransform(q('#tile-token')); },
};

// 02 · Contract — a sheet becomes the component.
const SHEET = { x: 72, y: 18, width: 56, height: 84, rx: 6 };
const BUTTON = { x: 52, y: 45, width: 96, height: 30, rx: 8 };
type Geo = typeof SHEET;
const geo = (a: Geo, z: Geo) => ({ attrX: [a.x, z.x], attrY: [a.y, z.y], width: [a.width, z.width], height: [a.height, z.height], rx: [a.rx, z.rx] });
const contractCard: Card = {
  reset(q) {
    attrs(q('#tile-contract'), { ...SHEET, fill: page(), stroke: edge() });
    hide(q('#tile-contract'));
  },
  script(b, q) {
    const { M } = b, shape = q('#tile-contract');
    let t = 0.3;
    b.add(shape, { opacity: [0, 1], scale: [0.85, 1] }, t, M.emphasis, M.eEmphasis);
    t += M.emphasis + M.hold * 0.4;
    b.add(shape, { ...geo(SHEET, BUTTON), fill: [page(), blue()], stroke: [edge(), blue()] }, t, M.emphasis * 1.3, M.eEnter);
    t += M.emphasis * 1.3 + M.hold * 0.5;
    b.add(shape, { ...geo(BUTTON, SHEET), fill: [blue(), page()], stroke: [blue(), edge()] }, t, M.emphasis * 1.3, M.eExit);
    return t + M.emphasis * 1.3 + M.hold * 0.3;
  },
  still(q) { attrs(q('#tile-contract'), { ...BUTTON, fill: blue(), stroke: blue() }); show(q('#tile-contract')); },
};

// 03 · Eval — a ring fills to 100%, then the check.
const evalCard: Card = {
  reset(q) { hide([q('#tile-eval-track'), q('.mark')]); },
  script(b, q) {
    const { M } = b;
    let t = 0.3;
    b.enter(q('#tile-eval-track'), t);
    b.draw(q('#tile-eval-ring'), t + 0.2, 1.4);
    t += 0.2 + 1.4;
    b.pop(q('.mark'), t);
    return t + M.emphasis + M.hold * 0.6;
  },
  still(q) { show([q('#tile-eval-track'), q('.mark')]); untransform(q('.mark')); drawn(q('#tile-eval-ring')); },
};

// 04 · Context — ordered pieces flow into the agent, one at a time.
const PIECES = [30, 53, 76];
const AGENT = { cx: 148, cy: 60 };
const contextCard: Card = {
  reset(q) { hide([q('#tile-agent'), ...q.all('.tile-piece')]); untransform([q('#tile-agent'), ...q.all('.tile-piece')]); },
  script(b, q) {
    const { M } = b, agent = q('#tile-agent');
    let t = 0.3;
    b.pop(agent, t);
    q.all('.tile-piece').forEach((el, i) => b.enter(el, t + 0.1 + i * M.stagger));
    t += M.emphasis + M.hold * 0.3;
    q.all('.tile-piece').forEach((el, i) => {
      const at = t + i * 0.55;
      b.add(el, { x: [0, AGENT.cx - 44], y: [0, AGENT.cy - PIECES[i] - 7], scale: [1, 0.3], opacity: [1, 0] }, at, 0.6, M.eDraw);
      b.add(agent, { scale: [1, 1.15, 1] }, at + 0.5, M.emphasis, M.eExit);
    });
    return t + 2 * 0.55 + 0.6 + M.emphasis + M.hold * 0.5;
  },
  still(q) { show([q('#tile-agent'), ...q.all('.tile-piece')]); },
};

const VIEWBOX = '0 0 200 120';
const TILES = [
  {
    title: 'Token',
    description: 'One name, one value. Change it once and every component that reads it follows.',
    art: (
      <Illustration bare card={tokenCard} viewBox={VIEWBOX} label="A square changes color from blue to green and back: one token value changing everywhere it's used.">
        <rect id="tile-token" className="pivot" x={75} y={35} width={50} height={50} rx={8} />
      </Illustration>
    ),
  },
  {
    title: 'Contract',
    description: 'One JSON file shapes the component — in code and in Figma alike.',
    art: (
      <Illustration bare card={contractCard} viewBox={VIEWBOX} label="A sheet of paper morphs into a button and back: a contract becoming a component.">
        <rect id="tile-contract" className="pivot" strokeWidth={1.5} />
      </Illustration>
    ),
  },
  {
    title: 'Eval',
    description: 'Every answer scored against the same criteria, run after run.',
    art: (
      <Illustration bare card={evalCard} viewBox={VIEWBOX} label="A ring fills up to complete and a check mark appears: an eval scoring an answer.">
        <circle id="tile-eval-track" className="track" cx={100} cy={60} r={36} />
        <circle id="tile-eval-ring" className="ring" data-stroke cx={100} cy={60} r={36} transform="rotate(-90 100 60)" />
        <Mark x={100} y={60} r={13} ok />
      </Illustration>
    ),
  },
  {
    title: 'Context',
    description: 'Well-ordered pieces in, one by one — a better answer out.',
    art: (
      <Illustration bare card={contextCard} viewBox={VIEWBOX} label="Three small squares move one by one into a circle that pulses: context flowing into an agent.">
        {PIECES.map((y) => <rect key={y} className="shape pivot tile-piece" x={37} y={y} width={14} height={14} rx={3} />)}
        <circle id="tile-agent" className="shape pivot" cx={AGENT.cx} cy={AGENT.cy} r={22} />
      </Illustration>
    ),
  },
];

/** Four minimal concept tiles in a grid: the animation on top, number, title and description below. */
export function ConceptTiles() {
  return (
    <section className="concept-tiles">
      {TILES.map((tile, i) => (
        <article key={tile.title} className="concept-tile">
          {tile.art}
          <p className="concept-tile-index">{String(i + 1).padStart(2, '0')}</p>
          <h2>{tile.title}</h2>
          <p>{tile.description}</p>
        </article>
      ))}
    </section>
  );
}
