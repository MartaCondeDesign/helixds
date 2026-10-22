// Tests the Figma mirror hook (scripts/claude-figma-mirror-hook.mjs) the way Claude Code calls it: a PostToolUse
// payload for the Figma MCP's use_figma on stdin, feedback on stdout. Run: pnpm test:figma-mirror-hook
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const hook = path.join(root, 'scripts/claude-figma-mirror-hook.mjs');
const sync = JSON.parse(fs.readFileSync(path.join(root, 'contracts/figma-sync.json'), 'utf8'));
const TOOL = 'mcp__plugin_product-management_figma__use_figma';

function runHook(code, fileKey = sync.figmaFileKey, extra = {}) {
  const out = execFileSync('node', [hook], { input: JSON.stringify({ tool_name: TOOL, tool_input: { fileKey, code }, ...extra }), env: { ...process.env, CLAUDE_PROJECT_DIR: root } }).toString().trim();
  return out ? JSON.parse(out) : null;
}

describe('claude-figma-mirror-hook', () => {
  it('knows both files', () => {
    assert.ok(sync.figmaFileKey && sync.figmaCommunityFileKey && sync.figmaFileKey !== sync.figmaCommunityFileKey);
  });

  it('tells the agent to run a write on the Community file too, naming its key', () => {
    for (const code of [
      `card.fills = [paint('fill/page')]`,
      `const t = figma.createText(); page.appendChild(t)`,
      `node.remove()`,
      `set.editComponentProperty(k, { name: 'label' })`,
      `n.setBoundVariable('itemSpacing', v)`,
    ]) {
      const r = runHook(code);
      assert.equal(r?.decision, 'block', code);
      assert.match(r.reason, new RegExp(sync.figmaCommunityFileKey));
    }
  });

  it('lets read-only scripts through', () => {
    assert.equal(runHook(`return figma.root.children.map(p => p.name)`), null);
    assert.equal(runHook(`const ok = n.name === 'Button'; return ok`), null);
  });

  it('lets a script on the Community file itself through', () => {
    assert.equal(runHook(`card.fills = []`, sync.figmaCommunityFileKey), null);
  });

  it('lets a failed call through (nothing changed to mirror)', () => {
    assert.equal(runHook(`card.fills = []`, sync.figmaFileKey, { tool_response: 'Error: no edit access' }), null);
  });

  it('ignores other tools', () => {
    const out = execFileSync('node', [hook], { input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'ls' } }), env: { ...process.env, CLAUDE_PROJECT_DIR: root } }).toString().trim();
    assert.equal(out, '');
  });
});
