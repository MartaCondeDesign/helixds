/**
 * Mechanical checks applied to EVERY eval answer, whatever the prompt — the screen-level grading
 * open-design-system-bench does (evals/bench/), inside Helix's own evals:
 *
 *   compiles   the answer type-checks against Helix's real source (packages/core/src): a made-up prop,
 *              a missing required `label` or a wrong onChange signature is a compile error here, which
 *              no checklist line can catch. The compiler lives in packages/mcp/src/compile.ts, shared
 *              with helix_validate_snippet — the MCP never passes code these checks fail
 *   lint       @helixds/eslint-plugin problems (invented / anti-synonym props, wrong import path, raw
 *              colors and spacing, native controls) — the same rules as the editor and the Claude hook
 *
 * No agent, no tokens: it only reads code. eval:generate stores the result on every new answer and
 * eval:rescore backfills old ones, so the galleries and Metrics show them.
 */
import { compileSnippet } from '../packages/mcp/src/compile.ts';
import { validateSnippet } from '../packages/mcp/src/validate.ts';
import type { MechanicalChecks } from './eval-lib.ts';

export async function checkMechanical(code: string): Promise<MechanicalChecks> {
  const { problems } = await validateSnippet(code);
  // The answer is graded as the agent wrote it — not lint-fixed, and as a whole module (no allowance for
  // undeclared names, which helix_validate_snippet gives fragments). Same compiler, packages/mcp/src/compile.ts.
  return {
    ...compileSnippet(code),
    lintProblems: problems.map(p => ({ rule: p.rule, message: p.message })),
  };
}
