// Tests `pnpm setup:ai` (scripts/setup-ai.mjs) on throwaway apps: what it writes, that it merges instead of
// overwriting, and — end to end — that the hooks it installs really run from the app, through the exact
// commands written in its .claude/settings.json. Run: pnpm test:setup-ai
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// The hooks record a trace of what they catch (scripts/hook-trace.mjs) — not from tests.
process.env.HELIX_TRACES = 'off';

const root = path.resolve(import.meta.dirname, '..');
const script = path.join(root, 'scripts/setup-ai.mjs');
const apps = [];

function newApp() {
  const app = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-setup-ai-'));
  apps.push(app);
  return app;
}
function setup(app, ...flags) {
  const result = spawnSync('node', [script, app, ...flags], { encoding: 'utf8', env: { ...process.env, HELIX_DS_DIR: '' } });
  return { code: result.status, out: result.stdout };
}
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
// Runs a hook command the way Claude Code does: through the shell, payload on stdin, from the app.
function runHookCommand(command, app, payload) {
  const out = execFileSync('sh', ['-c', command], {
    input: JSON.stringify(payload), cwd: app,
    env: { ...process.env, CLAUDE_PROJECT_DIR: app, HELIX_DS_DIR: '' },
  }).toString().trim();
  return out ? JSON.parse(out) : null;
}

after(() => apps.forEach(app => fs.rmSync(app, { recursive: true, force: true })));

