import { Illustration } from './Illustration';
import { File, Mark } from './parts';
import { hide, show, untransform, drawn, type Card } from './runtime';

// Why well-ordered files matter: the design system opens into its files, they land in order, merge into
// one context, travel down a pipe to the agent, and the agent's output comes back checked.
const FOLDER = { x: 114, y: 18, cx: 154 };
const FLOOR_Y = 210;
const FILES = [
  { x: 20, name: 'tokens.json' },
  { x: 92, name: 'AGENTS.md' },
  { x: 164, name: 'Button.json' },
  { x: 236, name: 'ADR.md' },
].map((f) => ({ ...f, cx: f.x + 25 }));
const FILE = { w: 50, h: 62 };
const PILE_CX = 154;
const AGENT = { cx: 362, cy: 118 };
const OUTPUT = ['design system', 'metrics', 'a11y'];
const PIPE = `M190 170 C258 170 262 ${AGENT.cy} ${AGENT.cx - 34} ${AGENT.cy}`;

const card: Card = {
  reset(q) {
    hide([q('#cta-folder'), ...q.all('.cta-file'), q('#cta-merged'), q('#cta-agent'), q('#cta-ring'), q('#cta-agent-name'), q('#cta-output'), ...q.all('.cta-out-line'), ...q.all('.mark')]);
    untransform([q('#cta-folder'), ...q.all('.cta-file'), q('#cta-merged'), q('#cta-agent'), q('#cta-ring')]);
  },
  script(b, q) {
    const { M } = b, S = M.stagger;
    const files = q.all('.cta-file'), merged = q('#cta-merged'), agent = q('#cta-agent'), ring = q('#cta-ring');

    // 1 · The design system
    let t = 0.3;
    b.pop(q('#cta-folder'), t);
    t += M.emphasis + M.hold * 0.6;

    // 2 · It opens into its files; one by one they fall and land on the floor
    b.add(q('#cta-folder'), { opacity: [1, 0], scale: [1, 0.8] }, t, M.exit, M.eExit);
    b.draw(q('#cta-floor'), t);
    const drop = 0.75, gap = 0.45;
    files.forEach((el, i) => {
      const at = t + 0.15 + i * gap;
      const fall = FLOOR_Y - FILE.h - FOLDER.y; // from the folder's height to the floor
      b.add(el, { opacity: [0, 1] }, at, 0.15, 'linear');
      b.add(el, { x: [FOLDER.cx - FILES[i].cx, 0] }, at, drop * 0.7, M.eEnter);
      // Fall, then a small bounce on landing.
      b.add(el, { y: [-fall, 0, -10, 0] }, at, drop, ['easeIn', 'easeOut', 'easeIn'], { times: [0, 0.6, 0.8, 1] });
    });
    t += 0.15 + (files.length - 1) * gap + drop + M.hold * 0.7;

    // 3 · They merge into one context
    files.forEach((el, i) => b.add(el, { x: [0, PILE_CX - FILES[i].cx], scale: [1, 0.7], opacity: [1, 0] }, t + i * 0.08, M.enter, M.eExit));
    b.pop(merged, t + M.enter * 0.8);
    b.undraw(q('#cta-floor'), t + M.enter * 0.8);
    t += M.enter + M.emphasis + M.hold * 0.5;

    // 4 · Down the pipe to the agent
    b.draw(q('#cta-pipe'), t);
    b.draw(q('#cta-pipe-core'), t);
    b.pop(agent, t + 0.2);
    b.enter(q('#cta-agent-name'), t + 0.3);
    t += M.draw;
    const travel = 1.2;
    b.add(merged, { x: [0, 74, 144, AGENT.cx - PILE_CX], y: [0, -2, -34, -47], scale: [1, 0.7, 0.5, 0.25] }, t, travel, M.eDraw);
    b.add(merged, { opacity: [1, 0] }, t + travel - 0.2, 0.2, 'linear');
    b.enter(ring, t);
    b.add(ring, { rotate: [0, 360] }, t, travel + 0.8, 'linear');
    b.add(agent, { scale: [1, 1.15, 1] }, t + travel, M.emphasis, M.eExit);
    b.exit(ring, t + travel + 0.8);
    t += travel + M.emphasis;

    // 5 · The output comes back, checked line by line
    b.draw(q('#cta-out-wire'), t);
    b.add(q('#cta-output'), { opacity: [0, 1], x: [-24, 0] }, t + 0.25, M.enter, M.eEnter);
    q.all('.cta-out-line').forEach((el, i) => b.slideIn(el, t + 0.5 + i * S * 3));
    q.all('.mark').forEach((el, i) => b.pop(el, t + 0.7 + i * S * 3));
    return t + 0.7 + 2 * S * 3 + M.emphasis + M.hold * 1.3;
  },
  still(q) {
    show([...q.all('.cta-file'), q('#cta-agent'), q('#cta-agent-name'), q('#cta-output'), ...q.all('.cta-out-line'), ...q.all('.mark')]);
    untransform(q.all('.mark'));
    drawn([q('#cta-floor'), q('#cta-pipe'), q('#cta-pipe-core'), q('#cta-out-wire')]);
  },
};

