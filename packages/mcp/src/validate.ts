/**
 * Validates a JSX/TSX snippet before an agent writes it to disk:
 *   - problems   @helix/eslint-plugin rules (wrong import path, anti-synonym props, raw colors, native
 *                controls), each with its fix or suggestions
 *   - fixedCode  the snippet with every safe auto-fix applied (null when nothing changed)
 *   - advisories the eval suite's global checks the linter doesn't cover (raw <div> layout, raw Tabler
 *                icons, inline styles, hardcoded px) — same patterns `pnpm eval:report` scores
 */
import { ESLint, type Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import helix from '@helix/eslint-plugin';
import { GLOBAL_CHECKS } from '../../../scripts/eval-lib.ts';

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
    return { valid: false, parseError: `${fatal.line}:${fatal.column} ${fatal.message}`, problems: [], fixedCode: null, remainingAfterFix: [], advisories: [] };
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

  const advisories = GLOBAL_CHECKS
    .filter(check => !COVERED_BY_LINT.has(check.id) && check.pattern.test(result!.output ?? code))
    .map(check => ({ check: check.id, message: check.description }));

  return {
    valid: problems.length === 0,
    parseError: null,
    problems,
    fixedCode: result!.output && result!.output !== code ? result!.output : null,
    remainingAfterFix: result!.messages.map(m => `${m.line}:${m.column} ${m.ruleId} — ${m.message}`),
    advisories,
  };
}
