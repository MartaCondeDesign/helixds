/**
 * Type-checks a JSX/TSX snippet against Helix's real types (packages/core/src in this repo, the installed
 * @helixds/react's .d.ts in an app): a made-up prop, a missing required `label` or a wrong onChange
 * signature is a compile error here, which no lint rule can catch.
 * Used by helix_validate_snippet and by the evals' mechanical checks (scripts/eval-mechanical.ts) — one
 * compiler, so the MCP never passes code the evals would fail.
 *
 * The snippet is never written to disk: it lives at a virtual path inside a compiler host that caches every
 * other file (core, React, Tabler, lib.d.ts) after the first call, and each program reuses the previous one.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { sources } from './sources.ts';

const { mode, coreTypes, packageDir } = sources();
// In the repo, core's source; installed, the shipped dist/index.d.ts — what an app's own tsc sees.
const coreDir = path.resolve(path.dirname(coreTypes), '..');
const typesOf = (name: string) => packageDir(name) ?? path.join(coreDir, 'node_modules', name);
const reactTypes = typesOf('@types/react');

// The snippet is compiled the way an app would see Helix: @helixds/react is core (source or .d.ts), React
// and Tabler come from core's own dependencies (in an app: the app's, then this package's). It measures how
// Helix is USED, so:
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
  baseUrl: coreDir,
  paths: {
    '@helixds/react': [coreTypes],
    '@helix-ds/core': [coreTypes],
    '@helix/react': [coreTypes],
    'react': [path.join(reactTypes, 'index.d.ts')],
    'react/*': [path.join(reactTypes, '*')],
    'react-dom': [path.join(typesOf('@types/react-dom'), 'index.d.ts')],
    '@tabler/icons-react': [typesOf('@tabler/icons-react')],
  },
  typeRoots: [path.dirname(reactTypes)],
  types: [],
};

// Inside core so module resolution walks the same node_modules a real Helix file would.
const SNIPPET = path.join(coreDir, '__helix_snippet__.tsx');

const baseHost = ts.createCompilerHost(compilerOptions, true);
const cache = new Map<string, ts.SourceFile | undefined>();
let snippet = '';
let previous: ts.Program | undefined;
let cachedAt = 0;

const host: ts.CompilerHost = {
  ...baseHost,
  fileExists: file => file === SNIPPET || baseHost.fileExists(file),
  readFile: file => (file === SNIPPET ? snippet : baseHost.readFile(file)),
  getSourceFile(file, languageVersion) {
    if (file === SNIPPET) return ts.createSourceFile(file, snippet, languageVersion, true, ts.ScriptKind.TSX);
    if (!cache.has(file)) cache.set(file, baseHost.getSourceFile(file, languageVersion));
    return cache.get(file);
  },
};

// "Cannot find name 'x'" / "… Did you mean 'y'?"
const MISSING_NAME = new Set([2304, 2552]);

export interface CompileOptions {
  /**
   * A snippet often calls code it doesn't show (`onClick={save}`, `rows.map(…)`): ignore a missing name that
   * starts lowercase. A missing Capitalized name is still an error — `<Spinner />` with no import is
   * exactly the made-up component this check is for. The evals compile whole answers and leave this off.
   */
  allowMissingLocals?: boolean;
}

export function compileSnippet(code: string, { allowMissingLocals = false }: CompileOptions = {}): { compiles: boolean; compileErrors: string[] } {
  // Core's source can change while a long-lived MCP server runs (someone adds a prop): drop the cache
  // when any cached Helix file is newer than when it was read.
  if (cache.size && coreChangedSince(cachedAt)) { cache.clear(); previous = undefined; }
  if (!cache.size) cachedAt = Date.now();

  snippet = code;
  const program = ts.createProgram([SNIPPET], compilerOptions, host, previous);
  previous = program;
  const file = program.getSourceFile(SNIPPET)!;
  // Only the snippet's own errors: core's internals are checked by core's own typecheck.
  const diagnostics = [...program.getSyntacticDiagnostics(file), ...program.getSemanticDiagnostics(file)]
    .filter(d => !(allowMissingLocals && MISSING_NAME.has(d.code) && /^Cannot find name '[a-z_$]/.test(ts.flattenDiagnosticMessageText(d.messageText, ' '))));
  const compileErrors = diagnostics.map(d => {
    const { line, character } = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : { line: 0, character: 0 };
    return `${line + 1}:${character + 1} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
  });
  return { compiles: compileErrors.length === 0, compileErrors: compileErrors.slice(0, 10) };
}

function coreChangedSince(time: number): boolean {
  // An installed package doesn't change under a running server; only the repo's source does.
  if (mode !== 'repo') return false;
  for (const file of cache.keys()) {
    if (!file.startsWith(path.join(coreDir, 'src'))) continue;
    try { if (fs.statSync(file).mtimeMs > time) return true; } catch { return true; }
  }
  return false;
}