const sparkle = 'M0 -12 C2 -4 4 -2 12 0 C4 2 2 4 0 12 C-2 4 -4 2 -12 0 C-4 -2 -2 -4 0 -12Z';

export function ContextToAgent() {
  const { x, y } = FOLDER;
  return (
    <Illustration
      card={card}
      viewBox="0 0 560 250"
      label="A design system opens into well-ordered files — tokens, AGENTS.md, a component contract, an ADR. They merge into one context, travel through a pipe to an agent, and the agent's output comes back with every check passed: design system, metrics, accessibility."
    >
      <path id="cta-floor" className="wire" data-stroke d={`M12 ${FLOOR_Y} H296`} />
      {/* The pipe: a wide dark stroke with a page-colored core drawn over it reads as a hollow tube */}
      <path id="cta-pipe" data-stroke d={PIPE} fill="none"
        style={{ stroke: 'var(--helix-color-border-neutral-dark)', strokeWidth: 14, strokeLinecap: 'round' }} />
      <path id="cta-pipe-core" data-stroke d={PIPE} fill="none"
        style={{ stroke: 'var(--helix-color-fill-page)', strokeWidth: 11, strokeLinecap: 'round' }} />
      <path id="cta-out-wire" className="wire" data-stroke d={`M${AGENT.cx + 34} ${AGENT.cy} H418`} />

      <g id="cta-folder" className="pivot">
        <path className="sheet" d={`M${x} ${y + 8} Q${x} ${y} ${x + 8} ${y} H${x + 26} L${x + 32} ${y + 7} H${x + 72} Q${x + 80} ${y + 7} ${x + 80} ${y + 15} V${y + 48} Q${x + 80} ${y + 56} ${x + 72} ${y + 56} H${x + 8} Q${x} ${y + 56} ${x} ${y + 48} Z`} />
        <text className="mono ink" x={FOLDER.cx} y={y + 78} textAnchor="middle" fontSize={12}>design system</text>
      </g>

      {FILES.map((f) => (
        <File key={f.name} className="cta-file" x={f.x} y={FLOOR_Y - FILE.h} w={FILE.w} h={FILE.h} name={f.name} />
      ))}
      {/* The merged context: one bigger file where the four land */}
      <g id="cta-merged" className="pivot">
        <File x={PILE_CX - 32} y={FLOOR_Y - 84} w={64} h={78} lines={4} />
      </g>

      <g id="cta-agent" className="pivot">
        <circle cx={AGENT.cx} cy={AGENT.cy} r={30} style={{ fill: 'var(--helix-color-fill-primary)' }} />
        <path d={sparkle} transform={`translate(${AGENT.cx} ${AGENT.cy})`} style={{ fill: 'var(--helix-primitive-color-gray-0)' }} />
      </g>
      <circle id="cta-ring" className="pivot" cx={AGENT.cx} cy={AGENT.cy} r={39} fill="none"
        style={{ stroke: 'var(--helix-color-text-primary)', strokeWidth: 1.5, strokeDasharray: '6 6' }} />
      <text id="cta-agent-name" className="mono muted" x={AGENT.cx} y={AGENT.cy + 54} textAnchor="middle" fontSize={11}>agent</text>

      <g id="cta-output">
        <rect className="sheet" x={422} y={42} width={128} height={150} rx={10} />
        <line className="rule" x1={422} y1={70} x2={550} y2={70} />
        <text className="mono muted" x={434} y={61} fontSize={10}>output.md</text>
      </g>
      {OUTPUT.map((line, i) => (
        <g key={line}>
          <Mark x={440} y={94 + i * 30} r={7} ok />
          <text className="mono ink cta-out-line" x={453} y={98 + i * 30} fontSize={10}>{line}</text>
        </g>
      ))}
    </Illustration>
  );
}
