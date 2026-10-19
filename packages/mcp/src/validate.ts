/**
 * Validates a JSX/TSX snippet before an agent writes it to disk:
 *   - problems   @helixds/eslint-plugin rules (wrong import path, anti-synonym props, raw colors, native
 *                controls), each with its fix or suggestions
 *   - fixedCode  the snippet with every safe auto-fix applied (null when nothing changed)
 *   - compileErrors the fixed snippet type-checked against Helix's real source (./compile.ts): invented
 *                props, a missing required prop, a wrong handler signature, a component that doesn't
 *                exist — what lint can't see and the evals' `doesnt-compile` check fails
 *   - advisories the eval suite's global checks the linter doesn't cover (raw <div> layout, raw Tabler
 *                icons, inline styles, hardcoded px) — same patterns `pnpm eval:report` scores
 */
import { ESLint, type Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import helix from '@helixds/eslint-plugin';
import { GLOBAL_CHECKS } from './checks.ts';
import { compileSnippet } from './compile.ts';

// Already reported (with fixes) by the lint rules above — don't say the same thing twice.
const COVERED_BY_LINT = new Set(['hardcoded-color', 'on-press', 'raw-native-control']);

// Keeps the recommended config's own `files` (JS/TS extensions): in ESLint 9 a bare `**/*` pattern
// doesn't count as matching a file, which would skip every snippet as "no matching configuration".
const config = [{
  ...helix.configs.recommended,
  languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
}] as Linter.Config[];
// Two passes: `linter` reports every problem in the snippet as written; `fixer` produces the fixed code
// (with fix: true, ESLint only reports what's left AFTER fixing).
const linter = new ESLint({ overrideConfigFile: true, overrideConfig: config });
const fixer = new ESLint({ overrideConfigFile: true, overrideConfig: config, fix: true });

export async function validateSnippet(code: string) {
  // A virtual .tsx path: TypeScript + JSX parsing, never touches the disk.
  const [original] = await linter.lintText(code, { filePath: 'snippet.tsx' });
  const fatal = original!.messages.find(m => m.fatal);
  if (fatal) {
    return { valid: false, parseError: `${fatal.line}:${fatal.column} ${fatal.message}`, problems: [], fixedCode: null, remainingAfterFix: [], compiles: false, compileErrors: [], advisories: [] };
  }
  const [result] = await fixer.lintText(code, { filePath: 'snippet.tsx' });

  const problems = original!.messages.map(m => ({
    rule: m.ruleId,
    severity: m.severity === 2 ? 'error' : 'warning',
    line: m.line,
    column: m.column,
    message: m.message,
    autoFixed: Boolean(m.fix),
    suggestions: (m.suggestions ?? []).map(s => s.desc),
  }));

  const fixed = result!.output ?? code;
  const advisories = GLOBAL_CHECKS
    .filter(check => !COVERED_BY_LINT.has(check.id) && check.pattern?.test(fixed))
    .map(check => ({ check: check.id, message: check.description }));

  // Compiled after the safe fixes: an anti-synonym prop lint already fixed (onPress → onClick) shouldn't
  // also come back as a type error. What's left is what the agent must still fix by hand. Lowercase names
  // the snippet uses but doesn't declare (handlers, data) are its caller's code, not a Helix mistake.
  const { compiles, compileErrors } = compileSnippet(fixed, { allowMissingLocals: true });

  return {
    valid: problems.length === 0 && compiles,
    parseError: null,
    problems,
    fixedCode: fixed !== code ? fixed : null,
    remainingAfterFix: [
      ...result!.messages.map(m => `${m.line}:${m.column} ${m.ruleId} — ${m.message}`),
      ...compileErrors.map(e => `${e} (type error)`),
    ],
    compiles,
    compileErrors,
    advisories,
  };
}
