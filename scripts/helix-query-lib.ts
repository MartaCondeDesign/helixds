/**
 * The query layer behind `pnpm helix` — it lives in @helixds/mcp (packages/mcp/src/query-lib.ts) so the
 * published MCP server ships it too. Re-exported here so the CLI and scripts keep one import path.
 */
export * from '../packages/mcp/src/query-lib.ts';
