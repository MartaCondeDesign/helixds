// @helixds/mcp as an app gets it from npm: builds and packs tokens, react, eslint-plugin and mcp, installs
// the tarballs with npm in a throwaway project outside the repo, starts `npx @helixds/mcp` there and calls
// every tool. Proves the server reads the installed packages (./src/sources.ts), not this checkout.
// Slow (~1 min, npm install) — not in `pnpm test`. Run: pnpm test:mcp-installed
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const repo = path.resolve(import.meta.dirname, '../../..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-mcp-installed-'));
const app = path.join(tmp, 'app');
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });
let client;

async function call(name, args) {
  const result = await client.callTool({ name, arguments: args });
  return { data: result.isError ? null : JSON.parse(result.content[0].text), text: result.content[0].text, isError: Boolean(result.isError) };
}

before(async () => {
  const tarballs = path.join(tmp, 'tgz');
  for (const pkg of ['tokens', 'core', 'eslint-plugin', 'mcp']) {
    const dir = path.join(repo, 'packages', pkg);
    if (JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).scripts?.build) run('pnpm', ['build'], dir);
    run('pnpm', ['pack', '--pack-destination', tarballs], dir);
  }
  fs.mkdirSync(app);
  fs.writeFileSync(path.join(app, 'package.json'), JSON.stringify({ name: 'helix-mcp-installed', private: true, type: 'module' }));
  const tgz = fs.readdirSync(tarballs).map(f => path.join(tarballs, f));
  run('npm', ['install', '--no-audit', '--no-fund', 'react@19', 'react-dom@19', 'tailwindcss@4', '@modelcontextprotocol/sdk', ...tgz], app);

  // The MCP client from the app's install, not the repo's.
  const req = createRequire(path.join(app, 'noop.js'));
  const { Client } = await import(req.resolve('@modelcontextprotocol/sdk/client/index.js'));
  const { StdioClientTransport } = await import(req.resolve('@modelcontextprotocol/sdk/client/stdio.js'));
  client = new Client({ name: 'helix-mcp-installed-test', version: '0.0.0' });
  await client.connect(new StdioClientTransport({ command: 'npx', args: ['--no-install', '@helixds/mcp'], cwd: app }));
}, { timeout: 600_000 });

after(async () => {
  await client?.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('@helixds/mcp installed from its tarball', () => {
  it('lists components with their import line', async () => {
    const { data } = await call('helix_list_components', {});
    assert.ok(data.length > 20);
    assert.ok(data.every(c => /from '@helixds\/react'/.test(c.import)));
  });

  it('returns contracts, one or several, and names unknown ones', async () => {
    const button = await call('helix_get_contract', { name: 'button' });
    assert.ok(button.data.props.some(p => p.name === 'onClick'));
    const { data } = await call('helix_get_contracts', { names: ['PageHeader', 'card', 'Spinner'] });
    assert.deepEqual(data.contracts.map(c => c.name), ['PageHeader', 'Card']);
    assert.deepEqual(data.unknown, ['Spinner']);
  });

  it('searches tokens with light and dark values', async () => {
    const { data } = await call('helix_search_tokens', { query: 'danger background' });
    assert.ok(data.results.length);
    assert.ok(data.results.every(t => t.usage.startsWith('var(--helix-color-fill-danger') && t.light && t.dark));
  });

  it('reads patterns from the installed @helixds/react', async () => {
    const { data } = await call('helix_get_pattern', { name: 'group-spacing' });
    assert.equal(data.source, 'node_modules/@helixds/react/dist/patterns/group-spacing.md');
    assert.ok(data.guidance.length > 100);
    assert.ok((await call('helix_get_pattern', { name: '../../package' })).isError);
  });

  it('type-checks snippets against the shipped .d.ts, React and Tabler types', async () => {
    const ok = await call('helix_validate_snippet', { code: "import { Button } from '@helixds/react';\nimport { IconPlus } from '@tabler/icons-react';\nexport const A = () => <Button icon={IconPlus} onClick={save}>Add</Button>;" });
    assert.equal(ok.data.valid, true, ok.text);
    const bad = await call('helix_validate_snippet', { code: "import { Button, Spinner } from '@helixds/react';\nexport const A = () => <Button tone=\"loud\">Add</Button>;" });
    assert.equal(bad.data.compiles, false);
    const errors = bad.data.compileErrors.join('\n');
    assert.match(errors, /no exported member 'Spinner'/);
    assert.match(errors, /'tone' does not exist/);
  });
});
