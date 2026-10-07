// Small drawing parts shared by several illustrations.

/**
 * A pass/fail mark: a filled circle with a check or a cross. The outer group positions it (an SVG
 * transform attribute); the inner `.mark` group is what animations scale, so the two never fight over
 * `transform`.
 */
export function Mark({ x, y, ok, r = 9, className = 'mark' }: { x: number; y: number; ok: boolean; r?: number; className?: string }) {
  const s = r / 9;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={`${className} pivot`}>
        <circle className={ok ? 'ok' : 'fail'} r={r} />
        <path
          className="glyph"
          d={ok ? `M${-4 * s} 0 L${-1 * s} ${3 * s} L${4 * s} ${-3 * s}` : `M${-3.5 * s} ${-3.5 * s} L${3.5 * s} ${3.5 * s} M${3.5 * s} ${-3.5 * s} L${-3.5 * s} ${3.5 * s}`}
        />
      </g>
    </g>
  );
}

/** An empty mark slot — the "not checked yet" state. */
export function EmptyMark({ x, y, r = 9, className = 'slot' }: { x: number; y: number; r?: number; className?: string }) {
  return <circle className={`empty ${className}`} cx={x} cy={y} r={r} />;
}

/** A file: page with a folded corner, a few ghost lines, and a name underneath. */
export function File({ x, y, w = 56, h = 70, name, className = '', lines = 3 }: {
  x: number; y: number; w?: number; h?: number; name?: string; className?: string; lines?: number;
}) {
  const fold = Math.round(w * 0.22);
  return (
    <g className={`pivot ${className}`}>
      <path className="sheet" d={`M${x} ${y + 6} Q${x} ${y} ${x + 6} ${y} H${x + w - fold} L${x + w} ${y + fold} V${y + h - 6} Q${x + w} ${y + h} ${x + w - 6} ${y + h} H${x + 6} Q${x} ${y + h} ${x} ${y + h - 6} Z`} />
      <path className="sheet" d={`M${x + w - fold} ${y} V${y + fold} H${x + w}`} />
      {Array.from({ length: lines }, (_, i) => (
        <rect key={i} className="bar" x={x + 9} y={y + fold + 8 + i * 11} width={(w - 18) * (i % 2 ? 0.7 : 1)} height={5} rx={2.5} />
      ))}
      {name && <text className="mono muted" x={x + w / 2} y={y + h + 16} textAnchor="middle" fontSize={10}>{name}</text>}
    </g>
  );
}
