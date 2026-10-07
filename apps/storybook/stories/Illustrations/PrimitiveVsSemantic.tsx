import { Illustration } from './Illustration';
import { color, hide, show, untransform, drawn, type Card } from './runtime';

// Primitive → semantic → component, then re-pointing one semantic token recolors the component.
const card: Card = {
  reset(q) {
    hide([...q.all('.head'), ...q.all('.prim-label'), ...q.all('.sem'), q('#pvs-btn'), q('#pvs-ring')]);
    q.all('.swatch').forEach((el) => (el.style.transform = 'scale(0)'));
    const blue = color('--helix-primitive-color-blue-600');
    q('#pvs-btn-bg').setAttribute('fill', blue);
    q('#pvs-dot').setAttribute('fill', blue);
  },
  script(b, q) {
    const { M } = b, S = M.stagger, heads = q.all('.head');
    const BLUE = color('--helix-primitive-color-blue-600'), GREEN = color('--helix-primitive-color-green-700');

    // 1 · Primitives
    let t = 0.3;
    b.enter(heads[0], t);
    q.all('.swatch').forEach((el, i) => b.add(el, { scale: [0, 1] }, t + i * S, M.emphasis, M.eEmphasis));
    q.all('.prim-label').forEach((el, i) => b.enter(el, t + 0.15 + i * S));
    t += 3 * S + M.emphasis + M.hold;

    // 2 · Semantics point to primitives
    b.enter(heads[1], t);
    q.all('.sem').forEach((el, i) => b.add(el, { opacity: [0, 1], x: [-12, 0] }, t + i * S, M.enter, M.eEnter));
    b.draw(q('#pvs-w-blue'), t + M.enter);
    b.draw(q('#pvs-w-gray'), t + M.enter + S);
    t += M.enter + S + M.draw + M.hold;

    // 3 · The component reads only semantics
    b.enter(heads[2], t); b.enter(heads[3], t);
    b.add(q('#pvs-btn'), { opacity: [0, 1], scale: [0.6, 1] }, t, M.emphasis, M.eEmphasis);
    b.draw(q('#pvs-w-btn-fill'), t + M.emphasis * 0.6);
    b.draw(q('#pvs-w-btn-text'), t + M.emphasis * 0.6 + S);
    t += M.emphasis + S + M.draw + M.hold;

    // 4 · Re-point fill.primary: blue.600 → green.700
    b.enter(q('#pvs-ring'), t);
    t += M.enter;
    b.undraw(q('#pvs-w-blue'), t);
    b.draw(q('#pvs-w-green'), t + 0.2);
    t += 0.2 + M.draw * 0.7;
    b.add(q('#pvs-dot'), { fill: [BLUE, GREEN] }, t, M.recolor, M.eExit);
    b.add(q('#pvs-btn-bg'), { fill: [BLUE, GREEN] }, t + S, M.recolor, M.eExit);
    b.add(q('#pvs-btn'), { scale: [1, 1.06, 1] }, t + S, M.emphasis, M.eExit);
    b.exit(q('#pvs-ring'), t + M.recolor + 0.4);
    return t + M.recolor + M.hold * 1.3;
  },
  still(q) {
    show([...q.all('.head'), ...q.all('.prim-label'), ...q.all('.sem'), q('#pvs-btn')]);
    untransform(q.all('.swatch'));
    drawn(['#pvs-w-blue', '#pvs-w-gray', '#pvs-w-btn-fill', '#pvs-w-btn-text'].map(q));
  },
};

const swatches = [
  { y: 56, token: 'blue-600', name: 'blue.600' },
  { y: 106, token: 'green-700', name: 'green.700' },
  { y: 156, token: 'gray-0', name: 'gray.0' },
  { y: 206, token: 'gray-900', name: 'gray.900' },
];
const swatchStroke = { stroke: 'var(--helix-color-border-neutral-dark)', strokeWidth: 1 };
const green = 'var(--helix-primitive-color-green-700)';

export function PrimitiveVsSemantic() {
  return (
    <Illustration
      card={card}
      viewBox="0 0 900 250"
      label="Four primitive colors. Two semantic tokens, fill.primary and text.inverse, point to blue.600 and gray.0. A button reads only the semantic tokens. Re-pointing fill.primary to green.700 recolors the button without touching it."
    >
      <text className="mono muted head" x={40} y={22} fontSize={12} letterSpacing="0.12em">PRIMITIVE</text>
      <text className="mono muted head" x={350} y={22} fontSize={12} letterSpacing="0.12em">SEMANTIC</text>
      <text className="mono muted head" x={690} y={22} fontSize={12} letterSpacing="0.12em">COMPONENT</text>

      <path className="wire" data-stroke id="pvs-w-blue" d="M172 70 C262 70 262 95 348 95" />
      <path className="wire" data-stroke id="pvs-w-gray" d="M172 170 C262 170 262 195 348 195" />
      <path className="wire" data-stroke id="pvs-w-green" d="M172 120 C262 120 262 95 348 95" style={{ stroke: green, strokeWidth: 2 }} />
      <path className="wire" data-stroke id="pvs-w-btn-fill" d="M582 95 C636 95 636 140 688 140" />
      <path className="wire" data-stroke id="pvs-w-btn-text" d="M582 195 C636 195 636 158 688 158" />

      <rect id="pvs-ring" x={34} y={100} width={40} height={40} rx={10} fill="none" style={{ stroke: green, strokeWidth: 2 }} />
      {swatches.map((s) => (
        <rect key={s.token} className="swatch pivot" x={40} y={s.y} width={28} height={28} rx={6}
          style={{ fill: `var(--helix-primitive-color-${s.token})`, ...swatchStroke }} />
      ))}
      {swatches.map((s) => (
        <text key={s.token} className="mono ink prim-label" x={80} y={s.y + 19} fontSize={15}>{s.name}</text>
      ))}

      <g className="sem">
        <rect className="sheet" x={350} y={75} width={230} height={40} rx={20} />
        <circle id="pvs-dot" cx={374} cy={95} r={8} style={swatchStroke} />
        <text className="mono ink" x={392} y={100} fontSize={15}>fill.primary</text>
      </g>
      <g className="sem">
        <rect className="sheet" x={350} y={175} width={230} height={40} rx={20} />
        <circle cx={374} cy={195} r={8} style={{ fill: 'var(--helix-primitive-color-gray-0)', ...swatchStroke }} />
        <text className="mono ink" x={392} y={200} fontSize={15}>text.inverse</text>
      </g>

      <g className="pivot" id="pvs-btn">
        <rect id="pvs-btn-bg" x={690} y={125} width={150} height={48} rx={8} />
        <text className="sans" x={765} y={155} textAnchor="middle" fontSize={18} fontWeight={600}
          style={{ fill: 'var(--helix-primitive-color-gray-0)' }}>Save</text>
      </g>
      <text className="mono muted head" x={765} y={200} textAnchor="middle" fontSize={15}>Button</text>
    </Illustration>
  );
}