describe('setup-ai', () => {
  it('installs AGENTS.md, the Helix MCP server and the three hooks, pointing at this clone', () => {
    const app = newApp();
    const { code } = setup(app);
    assert.equal(code, 0);
    assert.ok(fs.existsSync(path.join(app, 'AGENTS.md')));

    const mcp = readJson(path.join(app, '.mcp.json'));
    assert.deepEqual(mcp.mcpServers.helix, { command: 'pnpm', args: ['-s', '--dir', `\${HELIX_DS_DIR:-${root}}`, 'helix:mcp'] });

    const { hooks } = readJson(path.join(app, '.claude/settings.json'));
    const commands = event => hooks[event].flatMap(e => e.hooks.map(h => h.command));
    assert.deepEqual(commands('PreToolUse').map(c => path.basename(c.replace(/"$/, ''))), ['claude-owner-gate-hook.mjs', 'claude-contract-hook.mjs']);
    assert.deepEqual(commands('PostToolUse').map(c => path.basename(c.replace(/"$/, ''))), ['claude-lint-hook.mjs']);
    assert.ok(commands('PreToolUse').every(c => c.includes(`\${HELIX_DS_DIR:-${root}}/scripts/`)));
  });

  it('gives Cursor the same MCP server when the app uses Cursor, and runs it', () => {
    const plain = newApp();
    setup(plain);
    assert.ok(!fs.existsSync(path.join(plain, '.cursor/mcp.json')), 'no .cursor/ → nothing for Cursor');

    const app = newApp();
    fs.mkdirSync(path.join(app, '.cursor'));
    assert.equal(setup(app).code, 0);
    const { helix } = readJson(path.join(app, '.cursor/mcp.json')).mcpServers;
    assert.equal(helix.command, 'sh');
    assert.equal(helix.args[1], `pnpm -s --dir "\${HELIX_DS_DIR:-${root}}" helix:mcp`);
    // The shell resolves the clone path: the command lists the MCP server's own script.
    const resolved = execFileSync('sh', ['-c', `echo ${helix.args[1]}`], { env: { ...process.env, HELIX_DS_DIR: '' } }).toString();
    assert.match(resolved, new RegExp(`--dir ${root} helix:mcp`));
  });

  it('--with codex,gemini installs the MCP server, the hooks and AGENTS.md context for both', () => {
    const app = newApp();
    assert.equal(setup(app, '--with', 'codex,gemini').code, 0);
    const toml = fs.readFileSync(path.join(app, '.codex/config.toml'), 'utf8');
    assert.match(toml, /^\[mcp_servers\.helix\]\ncommand = "sh"\nargs = \["-c","pnpm -s --dir \\"\$\{HELIX_DS_DIR:-/m);
    const codexHooks = readJson(path.join(app, '.codex/hooks.json')).hooks;
    assert.deepEqual(codexHooks.PreToolUse.map(e => e.matcher), ['Bash|apply_patch', 'apply_patch']);
    assert.equal(codexHooks.PostToolUse[0].matcher, 'apply_patch');

    const gemini = readJson(path.join(app, '.gemini/settings.json'));
    assert.equal(gemini.mcpServers.helix.command, 'sh');
    assert.deepEqual(gemini.hooks.BeforeTool.map(e => e.hooks[0].name), ['helix-owner-gate', 'helix-contract']);
    assert.equal(gemini.hooks.AfterTool[0].hooks[0].timeout, 60000);
    assert.deepEqual(gemini.context.fileName, ['AGENTS.md', 'GEMINI.md']);

    // Idempotent for these too, and an app's own TOML is kept.
    assert.doesNotMatch(setup(app, '--with', 'codex,gemini').out, /Created|Updated/);
  });

  it('installs for Codex and Gemini on its own when the app already has their folder', () => {
    const app = newApp();
    fs.mkdirSync(path.join(app, '.codex'));
    fs.writeFileSync(path.join(app, '.codex/config.toml'), 'model = "gpt-5"\n');
    setup(app);
    const toml = fs.readFileSync(path.join(app, '.codex/config.toml'), 'utf8');
    assert.match(toml, /^model = "gpt-5"\n\n\[mcp_servers\.helix\]/);
    assert.ok(!fs.existsSync(path.join(app, '.gemini')));
  });

  it('is idempotent — a second run changes nothing', () => {
    const app = newApp();
    setup(app);
    const before = fs.readFileSync(path.join(app, '.claude/settings.json'), 'utf8');
    const { code, out } = setup(app);
    assert.equal(code, 0);
    assert.doesNotMatch(out, /Created|Updated/);
    assert.equal(fs.readFileSync(path.join(app, '.claude/settings.json'), 'utf8'), before);
  });

  it('merges into the app\'s own MCP servers and hooks, keeping them', () => {
    const app = newApp();
    fs.writeFileSync(path.join(app, '.mcp.json'), JSON.stringify({ mcpServers: { github: { command: 'gh-mcp' } } }));
    fs.mkdirSync(path.join(app, '.claude'));
    fs.writeFileSync(path.join(app, '.claude/settings.json'), JSON.stringify({
      permissions: { allow: ['Bash(npm test)'] },
      hooks: { PostToolUse: [{ matcher: 'Write', hooks: [{ type: 'command', command: 'prettier --write' }] }] },
    }));
    assert.equal(setup(app).code, 0);
    const mcp = readJson(path.join(app, '.mcp.json'));
    assert.deepEqual(Object.keys(mcp.mcpServers).sort(), ['github', 'helix']);
    const settings = readJson(path.join(app, '.claude/settings.json'));
    assert.deepEqual(settings.permissions, { allow: ['Bash(npm test)'] });
    assert.equal(settings.hooks.PostToolUse[0].hooks[0].command, 'prettier --write');
    assert.equal(settings.hooks.PostToolUse.length, 2);
  });

  it('never overwrites a "helix" MCP server that points elsewhere — reports a conflict', () => {
    const app = newApp();
    const mine = JSON.stringify({ mcpServers: { helix: { command: 'node', args: ['/opt/helix/mcp.js'] } } });
    fs.writeFileSync(path.join(app, '.mcp.json'), mine);
    const { code, out } = setup(app);
    assert.equal(code, 1);
    assert.match(out, /\.mcp\.json \(a "helix" MCP server already exists/);
    assert.equal(fs.readFileSync(path.join(app, '.mcp.json'), 'utf8'), mine);
  });

  it('--agents-only installs only AGENTS.md; --dry-run writes nothing', () => {
    const only = newApp();
    setup(only, '--agents-only');
    assert.ok(fs.existsSync(path.join(only, 'AGENTS.md')));
    assert.ok(!fs.existsSync(path.join(only, '.mcp.json')));
    const dry = newApp();
    setup(dry, '--dry-run');
    assert.deepEqual(fs.readdirSync(dry), []);
  });

  it('end to end: the installed hooks run from the app and catch Helix mistakes', () => {
    const app = newApp();
    setup(app);
    // The app has @helixds/react installed, with its contracts, and no ESLint config of its own.
    const contracts = path.join(app, 'node_modules/@helixds/react/dist/contracts');
    fs.mkdirSync(contracts, { recursive: true });
    fs.copyFileSync(path.join(root, 'contracts/components/Button.json'), path.join(contracts, 'Button.json'));
    fs.mkdirSync(path.join(app, 'src'));
    const appFile = path.join(app, 'src/App.tsx');
    const code = "import { Button } from '@helixds/react';\nexport const App = () => <Button onPress={() => {}}>Save</Button>;\n";
    const transcript = path.join(app, 'transcript.jsonl');
    fs.writeFileSync(transcript, '');

    const { hooks } = readJson(path.join(app, '.claude/settings.json'));
    const command = name => [...hooks.PreToolUse, ...hooks.PostToolUse].flatMap(e => e.hooks).find(h => h.command.includes(name)).command;

    // Contract hook: writing a Button before reading Button's contract is denied.
    const contract = runHookCommand(command('claude-contract-hook'), app, { tool_name: 'Write', tool_input: { file_path: appFile, content: code }, transcript_path: transcript });
    assert.equal(contract.hookSpecificOutput.permissionDecision, 'deny');
    assert.match(contract.hookSpecificOutput.permissionDecisionReason, /Button/);

    // Lint hook: the written file goes back with Helix's own rules, though the app has no ESLint config.
    fs.writeFileSync(appFile, code);
    const lint = runHookCommand(command('claude-lint-hook'), app, { tool_name: 'Write', tool_input: { file_path: appFile } });
    assert.equal(lint.decision, 'block');
    assert.match(lint.reason, /helix\/prop-vocabulary/);

    // Owner gate: patching Helix inside node_modules asks first.
    const gate = runHookCommand(command('claude-owner-gate-hook'), app, { tool_name: 'Edit', tool_input: { file_path: path.join(contracts, 'Button.json') } });
    assert.equal(gate.hookSpecificOutput.permissionDecision, 'ask');
  });
});
