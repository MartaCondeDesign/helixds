/**
 * Where Helix's data lives — the one place that knows, so the query library and the compiler don't.
 *
 *   repo       the server runs from a Helix checkout (src/ via tsx, or dist/ built there): the sources
 *              themselves — contracts/, .ai/maps/patterns/, packages/tokens, packages/core/src.
 *   installed  anywhere else (`npx @helixds/mcp` in an app): what @helixds/react and @helixds/tokens ship —
 *              dist/contracts, dist/patterns, dist/index.d.ts; dist/tokens.json, dist/helix.css. Resolved
 *              from the project the agent works in first (the version its code is checked against), then
 *              from this package's own dependencies.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

export interface HelixSources {
  mode: 'repo' | 'installed';
  manifest: string;
  /** A manifest entry's `contract` ("contracts/components/Button.json") → the file to read. */
  contract: (manifestPath: string) => string;
  patterns: string;
  /** How a pattern's `source` is shown to the agent. */
  patternSource: (file: string) => string;
  tokensJson: string;
  helixCss: string;
  /** What `@helixds/react` type-checks against: core's src/index.ts, or the shipped dist/index.d.ts. */
  coreTypes: string;
  /** Resolve a package's directory as Helix itself would (React types, Tabler…). */
  packageDir: (name: string) => string | undefined;
}

// src/ and dist/ are both two levels below the package, three below the repo root.
const repoRoot = path.resolve(import.meta.dirname, '../../..');
const isRepo = fs.existsSync(path.join(repoRoot, 'contracts/manifest.json'))
  && fs.existsSync(path.join(repoRoot, 'packages/core/src/index.ts'));

function packageDirFrom(from: string[], name: string): string | undefined {
  for (const base of from) {
    try {
      return path.dirname(createRequire(path.join(base, 'noop.js')).resolve(`${name}/package.json`));
    } catch { /* not resolvable from here, or no ./package.json export */ }
    // Packages without a "./package.json" export (some @types): walk node_modules by hand.
    for (let dir = base; ; dir = path.dirname(dir)) {
      const candidate = path.join(dir, 'node_modules', name);
      if (fs.existsSync(path.join(candidate, 'package.json'))) return fs.realpathSync(candidate);
      if (path.dirname(dir) === dir) break;
    }
  }
  return undefined;
}

function repoSources(): HelixSources {
  const core = path.join(repoRoot, 'packages/core');
  return {
    mode: 'repo',
    manifest: path.join(repoRoot, 'contracts/manifest.json'),
    contract: manifestPath => path.join(repoRoot, manifestPath),
    patterns: path.join(repoRoot, '.ai/maps/patterns'),
    patternSource: file => `.ai/maps/patterns/${file}`,
    tokensJson: path.join(repoRoot, 'packages/tokens/src/tokens.json'),
    helixCss: path.join(repoRoot, 'packages/tokens/dist/helix.css'),
    coreTypes: path.join(core, 'src/index.ts'),
    // Core's own node_modules: the React and Tabler a real Helix file sees.
    packageDir: name => packageDirFrom([core], name),
  };
}

function installedSources(): HelixSources {
  const own = import.meta.dirname;
  const react = packageDirFrom([process.cwd(), own], '@helixds/react');
  if (!react) throw new Error('@helixds/mcp: @helixds/react is not installed — run `npm install @helixds/react` in your project.');
  // Tokens through react's own dependency, so both come from the same release.
  const tokens = packageDirFrom([react, process.cwd(), own], '@helixds/tokens');
  if (!tokens) throw new Error('@helixds/mcp: @helixds/tokens is not installed (it comes with @helixds/react).');
  const dist = path.join(react, 'dist');
  return {
    mode: 'installed',
    manifest: path.join(dist, 'contracts/manifest.json'),
    contract: manifestPath => path.join(dist, 'contracts', path.basename(manifestPath)),
    patterns: path.join(dist, 'patterns'),
    patternSource: file => `node_modules/@helixds/react/dist/patterns/${file}`,
    tokensJson: path.join(tokens, 'dist/tokens.json'),
    helixCss: path.join(tokens, 'dist/helix.css'),
    coreTypes: path.join(dist, 'index.d.ts'),
    // The app's own packages first (its React version), then what Helix and this server bring.
    packageDir: name => packageDirFrom([process.cwd(), react, own], name),
  };
}

let cached: HelixSources | undefined;
export function sources(): HelixSources {
  return (cached ??= isRepo ? repoSources() : installedSources());
}
