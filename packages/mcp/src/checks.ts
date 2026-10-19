// ── Global checks ────────────────────────────────────────────────────────────
// Code assertions applied to every candidate regardless of prompt — the "What agents should NOT do"
// rules from AGENTS.md. The evals (scripts/eval-lib.ts re-exports these) report them as their own
// error-rate metrics; helix_validate_snippet returns them as advisories. Here, inside @helixds/mcp, so the
// published server ships them.

export interface GlobalCheck {
  id: string;
  description: string;
  /** A regex over the code. Checks without one come from eval-mechanical.ts (compile, lint) instead. */
  pattern?: RegExp;
}

export const GLOBAL_CHECKS: GlobalCheck[] = [
  { id: 'hardcoded-color', description: 'Hardcoded color (#hex, rgb(), hsl())', pattern: /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/ },
  { id: 'hardcoded-size', description: 'Hardcoded px/rem value', pattern: /\b\d+(\.\d+)?(px|rem)\b/ },
  { id: 'inline-style', description: 'Inline style={{…}}', pattern: /style=\{\{/ },
  { id: 'raw-icon', description: 'Raw <IconXxx> tag instead of the Icon component / icon prop', pattern: /<Icon(?!Button\b)[A-Z]\w*/ },
  { id: 'icon-element-prop', description: 'icon={<IconXxx />} instead of icon={IconXxx}', pattern: /icon(End)?=\{</ },
  { id: 'on-press', description: 'onPress instead of onClick', pattern: /\bonPress=/ },
  { id: 'raw-div', description: '<div> instead of a Helix layout component', pattern: /<div\b/ },
  { id: 'raw-native-control', description: 'Native <button>/<input>/<select>/<textarea> instead of the Helix component', pattern: /<(button|input|select|textarea)\b/ },
  // Mechanical (scripts/eval-mechanical.ts): only known for answers checked since it existed —
  // `pnpm eval:rescore` backfills the rest.
  { id: 'doesnt-compile', description: "Doesn't compile against Helix's real types (tsc)" },
  { id: 'invented-prop', description: 'Invented or wrong prop (helix/unknown-prop, helix/prop-vocabulary, or tsc: prop does not exist)' },
];
