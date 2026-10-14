// Tests the live traces the Claude Code hooks record (scripts/hook-trace.mjs) and their summary
// (scripts/eval-traces.mjs): each hook writes one when it stops the agent, the lint hook records the recovery,
// no code is ever stored, and HELIX_TRACES=off turns it off. Run: pnpm test:traces
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-traces-'));
const tracesDir = path.join(dir, 'traces');
const app = path.join(dir, 'my-app');
fs.mkdirSync(path.join(app, 'src'), { recursive: true });
const file = path.join(app, 'src/App.tsx');
const transcript = path.join(dir, 'transcript.jsonl');
fs.writeFileSync(transcript, '');

function runHook(script, payload, env = {}) {
  return execFileSync('node', [path.join(root, 'scripts', script)], {
    input: JSON.stringify({ session_id: 'session-1', ...payload }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: app, HELIX_TRACES_DIR: tracesDir, HELIX_TRACES: '', ...env },
  }).toString();
}
const traces = () => {
  try {
    return fs.readdirSync(tracesDir).flatMap(f => fs.readFileSync(path.join(tracesDir, f), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)));
  } catch { return []; }
};

after(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('hook traces', () => {
  const bad = "import { Button } from '@helixds/react';\nexport const App = () => <Button onPress={() => save('secret')}>Save</Button>;\n";

  it('records a lint block with its rules — and never the code', () => {
    fs.writeFileSync(file, bad);
    runHook('claude-lint-hook.mjs', { tool_name: 'Write', tool_input: { file_path: file } });
    const [trace] = traces();
    assert.equal(trace.hook, 'lint');
    assert.equal(trace.decision, 'block');
    assert.equal(trace.project, 'my-app');
    assert.equal(trace.file, 'src/App.tsx');
    assert.equal(trace.session, 'session-1');
    assert.ok(trace.findings.some(f => f.rule === 'helix/prop-vocabulary'));
    assert.doesNotMatch(JSON.stringify(trace), /secret/);
  });

  it('records the recovery when the next write of that file is clean', () => {
    fs.writeFileSync(file, "import { Button } from '@helixds/react';\nexport const App = () => <Button onClick={save}>Save</Button>;\n");
    runHook('claude-lint-hook.mjs', { tool_name: 'Write', tool_input: { file_path: file } });
    runHook('claude-lint-hook.mjs', { tool_name: 'Write', tool_input: { file_path: file } }); // clean again: nothing new
    assert.deepEqual(traces().map(t => t.decision), ['block', 'resolved']);
  });

  it('records a contract denial with the components, and an owner-gate ask', () => {
    const contracts = path.join(app, 'node_modules/@helixds/react/dist/contracts');
    fs.mkdirSync(contracts, { recursive: true });
    fs.copyFileSync(path.join(root, 'contracts/components/Button.json'), path.join(contracts, 'Button.json'));
    runHook('claude-contract-hook.mjs', { tool_name: 'Write', tool_input: { file_path: path.join(app, 'src/New.tsx'), content: bad }, transcript_path: transcript });
    runHook('claude-owner-gate-hook.mjs', { tool_name: 'Edit', tool_input: { file_path: path.join(contracts, 'Button.json') } });
    const [contract, gate] = traces().slice(2);
    assert.equal(contract.hook, 'contract');
    assert.deepEqual(contract.findings, [{ component: 'Button' }]);
    assert.equal(gate.hook, 'owner-gate');
    assert.equal(gate.decision, 'ask');
    assert.match(gate.findings[0].gate, /Helix itself/);
  });

  it('HELIX_TRACES=off records nothing', () => {
    const before = traces().length;
    fs.writeFileSync(file, bad);
    runHook('claude-lint-hook.mjs', { tool_name: 'Write', tool_input: { file_path: file } }, { HELIX_TRACES: 'off' });
    assert.equal(traces().length, before);
  });

  it('pnpm eval:traces summarizes rules, recoveries, contracts and gates', () => {
    const out = execFileSync('node', [path.join(root, 'scripts/eval-traces.mjs'), '--json'], { env: { ...process.env, HELIX_TRACES_DIR: tracesDir } }).toString();
    const summary = JSON.parse(out);
    assert.equal(summary.total, 4);
    assert.equal(summary.lint.blocks, 1);
    assert.equal(summary.lint.resolved, 1);
    assert.equal(summary.lint.blocksBeforeResolved, 1);
    assert.deepEqual(summary.contract.topComponents, [['Button', 1]]);
    assert.equal(summary.ownerGate.asks, 1);
    assert.deepEqual(summary.byProject, { 'my-app': 4 });
  });
});
