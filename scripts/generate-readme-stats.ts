/**
 * Keeps the component-count facts in README.md in sync with contracts/manifest.json,
 * so the public GitHub entry point never quietly drifts from reality (e.g. after a
 * component is added/removed and `pnpm docs:manifest` regenerates the manifest).
 *
 * Only touches text wrapped in `<!--helix:NAME-->...<!--/helix:NAME-->` markers (inline
 * facts) or bracketed by `<!-- helix:NAME:start -->` / `<!-- helix:NAME:end -->` (the
 * components badge line) — every other word in README.md is hand-written prose and is
 * left untouched.
 *
 * Run: pnpm docs:readme (also runs automatically in the pre-commit hook, see .husky/pre-commit)
 */
import fs from 'fs';
import path from 'path';

const root         = path.resolve(import.meta.dirname, '..');
const manifestPath = path.join(root, 'contracts/manifest.json');
const readmePath   = path.join(root, 'README.md');

type ManifestEntry = { category: 'core' | 'layout' };
type Manifest = { count: number; components: ManifestEntry[] };

const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

const total  = manifest.count;
const core   = manifest.components.filter(c => c.category === 'core').length;
const layout = manifest.components.filter(c => c.category === 'layout').length;

let readme = fs.readFileSync(readmePath, 'utf-8');

/** Replaces the text between `<!--helix:NAME-->` and `<!--/helix:NAME-->` (every occurrence). */
function replaceInline(source: string, name: string, value: string | number): string {
  const re = new RegExp(`(<!--helix:${name}-->)([\\s\\S]*?)(<!--/helix:${name}-->)`, 'g');
  return source.replace(re, `$1${value}$3`);
}

/** Replaces the whole block between `<!-- helix:NAME:start -->` and `<!-- helix:NAME:end -->`. */
function replaceBlock(source: string, name: string, value: string): string {
  const re = new RegExp(
    `(<!-- helix:${name}:start -->\\n)([\\s\\S]*?)(\\n<!-- helix:${name}:end -->)`,
  );
  return source.replace(re, `$1${value}$3`);
}

readme = replaceInline(readme, 'count', total);
readme = replaceInline(readme, 'core-count', core);
readme = replaceInline(readme, 'layout-count', layout);
readme = replaceBlock(
  readme,
  'badge-components',
  `![Components](https://img.shields.io/badge/components-${total}-6366f1)`,
);

const prevReadme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf-8') : null;
const changed = prevReadme !== readme;

fs.writeFileSync(readmePath, readme);

if (changed) {
  console.log(`✅ README.md stats regenerated — ${total} components (${core} core + ${layout} layout)`);
} else {
  console.log(`✅ README.md stats already match — ${total} components (${core} core + ${layout} layout)`);
}

// AGENTS.md's component inventory (what an agent in a consuming app reads first) — one row per manifest
// component, so it can't fall behind the real set the way a hand-written list did (it listed 7 of 30).
const agentsPath = path.join(root, 'AGENTS.md');
const firstSentence = (text: string) => (text.match(/^.*?[.!?](\s|$)/)?.[0] ?? text).trim();
const inventory = [
  '| Component | Category | Purpose |',
  '|---|---|---|',
  ...manifest.components.map(c => `| \`${c.name}\` | ${c.category} | ${firstSentence(String((c as { purpose?: string }).purpose ?? '')).replace(/\|/g, '\\|')} |`),
].join('\n');
const prevAgents = fs.readFileSync(agentsPath, 'utf-8');
const agents = replaceBlock(prevAgents, 'component-inventory', inventory);
fs.writeFileSync(agentsPath, agents);
// Same list for llms.txt (the index an LLM reads first).
const llmsPath = path.join(root, 'llms.txt');
const componentList = manifest.components
  .map(c => `- ${c.name} (${c.category}) — ${firstSentence(String((c as { purpose?: string }).purpose ?? ''))}`)
  .join('\n');
const prevLlms = fs.readFileSync(llmsPath, 'utf-8');
fs.writeFileSync(llmsPath, replaceBlock(prevLlms, 'component-list', componentList));

console.log(agents !== prevAgents
  ? `✅ AGENTS.md component inventory regenerated — ${total} components`
  : `✅ AGENTS.md component inventory already matches — ${total} components`);
