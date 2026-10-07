import { Illustration } from './Illustration';
import { hide, show, untransform, type Card } from './runtime';

// One file: it appears → an agent reads it top to bottom → its sections surface → one rule stands out.
const card: Card = {
  reset(q) {
    hide([q('#agm-sheet'), q('#agm-scan'), q('#agm-hl'), ...q.all('.agm-bar'), ...q.all('.agm-htext'), q('#agm-rule')]);
    untransform(q('#agm-scan'));
  },
  script(b, q) {
    const { M } = b, S = M.stagger, scan = q('#agm-scan');
    let t = 0.3;
    b.pop(q('#agm-sheet'), t);
    q.all('.agm-bar').forEach((el, i) => b.add(el, { opacity: [0, 1], scaleX: [0, 1] }, t + 0.2 + i * S, M.enter, M.eEnter));
    t += 0.2 + 5 * S + M.enter + M.hold;

    const read = 2.0;
    b.enter(scan, t);
    b.add(scan, { y: [0, 24, 48, 72, 96, 120] }, t, read, M.eDraw);
    b.exit(scan, t + read);
    t += read + M.exit + M.hold * 0.6;

    q.all('.agm-head').forEach((el) => b.exit(el, t));
    q.all('.agm-htext').forEach((el, i) => b.slideIn(el, t + M.exit + i * S));
    t += M.exit + 2 * S + M.enter + M.hold;

    b.exit(q('#agm-rulebar'), t);
    b.enter(q('#agm-hl'), t + M.exit);
    b.slideIn(q('#agm-rule'), t + M.exit);
    b.add(q('#agm-rule'), { scale: [1, 1.08, 1] }, t + M.exit + M.enter, M.emphasis, M.eExit);
    return t + M.exit + M.enter + M.emphasis + M.hold * 1.2;
  },
  still(q) {
    show([q('#agm-sheet'), q('#agm-hl'), ...q.all('.agm-bar:not(.agm-head):not(#agm-rulebar)'), ...q.all('.agm-htext'), q('#agm-rule')]);
  },
};

const rows = [
  { width: 64, head: '## Stack' },
  { width: 140 },
  { width: 64, head: '## Rules' },
  { width: 124, rule: true },
  { width: 88, head: '## Commands' },
  { width: 112 },
];

export function AgentsMd() {
  return (
    <Illustration
      card={card}
      viewBox="0 0 560 230"
      label="AGENTS.md: a Markdown file at the root of the repo that an agent reads first. Its sections hold the stack, the rules and the commands, such as: no raw hex colors."
    >
      <g id="agm-sheet" className="pivot">
        <rect className="sheet" x={190} y={10} width={180} height={210} rx={10} />
        <line className="rule" x1={190} y1={46} x2={370} y2={46} />
        <text className="mono ink" x={206} y={33} fontSize={13}>AGENTS.md</text>
      </g>
      <rect id="agm-scan" x={198} y={56} width={164} height={20} rx={4} style={{ fill: 'var(--helix-color-fill-primary-light)' }} />
      <rect id="agm-hl" className="tint-success" x={198} y={128} width={164} height={20} rx={4} />

      {rows.map((row, i) => (
        <rect key={i} id={row.rule ? 'agm-rulebar' : undefined}
          className={`bar pivot-left agm-bar${row.head ? ' agm-head' : ''}`}
          x={206} y={62 + i * 24} width={row.width} height={8} rx={4} />
      ))}
      {rows.map((row, i) => row.head && (
        <text key={i} className="mono accent agm-htext" x={206} y={70 + i * 24} fontSize={12}>{row.head}</text>
      ))}
      <text id="agm-rule" className="mono ink pivot-left" x={206} y={142} fontSize={12}>no raw hex colors</text>
    </Illustration>
  );
}
