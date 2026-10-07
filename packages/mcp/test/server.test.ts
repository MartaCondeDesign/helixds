// End-to-end: starts the real server over stdio and talks to it with the official MCP client — the same way
// Claude Code or Cursor do. Run: pnpm --filter @helixds/mcp test
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const pkg = path.resolve(import.meta.dirname, '..');
const client = new Client({ name: 'helix-mcp-test', version: '0.0.0' });

async function call(name: string, args: Record<string, unknown>) {
  const result = await client.callTool({ name, arguments: args }) as { content: Array<{ text: string }>; isError?: boolean };
  return { data: result.isError ? null : JSON.parse(result.content[0]!.text), text: result.content[0]!.text, isError: Boolean(result.isError) };
}

before(async () => {
  await client.connect(new StdioClientTransport({ command: 'npx', args: ['tsx', 'src/server.ts'], cwd: pkg }));
});
after(() => client.close());

describe('@helixds/mcp', () => {
  it('lists the five tools, all read-only', async () => {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(t => t.name).sort(), ['helix_get_contract', 'helix_get_pattern', 'helix_list_components', 'helix_search_tokens', 'helix_validate_snippet']);
    assert.ok(tools.every(t => t.annotations?.readOnlyHint === true));
  });

  it('helix_get_contract returns props, a11y, rationale and governance', async () => {
    const { data } = await call('helix_get_contract', { name: 'button' });
    assert.equal(data.name, 'Button');
    assert.ok(data.props.some((p: { name: string }) => p.name === 'onClick'));
    assert.ok(data.accessibility.role);
    assert.ok(data.rationale);
    assert.ok(data.governance.mustEscalateToDS.length);
  });

  it('helix_get_contract explains an unknown component instead of guessing', async () => {
    const { isError, text } = await call('helix_get_contract', { name: 'Spinner' });
    assert.ok(isError);
    assert.match(text, /No Helix component named "Spinner"/);
    assert.match(text, /\[CUSTOM\]/);
  });

  it('helix_search_tokens finds tokens by concept, with light and dark values', async () => {
    const { data } = await call('helix_search_tokens', { query: 'danger background' });
    assert.deepEqual(data.concepts.sort(), ['danger', 'fill']);
    assert.ok(data.results.length);
    for (const token of data.results) {
      assert.match(token.path, /^color\.fill\.danger/);
      assert.match(token.usage, /^var\(--helix-color-fill-danger/);
      assert.ok(token.light && token.dark);
    }
  });

  it('helix_search_tokens ignores words that name no token, and says when nothing matches fully', async () => {
    const button = await call('helix_search_tokens', { query: 'primary button hover' });
    assert.deepEqual(button.data.ignored, ['button']);
    assert.equal(button.data.results[0].path, 'color.fill.primary-interactive-hover');
    const border = await call('helix_search_tokens', { query: 'hover border' });
    assert.match(border.data.note, /No token matches all/);
  });

  it('helix_validate_snippet reports problems and returns the fixed code', async () => {
    const code = "import { Button } from '@helix-ds/core';\nexport const Save = () => <div><Button onPress={save} style={{ color: '#1d4ed8' }}>Save</Button></div>;\n";
    const { data } = await call('helix_validate_snippet', { code });
    assert.equal(data.valid, false);
    assert.deepEqual(data.problems.map((p: { rule: string }) => p.rule).sort(), ['helix/import-source', 'helix/no-raw-color', 'helix/prop-vocabulary']);
    assert.match(data.fixedCode, /from '@helixds\/react'/);
    assert.match(data.fixedCode, /onClick=\{save\}/);
    assert.equal(data.remainingAfterFix.length, 1); // the raw color needs a human/agent choice of token
    assert.ok(data.advisories.some((a: { check: string }) => a.check === 'raw-div'));
  });

  it('helix_validate_snippet passes clean Helix code', async () => {
    const { data } = await call('helix_validate_snippet', { code: "import { Button } from '@helixds/react';\nexport const Save = () => <Button onClick={save}>Save</Button>;\n" });
    assert.equal(data.valid, true);
    assert.equal(data.fixedCode, null);
  });

  it('helix_validate_snippet reports a syntax error instead of crashing', async () => {
    const { data } = await call('helix_validate_snippet', { code: '<Button onClick={' });
    assert.equal(data.valid, false);
    assert.ok(data.parseError);
  });
});
