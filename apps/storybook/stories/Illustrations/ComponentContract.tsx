import { Illustration } from './Illustration';
import { attrs, color, hide, show, type Card } from './runtime';

// One shape: the Button.json sheet morphs into the button, gains its Figma frame, then grows when the
// contract's size changes from m to l.
const SHEET = { x: 160, y: 14, width: 240, height: 200, rx: 12 };
const BTN_M = { x: 215, y: 90, width: 130, height: 48, rx: 8 };
const BTN_L = { x: 205, y: 86, width: 150, height: 56, rx: 10 };
const FRAME_M = { x: 203, y: 78, width: 154, height: 72, rx: 12 };
const FRAME_L = { x: 193, y: 74, width: 174, height: 80, rx: 14 };
type Geo = typeof SHEET;
// attrX/attrY move the rect's own x/y attributes (plain x/y would be a CSS translate).
const geo = (a: Geo, b: Geo) => ({ attrX: [a.x, b.x], attrY: [a.y, b.y], width: [a.width, b.width], height: [a.height, b.height], rx: [a.rx, b.rx] });

const page = () => color('--helix-color-fill-page');
const edge = () => color('--helix-color-border-neutral-dark');
const blue = () => color('--helix-primitive-color-blue-600');

const card: Card = {
  reset(q) {
    attrs(q('#ctr-shape'), { ...SHEET, fill: page(), stroke: edge() });
    attrs(q('#ctr-frame'), FRAME_M);
    hide([q('#ctr-shape'), q('#ctr-frame'), ...q.all('.ctr-j'), q('#ctr-label'), q('#ctr-tag-code'), q('#ctr-tag-figma'), ...q.all('.ctr-size')]);
    show(q('#ctr-json'));
  },
  script(b, q) {
    const { M } = b, S = M.stagger, shape = q('#ctr-shape'), frame = q('#ctr-frame'), sizes = q.all('.ctr-size');
    let t = 0.3;
    b.add(shape, { opacity: [0, 1], scale: [0.9, 1] }, t, M.emphasis, M.eEmphasis);
    q.all('.ctr-j').forEach((el, i) => b.slideIn(el, t + 0.25 + i * S));
    t += 0.25 + 5 * S + M.enter + M.hold;

    b.exit(q('#ctr-json'), t);
    const morph = M.emphasis * 1.4;
    b.add(shape, { ...geo(SHEET, BTN_M), fill: [page(), blue()], stroke: [edge(), blue()] }, t + M.exit, morph, M.eEnter);
    b.enter(q('#ctr-label'), t + M.exit + morph * 0.6);
    b.enter(q('#ctr-tag-code'), t + M.exit + morph);
    t += M.exit + morph + M.enter + M.hold;

    b.pop(frame, t);
    b.enter(q('#ctr-tag-figma'), t + M.emphasis * 0.5);
    t += M.emphasis + M.hold;

    b.enter(sizes[0], t);
    const change = t + 0.9;
    b.exit(sizes[0], change); b.enter(sizes[1], change + M.exit);
    b.add(shape, geo(BTN_M, BTN_L), change + M.exit, M.emphasis, M.eEmphasis);
    b.add(frame, geo(FRAME_M, FRAME_L), change + M.exit + S, M.emphasis, M.eEmphasis);
    return change + M.exit + S + M.emphasis + M.hold * 1.2;
  },
  still(q) {
    attrs(q('#ctr-shape'), { ...BTN_M, fill: blue(), stroke: blue() });
    hide(q('#ctr-json'));
    show([q('#ctr-shape'), q('#ctr-frame'), q('#ctr-label'), q('#ctr-tag-code'), q('#ctr-tag-figma')]);
  },
};

const json = [
  { x: 178, y: 40, text: 'Button.json', muted: true },
  { x: 178, y: 76, text: '{' },
  { x: 194, y: 100, text: '"variant": "primary",' },
  { x: 194, y: 124, text: '"size": "m",' },
  { x: 194, y: 148, text: '"icon": "IconSave"' },
  { x: 178, y: 172, text: '}' },
];

export function ComponentContract() {
  return (
    <Illustration
      card={card}
      viewBox="0 0 560 230"
      label="A component contract: Button.json lists the props. It becomes the coded button and the Figma component. Changing size from m to l in the contract updates both."
    >
      <rect id="ctr-frame" className="pivot" fill="none"
        style={{ stroke: 'var(--helix-color-text-neutral-light)', strokeWidth: 1, strokeDasharray: '4 4' }} />
      <rect id="ctr-shape" className="pivot" strokeWidth={1} />
      <g id="ctr-json" className="mono">
        {json.map((line, i) => (
          <text key={i} className={`ctr-j ${line.muted ? 'muted' : 'ink'}`} x={line.x} y={line.y} fontSize={line.muted ? 12 : 13}>{line.text}</text>
        ))}
      </g>
      <text id="ctr-label" className="sans pivot" x={280} y={120} textAnchor="middle" fontSize={17} fontWeight={600}
        style={{ fill: 'var(--helix-primitive-color-gray-0)' }}>Save</text>
      <text id="ctr-tag-code" className="mono muted" x={176} y={118} textAnchor="end" fontSize={12}>code</text>
      <text id="ctr-tag-figma" className="mono muted" x={384} y={118} fontSize={12}>Figma</text>
      <text className="mono muted ctr-size" x={280} y={196} textAnchor="middle" fontSize={12}>"size": "m"</text>
      <text className="mono accent ctr-size" x={280} y={196} textAnchor="middle" fontSize={12}>"size": "l"</text>
    </Illustration>
  );
}
