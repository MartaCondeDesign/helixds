/**
 * @helixds/mcp — Helix as native tools for AI agents (Claude Code, Cursor, …) over the Model Context
 * Protocol, instead of shelling out to `pnpm helix …` or reading Markdown.
 *
 * Every tool reads the same sources as the CLI (./query-lib.ts) and the linter (@helixds/eslint-plugin) —
 * no second copy of the documentation. In this repo: `pnpm helix:mcp` (stdio). In an app with @helixds/react
 * installed: `npx @helixds/mcp` — it reads the installed packages instead (./sources.ts).
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getComponent, getPattern, listComponents, searchTokens } from './query-lib.ts';
import { validateSnippet } from './validate.ts';

// Sent to the client when it connects; Claude Code and other clients put it in the agent's context. Evals
// (2026-10-09) showed agents with these tools still guessed: they imported a made-up package until the
// contracts carried an import line, and every remaining error was on a component whose contract they
// hadn't read. So the instructions say both, before any tool is called.
const INSTRUCTIONS = [
  'Helix is a React design system. Import every component from @helixds/react — never @helix/…, @helix-ds/… or any other name.',
  'Before writing JSX that uses Helix, read the contract of EVERY Helix component you will use, including layout ones (PageHeader, Card, AppShell…): call helix_get_contracts once with all their names. Use only the props a contract lists — guessed props (title, style, open…) are usually wrong in Helix.',
  'Use helix_search_tokens for any color or spacing instead of a raw value, and run helix_validate_snippet on your code before you finish.',
].join('\n');

const server = new McpServer({ name: 'helix', version: '0.1.0' }, { instructions: INSTRUCTIONS });

const json = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] });
const error = (text: string) => ({ content: [{ type: 'text' as const, text }], isError: true });
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

server.registerTool('helix_list_components', {
  title: 'List Helix components',
  description: 'Every Helix component with its status (draft/beta/stable), purpose and exact import line (from @helixds/react). Call this first to check whether Helix already has what you are about to build, then read the contracts of every component you pick with helix_get_contracts.',
  inputSchema: { status: z.enum(['draft', 'beta', 'stable']).optional().describe('Only components with this status') },
  annotations: readOnly,
}, async ({ status }) => json(listComponents(status)));

server.registerTool('helix_get_contract', {
  title: 'Get a Helix component contract',
  description: 'The full contract of one Helix component: the exact import line (always from @helixds/react), props (exact names, types, defaults), accessibility (role, keyboard, WCAG), rationale, neverUseFor anti-patterns and governance boundaries (what you may extend locally vs. must escalate). Read it before using a component.',
  inputSchema: { name: z.string().describe('Component name, e.g. "Button" (case-insensitive)') },
  annotations: readOnly,
}, async ({ name }) => {
  const contract = getComponent(name);
  if (!contract) {
    const names = listComponents().map(c => c.name).join(', ');
    return error(`No Helix component named "${name}". Helix has: ${names}. If none fits, it's a custom component — mark it // [CUSTOM] reason: … (pnpm helix scaffold:custom).`);
  }
  const { suggestedNext: _cliHints, ...rest } = contract;
  return json(rest);
});

server.registerTool('helix_get_contracts', {
  title: 'Get several Helix component contracts at once',
  description: 'The contracts of every Helix component you are about to use, in one call — the same content as helix_get_contract (import line, props, accessibility, neverUseFor, governance) for each name. Call it before writing JSX, with ALL the components the code will use, layout ones included.',
  inputSchema: { names: z.array(z.string()).min(1).max(20).describe('Component names, e.g. ["PageHeader", "Card", "Button"] (case-insensitive)') },
  annotations: readOnly,
}, async ({ names }) => {
  const contracts = [];
  const unknown = [];
  for (const name of names) {
    const contract = getComponent(name);
    if (!contract) { unknown.push(name); continue; }
    const { suggestedNext: _cliHints, ...rest } = contract;
    contracts.push(rest);
  }
  return json({
    contracts,
    ...(unknown.length ? { unknown, note: `No Helix component named ${unknown.join(', ')}. Helix has: ${listComponents().map(c => c.name).join(', ')}.` } : {}),
  });
});

server.registerTool('helix_search_tokens', {
  title: 'Search Helix tokens by concept',
  description: 'Find the right semantic token by what it is for, in plain words — "danger background", "subtle text", "focus border", "card corner radius". Returns each token with its CSS variable (use it as var(--helix-…)), light and dark values and description. Never hardcode a color, radius or spacing value instead.',
  inputSchema: {
    query: z.string().describe('What the token is for, e.g. "danger background", "hover border"'),
    limit: z.number().int().min(1).max(25).optional().describe('Max results (default 8)'),
  },
  annotations: readOnly,
}, async ({ query, limit }) => json(searchTokens(query, limit)));

server.registerTool('helix_validate_snippet', {
  title: 'Validate a JSX snippet against Helix',
  description: 'Check JSX/TSX before writing it to a file: wrong import paths (@helixds/react → @helixds/react), anti-synonym props (onPress → onClick), raw colors, native controls, plus a type-check against the real Helix source (invented props, missing required props, wrong handler signatures), plus layout/icon/inline-style advisories. Returns each problem, a fixedCode with the safe fixes applied, compileErrors, and what is left to fix by hand — valid is true only when lint and the type-check both pass.',
  inputSchema: { code: z.string().describe('The JSX/TSX code to check (a full module or a fragment with its imports)') },
  annotations: readOnly,
}, async ({ code }) => json(await validateSnippet(code)));

server.registerTool('helix_get_pattern', {
  title: 'Get a Helix composition pattern',
  description: 'Guidance for a documented composition pattern (.ai/maps/patterns), e.g. "group-spacing", "show-hide-parts", "data-analytics".',
  inputSchema: { name: z.string().describe('Pattern name, e.g. "group-spacing"') },
  annotations: readOnly,
}, async ({ name }) => {
  const pattern = getPattern(name);
  return pattern ? json(pattern) : error(`No pattern named "${name}".`);
});

await server.connect(new StdioServerTransport());
