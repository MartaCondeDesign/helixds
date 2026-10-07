import { Illustration } from './Illustration';
import { Mark } from './parts';
import { hide, show, untransform, type Card } from './runtime';

// One sheet: the prompt → the code an agent writes → each criterion checked → a score.
// Content mirrors evals/prompts/button-basic.md (onPress is the classic miss — Helix uses onClick).
const card: Card = {
  reset(q) {
    hide([q('#evc-sheet'), ...q.all('.evc-tab'), ...q.all('.evc-p'), ...q.all('.evc-l'), ...q.all('.mark'), q('#evc-score')]);
    show([q('#evc-prompt'), q('#evc-code'), q('#evc-marks')]);
  },
  script(b, q) {
    const { M } = b, S = M.stagger, tabs = q.all('.evc-tab');
    let t = 0.3;
    b.pop(q('#evc-sheet'), t);
    b.enter(tabs[0], t + 0.2);
    q.all('.evc-p').forEach((el, i) => b.slideIn(el, t + 0.3 + i * S));
    t += 0.3 + 2 * S + M.enter + M.hold;

    b.exit(tabs[0], t); b.exit(q('#evc-prompt'), t);
    b.enter(tabs[1], t + M.exit);
    q.all('.evc-l').forEach((el, i) => b.slideIn(el, t + M.exit + i * S * 1.5));
    t += M.exit + 5 * S * 1.5 + M.enter + M.hold;

    q.all('.mark').forEach((el, i) => b.pop(el, t + i * S * 2.5));
    t += 3 * S * 2.5 + M.emphasis + M.hold;

    b.exit(q('#evc-code'), t, 0.12); b.exit(q('#evc-marks'), t, 0.12);
    b.pop(q('#evc-score'), t + M.exit);
    return t + M.exit + M.emphasis + M.hold * 1.2;
  },
  still(q) {
    show([q('#evc-sheet'), q.all('.evc-tab')[1], ...q.all('.evc-l'), ...q.all('.mark')]);
    untransform(q.all('.mark'));
  },
};

const prompt = ['Create a save button with', 'a loading state, using', 'Helix. Primary, size m.'];
const code = [
  { x: 158, text: 'import { Button }', mark: true },
  { x: 158, text: '<Button' },
  { x: 174, text: 'variant="primary"', mark: true },
  { x: 174, text: 'isLoading={saving}', mark: true },
  { x: 174, text: 'onPress={save}', mark: false },
  { x: 158, text: '>Save</Button>' },
];

export function EvalChecklist() {
  return (
    <Illustration
      card={card}
      viewBox="0 0 560 230"
      label="An eval: a fixed prompt, the code an agent writes for it, each line checked against the system's rules, and a final score of 3 out of 4."
    >
      <g id="evc-sheet" className="pivot">
        <rect className="sheet" x={140} y={10} width={280} height={210} rx={12} />
        <line className="rule" x1={140} y1={46} x2={420} y2={46} />
      </g>
      <text className="mono muted evc-tab" x={158} y={33} fontSize={12}>prompt.md</text>
      <text className="mono muted evc-tab" x={158} y={33} fontSize={12}>output.tsx</text>

      <g id="evc-prompt" className="mono ink" fontSize={13}>
        {prompt.map((line, i) => <text key={i} className="evc-p" x={158} y={80 + i * 22}>{line}</text>)}
      </g>
      <g id="evc-code" className="mono ink" fontSize={13}>
        {code.map((line, i) => <text key={i} className="evc-l" x={line.x} y={76 + i * 24}>{line.text}</text>)}
      </g>
      <g id="evc-marks">
        {code.map((line, i) => line.mark !== undefined && <Mark key={i} x={396} y={72 + i * 24} ok={line.mark} />)}
      </g>

      <g id="evc-score" className="pivot">
        <rect className="sheet" x={200} y={70} width={160} height={90} rx={12} />
        <text className="sans ink" x={280} y={118} textAnchor="middle" fontSize={32} fontWeight={600}>3 / 4</text>
        <text className="mono muted" x={280} y={142} textAnchor="middle" fontSize={12}>criteria met</text>
      </g>
    </Illustration>
  );
}
