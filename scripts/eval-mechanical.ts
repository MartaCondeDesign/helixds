/**
 * Mechanical checks applied to EVERY eval answer, whatever the prompt — the screen-level grading
 * open-design-system-bench does (evals/bench/), inside Helix's own evals:
 *
 *   compiles   the answer type-checks against Helix's real source (packages/core/src): a made-up prop,
 *              a missing required `label` or a wrong onChange signature is a compile error here, which
 *              no checklist line can catch
 *   lint       @helixds/eslint-plugin problems (invented / anti-synonym props, wrong import path, raw
 *              colors and spacing, native controls) — the same rules as the editor and the Claude hook
 *
 * No agent, no tokens: it only reads code. eval:generate stores the result on every new answer and
 * eval:rescore backfills old ones, so the galleries and Metrics show them.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import ts from 'typescript';
import { validateSnippet } from '../packages/mcp/src/validate.ts';
import type { MechanicalChecks } from './eval-lib.ts';

const root = path.resolve(import.meta.dirname, '..');
const core = path.join(root, 'packages/core');

// The answer is compiled the way an app would see Helix: @helixds/react is core's source, React and
// Tabler come from core's own dependencies. It measures how Helix is USED, so:
//   - the package's former names (@helix-ds/core, @helix/react — ADR-023) resolve too: older answers used
//     the right name for their day, and a stale import path is helix/import-source's finding, not tsc's.
//     Packages that never existed (@helix/button, @helix/toast…) still fail.
//   - no noImplicitAny, exactOptionalPropertyTypes or noUncheckedIndexedAccess: an untyped helper
//     parameter is a TypeScript habit, not a Helix mistake.
const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  strict: true,
  noImplicitAny: false,
  noEmit: true,
  skipLibCheck: true,
  allowImportingTsExtensions: true,
  baseUrl: root,
  paths: {
    '@helixds/react': [path.join(core, 'src/index.ts')],
    '@helix-ds/core': [path.join(core, 'src/index.ts')],
    '@helix/react': [path.join(core, 'src/index.ts')],
    'react': [path.join(core, 'node_modules/@types/react/index.d.ts')],
    'react/*': [path.join(core, 'node_modules/@types/react/*')],
    'react-dom': [path.join(core, 'node_modules/@types/react-dom/index.d.ts')],
    '@tabler/icons-react': [path.join(core, 'node_modules/@tabler/icons-react')],
  },
  typeRoots: [path.join(core, 'node_modules/@types')],
  types: [],
};

export function compileAnswer(code: string): { compiles: boolean; compileErrors: string[] } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-eval-tsc-'));
  const file = path.join(dir, 'Answer.tsx');
  fs.writeFileSync(file, code);
  try {
    const program = ts.createProgram([file], compilerOptions);
    const answer = program.getSourceFile(file)!;
    // Only the answer's own errors: core's internals are checked by core's own typecheck.
    const diagnostics = [...program.getSyntacticDiagnostics(answer), ...program.getSemanticDiagnostics(answer)];
    const compileErrors = diagnostics.map(d => {
      const { line, character } = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : { line: 0, character: 0 };
      return `${line + 1}:${character + 1} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
    });
    return { compiles: compileErrors.length === 0, compileErrors: compileErrors.slice(0, 10) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export async function checkMechanical(code: string): Promise<MechanicalChecks> {
  const { problems } = await validateSnippet(code);
  return {
    ...compileAnswer(code),
    lintProblems: problems.map(p => ({ rule: p.rule, message: p.message })),
  };
}
