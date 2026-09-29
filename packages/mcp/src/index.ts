#!/usr/bin/env -S npx tsx
/**
 * Helix DS MCP server (stdio). Gives an AI agent direct, structured answers about the design
 * system — which components exist, their contract (props, states, keyboard, sizing), tokens with
 * their real light/dark values, whether a prop name is canonical, and the documented patterns —
 * instead of making it read and interpret the repo's files itself.
 *
 * Every tool is read-only and reads the repo live (see data.ts), so answers always match the
 * current contracts and tokens. Run: `pnpm --filter @helix-ds/mcp start`, or via .mcp.json.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  agentsGuide, allTokens, contract, findComponent, manifest, patternMarkdown, patterns,
  propMapMarkdown, propRules, stability, type TokenInfo,
} from './data.js';

const server = new McpServer({ name: 'helix', version: '0.1.0' });
const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

const json = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] });
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] });
const fail = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

function unknownComponent(name: string) {
  const names = manifest().components.map(c => c.name);
  const close = names.filter(n => n.toLowerCase().includes(name.toLowerCase().slice(0, 3)));
  return fail(`No Helix component named "${name}". ${close.length ? `Did you mean: ${close.join(', ')}? ` : ''}Available: ${names.join(', ')}.`);
}

// ── Components ───────────────────────────────────────────────────────────────

server.registerTool('helix_list_components', {
  title: 'List Helix components',
  description: 'Every Helix component with its category (core/layout), status (draft/beta/stable, computed by pnpm verify:stable per ADR-018) and one-line purpose. Call this first to know what exists before building UI — never invent a component that is not listed.',
  inputSchema: {
    category: z.enum(['core', 'layout']).optional().describe('Only components of this category'),
    status: z.enum(['draft', 'beta', 'stable', 'deprecated']).optional().describe('Only components with this status'),
  },
  annotations: READ_ONLY,
}, async ({ category, status }) => {
  const rows = manifest().components
    .filter(c => (!category || c.category === category) && (!status || c.status === status))
    .map(c => ({ name: c.name, category: c.category, status: c.status, purpose: c.purpose }));
  return json(rows);
});

server.registerTool('helix_get_component', {
  title: 'Get a Helix component contract',
  description: 'The full contract of one component — props (canonical names and types), variants, sizes, states, anatomy (data-helix-part names), accessibility and keyboard behavior, sizing rules, token policy — plus the import line, exported types and its current status with any failing criteria. The contract defines what the component IS: follow it over any guess.',
  inputSchema: { name: z.string().describe('Component name, e.g. "Select" (case-insensitive)') },
  annotations: READ_ONLY,
}, async ({ name }) => {
  const entry = findComponent(name);
  if (!entry) return unknownComponent(name);
  const status = stability(entry.name);
  const exportsInfo = entry.exports as { types?: string[] } | undefined;
  return json({
    import: `import { ${entry.name} } from '@helix-ds/core';`,
    exportedTypes: exportsInfo?.types ?? [],
    status: entry.status,
    failingCriteria: status
      ? Object.fromEntries(Object.entries(status.checks as Record<string, { pass: boolean; details: string[] }>)
          .filter(([, v]) => !v.pass).map(([k, v]) => [k, v.details]))
      : {},
    story: entry.story,
    contract: contract(entry),
  });
});

// ── Tokens ───────────────────────────────────────────────────────────────────

const tokenRow = (t: TokenInfo) => ({
  cssVar: t.cssVar,
  path: t.path,
  ...(t.type ? { type: t.type } : {}),
  ...(t.light !== undefined ? { light: t.light } : {}),
  ...(t.dark !== undefined ? { dark: t.dark } : {}),
  ...(typeof t.source === 'string' && t.source.startsWith('{') ? { aliasOf: t.source } : {}),
  ...(t.description ? { description: t.description } : {}),
});

server.registerTool('helix_search_tokens', {
  title: 'Search Helix design tokens',
  description: 'Search tokens by name, path, value or description (e.g. "danger", "text neutral", "spacing", "#dc2626"). Returns the CSS variable to use, its real resolved value in light and dark mode, what it aliases, and its purpose. Colors, radius and spacing must always be one of these --helix-* variables. Prefer semantic tokens (layer "semantic") in app code; component tokens belong to their component.',
  inputSchema: {
    query: z.string().describe('Words to match, all of them (case-insensitive)'),
    layer: z.enum(['primitive', 'semantic', 'component']).optional().describe('Restrict to one token layer'),
    limit: z.number().int().min(1).max(100).default(25),
  },
  annotations: READ_ONLY,
}, async ({ query, layer, limit }) => {
  const words = query.toLowerCase().split(/[\s.\-_/]+/).filter(Boolean);
  const hits = allTokens()
    .filter(t => !layer || t.layer === layer)
    .filter(t => {
      const hay = [t.path, t.cssVar, t.light, t.dark, t.description, String(t.source)].join(' ').toLowerCase();
      return words.every(w => hay.includes(w));
    });
  // Semantic first: it's what application code should reach for.
  const rank = { semantic: 0, component: 1, primitive: 2 } as const;
  hits.sort((a, b) => rank[a.layer] - rank[b.layer] || a.path.localeCompare(b.path));
  return json({ total: hits.length, shown: Math.min(limit, hits.length), tokens: hits.slice(0, limit).map(tokenRow) });
});

server.registerTool('helix_get_token', {
  title: 'Get one Helix token',
  description: 'Exact lookup of one token by CSS variable (--helix-color-text-danger) or DTCG path (semantic.color.text.danger): its light and dark values, alias chain and description.',
  inputSchema: { name: z.string().describe('CSS variable or dot path') },
  annotations: READ_ONLY,
}, async ({ name }) => {
  const key = name.trim().replace(/^var\((.*)\)$/, '$1');
  const tokens = allTokens();
  const hit = tokens.find(t => t.cssVar === key || t.path === key);
  if (!hit) {
    const near = tokens.filter(t => t.cssVar.includes(key.replace(/^--helix-/, '').split('-').slice(0, 2).join('-'))).slice(0, 8);
    return fail(`No token "${name}".${near.length ? ` Similar: ${near.map(t => t.cssVar).join(', ')}` : ''}`);
  }
  // Follow {alias} references down to the literal.
  const chain: string[] = [];
  let cur: TokenInfo | undefined = hit;
  while (cur && typeof cur.source === 'string' && cur.source.startsWith('{') && chain.length < 10) {
    const target = cur.source.slice(1, -1);
    chain.push(target);
    cur = tokens.find(t => t.path === target);
  }
  return json({ ...tokenRow(hit), ...(chain.length ? { aliasChain: chain } : {}) });
});

// ── Props ────────────────────────────────────────────────────────────────────

server.registerTool('helix_check_props', {
  title: 'Validate prop names',
  description: 'Check prop names before writing them: flags anti-synonyms from the canonical vocabulary (e.g. onClick → onPress, isOpen → expanded, title → label) and, when a component is given, props its contract does not define. Use it on the props you are about to pass to a Helix component.',
  inputSchema: {
    props: z.array(z.string()).min(1).describe('Prop names, e.g. ["onClick", "isLoading", "variant"]'),
    component: z.string().optional().describe('Also check against this component\'s contract'),
  },
  annotations: READ_ONLY,
}, async ({ props, component }) => {
  // "Naming variants" rows are variant VALUES (danger vs error), not prop names.
  const rules = propRules().filter(r => !/variant/i.test(r.section) || /size/i.test(r.section));
  let contractProps: string[] | undefined;
  if (component) {
    const entry = findComponent(component);
    if (!entry) return unknownComponent(component);
    contractProps = (contract(entry).props ?? []).map((p: { name: string }) => p.name);
  }
  const results = props.map(prop => {
    const rule = rules.find(r => r.antiSynonyms.includes(prop));
    if (rule) return { prop, ok: false, reason: `anti-synonym — use \`${rule.canonical}\` (${rule.notes})` };
    if (contractProps && !contractProps.includes(prop)) {
      return { prop, ok: false, reason: `not a prop of ${component} — its props: ${contractProps.join(', ')}` };
    }
    return { prop, ok: true };
  });
  return json({ allValid: results.every(r => r.ok), results });
});

// ── Patterns + rules ─────────────────────────────────────────────────────────

server.registerTool('helix_list_patterns', {
  title: 'List Helix patterns',
  description: 'Documented UI patterns (compositions of Helix components, not components themselves): name, which components they use, and when to reach for them. Check here before building a common layout (stat cards, search + filter rows, empty states, action bars…).',
  annotations: READ_ONLY,
}, async () => json(patterns()));

server.registerTool('helix_get_pattern', {
  title: 'Get a Helix pattern',
  description: 'The full recipe for one pattern (markdown: when to use, anatomy, code, anti-patterns). Copy its code rather than inventing a variant.',
  inputSchema: { name: z.string().describe('Pattern name from helix_list_patterns, e.g. "stat-card"') },
  annotations: READ_ONLY,
}, async ({ name }) => {
  const md = patternMarkdown(name);
  return md ? text(md) : fail(`No pattern "${name}". Available: ${patterns().map(p => p.name).join(', ')}.`);
});

server.registerTool('helix_get_rules', {
  title: 'Get Helix rules for agents',
  description: 'The rules an agent must follow when building with Helix (AGENTS.md: imports, icon usage, token policy, what not to do) plus the full canonical prop vocabulary. Read once at the start of a UI task.',
  annotations: READ_ONLY,
}, async () => text(`${agentsGuide()}\n\n---\n\n${propMapMarkdown()}`));

await server.connect(new StdioServerTransport());
