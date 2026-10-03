#!/usr/bin/env tsx
/**
 * @helix-ds/mcp — Helix as native tools for AI agents (Claude Code, Cursor, …) over the Model Context
 * Protocol, instead of shelling out to `pnpm helix …` or reading Markdown.
 *
 * Every tool reads the same sources as the CLI (scripts/helix-query-lib.ts) and the linter
 * (@helix-ds/eslint-plugin) — no second copy of the documentation. Start: `pnpm helix:mcp` (stdio).
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getComponent, getPattern, listComponents, searchTokens } from '../../../scripts/helix-query-lib.ts';
import { validateSnippet } from './validate.ts';

const server = new McpServer({ name: 'helix', version: '0.1.0' });

const json = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] });
const error = (text: string) => ({ content: [{ type: 'text' as const, text }], isError: true });
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

server.registerTool('helix_list_components', {
  title: 'List Helix components',
  description: 'Every Helix component with its status (draft/beta/stable) and purpose. Call this first to check whether Helix already has what you are about to build.',
  inputSchema: { status: z.enum(['draft', 'beta', 'stable']).optional().describe('Only components with this status') },
  annotations: readOnly,
}, async ({ status }) => json(listComponents(status)));

server.registerTool('helix_get_contract', {
  title: 'Get a Helix component contract',
  description: 'The full contract of one Helix component: props (exact names, types, defaults), accessibility (role, keyboard, WCAG), rationale, neverUseFor anti-patterns and governance boundaries (what you may extend locally vs. must escalate). Read it before using a component.',
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
  description: 'Check JSX/TSX before writing it to a file: wrong import paths (@helix/react → @helix-ds/core), anti-synonym props (onClick → onPress), raw colors, native controls, plus layout/icon/inline-style advisories. Returns each problem, a fixedCode with the safe fixes applied, and what is left to fix by hand.',
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
