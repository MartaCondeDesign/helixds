/**
 * Read-only query layer for Helix's agent context.
 *
 * Keep data access here, independent of the terminal interface: a future MCP
 * server can call these same functions without duplicating search or ranking.
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const readJson = <T>(relativePath: string): T =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;

type ManifestEntry = {
  name: string;
  category: string;
  status: string;
  version: string;
  purpose: string;
  contract: string;
};
type Manifest = { components: ManifestEntry[] };
type Contract = {
  name: string;
  purpose: string;
  neverUseFor?: string[];
  rationale?: string;
  governance?: { mayExtendLocally?: string[]; mustEscalateToDS?: string[] };
  states?: Record<string, unknown>;
  props?: Array<{ name: string; type: string; required?: boolean; default?: unknown; description: string }>;
  tokenPolicy?: { allowed?: string[]; forbidden?: string[] };
  a11y?: { role?: string; keyboardNav?: string[]; wcag?: string[] };
};
type TokenLeaf = { $value: unknown; $type?: string; $description?: string };

function manifest(): Manifest {
  return readJson<Manifest>('contracts/manifest.json');
}

function normalized(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function score(query: string, text: string): number {
  const q = normalized(query);
  const target = normalized(text);
  if (!q) return 0;
  if (target === q) return 100;
  if (target.startsWith(q)) return 80;
  if (target.includes(q)) return 60;
  return q.split(' ').filter(word => target.includes(word)).length * 10;
}

export function listComponents(status?: string) {
  return manifest().components
    .filter(component => !status || component.status === status)
    .map(({ name, category, status, version, purpose }) => ({ name, category, status, version, purpose }));
}

export function getComponent(name: string) {
  const entry = manifest().components.find(component => component.name.toLowerCase() === name.toLowerCase());
  if (!entry) return undefined;
  const contract = readJson<Contract>(entry.contract);
  return {
    ...entry,
    props: contract.props ?? [],
    neverUseFor: contract.neverUseFor ?? [],
    rationale: contract.rationale ?? null,
    governance: contract.governance ?? null,
    states: contract.states ?? {},
    tokenPolicy: contract.tokenPolicy ?? {},
    accessibility: contract.a11y ?? {},
    suggestedNext: [`pnpm helix pattern search-filter --json`, `pnpm helix token color.fill.primary-interactive-default --json`],
  };
}

function flattenTokens(value: Record<string, unknown>, prefix = ''): Array<{ path: string; token: TokenLeaf }> {
  return Object.entries(value).flatMap(([key, child]) => {
    const tokenPath = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && '$value' in child) {
      return [{ path: tokenPath, token: child as TokenLeaf }];
    }
    return child && typeof child === 'object'
      ? flattenTokens(child as Record<string, unknown>, tokenPath)
      : [];
  });
}

export function getToken(tokenPath: string) {
  const token = flattenTokens(readJson<Record<string, unknown>>('packages/tokens/src/tokens.json'))
    .find(entry => entry.path === tokenPath || entry.path === `semantic.${tokenPath}`);
  if (!token) return undefined;
  return {
    path: token.path.replace(/^semantic\./, ''),
    value: token.token.$value,
    type: token.token.$type,
    description: token.token.$description,
    cssVariable: `--helix-${token.path.replace(/^semantic\./, '').replace(/\./g, '-')}`,
  };
}

export function getPattern(name: string) {
  const file = `${name.replace(/\.md$/, '')}.md`;
  const patternPath = path.join(root, '.ai/maps/patterns', file);
  if (!fs.existsSync(patternPath)) return undefined;
  return { name: file.replace(/\.md$/, ''), source: `.ai/maps/patterns/${file}`, guidance: fs.readFileSync(patternPath, 'utf8') };
}

export function search(query: string) {
  const componentMatches = manifest().components
    .map(component => {
      const contract = readJson<Contract>(component.contract);
      return { ...component, score: score(query, `${component.name} ${JSON.stringify(contract)}`) };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 8)
    .map(({ name, category, status, purpose }) => ({ kind: 'component', name, category, status, purpose }));

  const patternDir = path.join(root, '.ai/maps/patterns');
  const patternMatches = fs.readdirSync(patternDir).filter(file => file.endsWith('.md')).map(file => {
    const guidance = fs.readFileSync(path.join(patternDir, file), 'utf8');
    return { name: file.replace(/\.md$/, ''), guidance, score: score(query, `${file} ${guidance}`) };
  }).filter(result => result.score > 0).sort((a, b) => b.score - a.score).slice(0, 5)
    .map(({ name }) => ({ kind: 'pattern', name, source: `.ai/maps/patterns/${name}.md` }));

  const tokenMatches = flattenTokens(readJson<Record<string, unknown>>('packages/tokens/src/tokens.json'))
    .map(entry => ({ ...entry, score: score(query, entry.path) }))
    .filter(result => result.score > 0 && result.path.startsWith('semantic.'))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, 8)
    .map(({ path: tokenPath, token }) => ({ kind: 'token', path: tokenPath.replace(/^semantic\./, ''), value: token.$value, type: token.$type }));

  return { query, results: [...componentMatches, ...patternMatches, ...tokenMatches] };
}
