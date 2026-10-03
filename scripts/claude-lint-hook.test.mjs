// Tests the Claude Code lint hook (scripts/claude-lint-hook.mjs) the way Claude Code calls it: a hook payload
// on stdin, a decision on stdout. Run: pnpm test:lint-hook
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const hook = path.join(root, 'scripts/claude-lint-hook.mjs');
// Inside apps/ (the only place eslint.config.mjs lints) but not a *.stories.tsx, so Storybook ignores it.
const tmp = path.join(root, `apps/storybook/stories/__lint-hook-test-${process.pid}.tsx`);

function runHook(filePath, tool = 'Write') {
  const out = execFileSync('node', [hook], {
    input: JSON.stringify({ tool_name: tool, tool_input: { file_path: filePath } }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  }).toString().trim();
  return out ? JSON.parse(out) : null;
}

after(() => fs.rmSync(tmp, { force: true }));

describe('claude-lint-hook', () => {
  it('blocks with every Helix problem in a file Claude wrote', () => {
    fs.writeFileSync(tmp, "import { Button } from '@helix/react';\nexport const Save = () => <Button onClick={() => {}} style={{ color: '#1d4ed8' }}>Save</Button>;\n");
    const result = runHook(tmp);
    assert.equal(result.decision, 'block');
    assert.match(result.reason, /helix\/import-source/);
    assert.match(result.reason, /helix\/prop-vocabulary .*onPress/);
    assert.match(result.reason, /helix\/no-raw-color .*--helix-color-fill-primary-interactive-hover/);
  });

  it('stays silent once the file is fixed', () => {
    fs.writeFileSync(tmp, "import { Button } from '@helix-ds/core';\nexport const Save = () => <Button onPress={() => {}}>Save</Button>;\n");
    assert.equal(runHook(tmp, 'Edit'), null);
  });

  it('ignores files outside apps/ — packages/core builds on native elements', () => {
    assert.equal(runHook(path.join(root, 'packages/core/src/components/Button/Button.tsx'), 'Edit'), null);
  });

  it('ignores non-code files', () => {
    assert.equal(runHook(path.join(root, 'CLAUDE.md'), 'Edit'), null);
  });
});
