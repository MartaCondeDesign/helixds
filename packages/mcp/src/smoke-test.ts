/**
 * End-to-end check: starts the real server over stdio with an MCP client (the same way Claude Code
 * or Cursor would) and calls every tool, asserting on answers that must hold for this repo.
 * Run: pnpm --filter @helix-ds/mcp test
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { spawn } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const client = new Client({ name: 'helix-smoke-test', version: '0.0.0' });
await client.connect(new StdioClientTransport({
  command: process.execPath,
  args: ['--import', 'tsx', path.join(here, 'index.ts')],
  cwd: path.resolve(here, '..'),
}));

const call = async (name: string, args: Record<string, unknown> = {}) => {
  const res = await client.callTool({ name, arguments: args });
  const body = (res.content as { type: string; text: string }[])[0]!.text;
  return { isError: Boolean(res.isError), body, data: (() => { try { return JSON.parse(body); } catch { return body; } })() };
};

const { tools } = await client.listTools();
assert.deepEqual(tools.map(t => t.name).sort(), [
  'helix_check_props', 'helix_get_component', 'helix_get_pattern', 'helix_get_rules',
  'helix_get_token', 'helix_list_components', 'helix_list_patterns', 'helix_search_tokens',
]);

const list = await call('helix_list_components');
assert.ok(list.data.length >= 30 && list.data.some((c: { name: string }) => c.name === 'Button'));
const layout = await call('helix_list_components', { category: 'layout' });
assert.ok(layout.data.every((c: { category: string }) => c.category === 'layout'));

const select = await call('helix_get_component', { name: 'select' });
assert.equal(select.data.import, "import { Select } from '@helix-ds/core';");
assert.ok(select.data.contract.props.some((p: { name: string }) => p.name === 'options'));
assert.ok((await call('helix_get_component', { name: 'Dropdown' })).isError);

const danger = await call('helix_get_token', { name: '--helix-color-icon-danger' });
assert.equal(danger.data.light, '#dc2626');
assert.equal(danger.data.dark, '#ef4444');
const alias = await call('helix_get_token', { name: 'component.button.fill.ghost-hover' });
assert.deepEqual(alias.data.aliasChain?.[0], 'semantic.color.fill.secondary-interactive-default');

const search = await call('helix_search_tokens', { query: 'spacing 3xs' });
assert.equal(search.data.tokens[0].cssVar, '--helix-spacing-3xs');
assert.equal(search.data.tokens[0].light, '2px');

const props = await call('helix_check_props', { props: ['onClick', 'isOpen', 'variant', 'foo'], component: 'Button' });
const byProp = Object.fromEntries(props.data.results.map((r: { prop: string }) => [r.prop, r]));
assert.equal(props.data.allValid, false);
assert.match(byProp.onClick.reason, /onPress/);
assert.match(byProp.isOpen.reason, /expanded/);
assert.equal(byProp.variant.ok, true);
assert.match(byProp.foo.reason, /not a prop of Button/);

const pats = await call('helix_list_patterns');
assert.ok(pats.data.some((p: { name: string }) => p.name === 'stat-card'));
assert.match((await call('helix_get_pattern', { name: 'same-row-sizing' })).body, /Same row → same `size`/);
assert.ok((await call('helix_get_pattern', { name: 'nope' })).isError);
assert.match((await call('helix_get_rules')).body, /Canonical Prop Vocabulary/);

await client.close();

// ── HTTP transport (claude.ai custom connectors) ─────────────────────────────
const PORT = 3900 + Math.floor(Math.random() * 90);
const SECRET = 'smoke-test-secret';
const httpServer = spawn(process.execPath, ['--import', 'tsx', path.join(here, 'http.ts')], {
  cwd: path.resolve(here, '..'),
  env: { ...process.env, PORT: String(PORT), HELIX_MCP_SECRET: SECRET },
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise<void>((resolve, reject) => {
  httpServer.stdout!.on('data', d => String(d).includes('helix MCP (HTTP)') && resolve());
  httpServer.on('exit', code => reject(new Error(`http server exited (${code})`)));
});
try {
  const base = `http://localhost:${PORT}`;
  assert.equal((await fetch(`${base}/health`)).status, 200);
  assert.equal((await fetch(`${base}/mcp`, { method: 'POST' })).status, 404, 'no secret → 404');
  const remote = new Client({ name: 'helix-smoke-test-http', version: '0.0.0' });
  await remote.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp/${SECRET}`)));
  assert.equal((await remote.listTools()).tools.length, 8);
  const res = await remote.callTool({ name: 'helix_get_token', arguments: { name: '--helix-spacing-3xs' } });
  assert.equal(JSON.parse((res.content as { text: string }[])[0]!.text).light, '2px');
  await remote.close();
} finally {
  httpServer.kill();
}

console.log(`✅ helix MCP — ${tools.length} tools, all checks passed (stdio + HTTP)`);
