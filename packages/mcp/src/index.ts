#!/usr/bin/env -S npx tsx
/**
 * Helix DS MCP server over stdio — for Claude Code (.mcp.json) and Claude Desktop. Gives an AI
 * agent structured answers about the design system instead of making it read the repo's files.
 * Tools live in server.ts. Run: `pnpm --filter @helix-ds/mcp start`.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

await createServer().connect(new StdioServerTransport());
