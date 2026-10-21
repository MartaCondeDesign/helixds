// Tests the Figma properties hook (scripts/claude-figma-props-hook.mjs) the way Claude Code calls it: a
// PreToolUse payload for the Figma MCP's use_figma on stdin, a decision on stdout. Run: pnpm test:figma-props-hook
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

process.env.HELIX_TRACES = 'off';
const root = path.resolve(import.meta.dirname, '..');
const hook = path.join(root, 'scripts/claude-figma-props-hook.mjs');
const TOOL = 'mcp__plugin_product-management_figma__use_figma';

function runHook(code, tool_name = TOOL) {
  const out = execFileSync('node', [hook], { input: JSON.stringify({ tool_name, tool_input: { code } }), env: { ...process.env, CLAUDE_PROJECT_DIR: root } }).toString().trim();
  return out ? JSON.parse(out).hookSpecificOutput : null;
}

describe('claude-figma-props-hook', () => {
  it('asks before a property is renamed, showing that component\'s code-vs-Figma table', () => {
    const r = runHook(`const set = await figma.getNodeByIdAsync('303:4'); set.editComponentProperty(k, { name: 'label' });`);
    assert.equal(r.permissionDecision, 'ask');
    assert.match(r.permissionDecisionReason, /editComponentProperty/);
    assert.match(r.permissionDecisionReason, /### Avatar \(/);
    assert.match(r.permissionDecisionReason, /\| Code prop \| Code type \| Figma property/);
  });

  it('asks on add, delete, combineAsVariants and a variant rename', () => {
    for (const code of [
      `n.addComponentProperty('icon', 'BOOLEAN', true)`,
      `n.deleteComponentProperty(key)`,
      `figma.combineAsVariants(comps, page)`,
      'v.name = `${k}=${p[k]}`',
      `v.name = 'size=m, state=default'`,
    ]) assert.equal(runHook(code)?.permissionDecision, 'ask', code);
  });

  it('finds the component by a quoted contract name too', () => {
    assert.match(runHook(`const set = page.findOne(n => n.name === 'Button'); set.addComponentProperty('x', 'TEXT', '')`).permissionDecisionReason, /### Button \(/);
  });

  it('still asks for an unknown or new component, telling the agent to show the table first', () => {
    assert.match(runHook(`figma.createComponent()`).permissionDecisionReason, /No known component/);
  });

  it('lets read-only scripts, fills, layout and bindings through', () => {
    assert.equal(runHook(`return figma.root.children.map(p => p.name)`), null);
    assert.equal(runHook(`node.fills = [paint]; node.layoutMode = 'HORIZONTAL'; layer.name = 'avatar-image'`), null);
    assert.equal(runHook(`n.componentPropertyReferences = { characters: key }`), null);
  });

  it('ignores every other tool', () => {
    assert.equal(runHook(`n.addComponentProperty('x','TEXT','')`, 'Bash'), null);
  });
});
