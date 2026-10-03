import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { RuleTester } from 'eslint';
import plugin from '../src/index.js';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
});
const helix = "import { Button, Badge, Card, Input } from '@helix-ds/core';\n";

tester.run('prop-vocabulary', plugin.rules['prop-vocabulary'], {
  valid: [
    helix + '<Button onPress={save}>Save</Button>',
    helix + '<Button type="submit" variant="primary">Save</Button>',  // native passthrough, not variant
    helix + '<Input name="email" label="Email" />',
    helix + '<Card onClick={open}>…</Card>',                            // Card has no onPress
    '<Button onClick={save} />',                                        // not imported from Helix
    "import { Button } from './my-button';\n<Button onClick={save} />",
  ],
  invalid: [
    {
      code: helix + '<Button onClick={save}>Save</Button>',
      output: helix + '<Button onPress={save}>Save</Button>',
      errors: [{ messageId: 'prop' }],
    },
    {
      code: helix + '<Button isLoading>Save</Button>',
      output: helix + '<Button loading>Save</Button>',
      errors: [{ messageId: 'prop' }],
    },
    {
      code: "import * as Helix from '@helix-ds/core';\n<Helix.Button onClick={save} />",
      output: "import * as Helix from '@helix-ds/core';\n<Helix.Button onPress={save} />",
      errors: [{ messageId: 'prop' }],
    },
    {
      code: "import { Button as B } from '@helix-ds/core';\n<B onClick={save} />",
      output: "import { Button as B } from '@helix-ds/core';\n<B onPress={save} />",
      errors: [{ messageId: 'prop' }],
    },
    {
      // Both set: reported, but not auto-renamed into a duplicate prop.
      code: helix + '<Button onClick={a} onPress={b} />',
      output: null,
      errors: [{ messageId: 'prop' }],
    },
    {
      // A look-alike import is still checked as Helix (import-source reports the path itself).
      code: "import { Button } from '@helix/react';\n<Button onClick={save} />",
      output: "import { Button } from '@helix/react';\n<Button onPress={save} />",
      errors: [{ messageId: 'prop' }],
    },
    {
      code: helix + '<Badge variant="error" label="Failed" />',
      output: helix + '<Badge variant="danger" label="Failed" />',
      errors: [{ messageId: 'value' }],
    },
    {
      code: helix + '<Button size="sm">Save</Button>',
      output: helix + '<Button size="s">Save</Button>',
      errors: [{ messageId: 'value' }],
    },
  ],
});

tester.run('import-source', plugin.rules['import-source'], {
  valid: [
    "import { Button } from '@helix-ds/core';",
    "import { tokens } from '@helix-ds/tokens';",
    "import helix from '@helix-ds/eslint-plugin';",
    "import '@helix-ds/core/globals.css';",
    "import '@helix-ds/wc';",
    "import { Button } from './helix/button';",
  ],
  invalid: [
    {
      code: "import { Button, toast } from '@helix/react';",
      output: "import { Button, toast } from '@helix-ds/core';",
      errors: [{ messageId: 'source' }],
    },
    {
      code: 'import { Button } from "helix-ds";',
      output: 'import { Button } from "@helix-ds/core";',
      errors: [{ messageId: 'source' }],
    },
    {
      code: "import { Button, Spinner } from '@helix/components';",
      output: null,
      errors: [{ messageId: 'unknown', data: { source: '@helix/components', names: '`Spinner`' } }],
    },
  ],
});

tester.run('no-raw-color', plugin.rules['no-raw-color'], {
  valid: [
    "const s = { color: 'var(--helix-color-text-neutral)' };",
    '<a href="#add">Add</a>',
    '<section id="#cafe" />',
    "import x from './#fff';",
    'const c = "bg-[var(--helix-color-fill-page)]";',
  ],
  invalid: [
    {
      code: "const s = { color: '#1d4ed8' };",
      errors: [{
        messageId: 'hex',
        suggestions: [
          { messageId: 'replace', output: "const s = { color: 'var(--helix-color-fill-primary-interactive-hover)' };" },
          { messageId: 'replace', output: "const s = { color: 'var(--helix-color-text-link-hover)' };" },
        ],
      }],
    },
    {
      code: "const border = `1px solid ${w} #E2E8F0`;",
      errors: [{
        messageId: 'hex',
        suggestions: [
          { messageId: 'replace', output: 'const border = `1px solid ${w} var(--helix-color-fill-secondary-interactive-hover)`;' },
          { messageId: 'replace', output: 'const border = `1px solid ${w} var(--helix-color-border-neutral)`;' },
        ],
      }],
    },
    {
      code: "const s = { color: '#123456' };",
      errors: [{ messageId: 'hexUnknown', suggestions: [] }],
    },
    {
      code: '<div className="p-4 bg-blue-600 hover:text-slate-900" />',
      errors: [{ messageId: 'tailwind' }, { messageId: 'tailwind' }],
    },
    {
      code: '<div className="bg-purple-500" />',
      errors: [{ messageId: 'tailwindUnknown' }],
    },
  ],
});

tester.run('no-raw-control', plugin.rules['no-raw-control'], {
  valid: [
    helix + '<Button onPress={save}>Save</Button>',
    '// [CUSTOM] reason: Helix has no color picker\n<input type="color" />',
    '/* [CUSTOM] calendar heatmap */\n<button />',
    '<input type="hidden" name="id" />',
  ],
  invalid: [
    { code: '<button onClick={save}>Save</button>', errors: [{ messageId: 'raw', data: { tag: 'button', helix: 'Button (or IconButton for an icon-only action)' } }] },
    { code: '<input type="checkbox" />', errors: [{ messageId: 'raw', data: { tag: 'input', helix: 'Checkbox' } }] },
    { code: '<select />', errors: [{ messageId: 'raw' }] },
    { code: '// [CUSTOM]\n<button />', errors: [{ messageId: 'noReason' }, { messageId: 'raw' }] },
  ],
});

describe('data.json', () => {
  it('is up to date with prop-map.md, the contracts and tokens.json', () => {
    const file = fileURLToPath(new URL('../src/data.json', import.meta.url));
    const before = fs.readFileSync(file, 'utf8');
    execFileSync('node', [fileURLToPath(new URL('../scripts/build-data.mjs', import.meta.url))]);
    const after = fs.readFileSync(file, 'utf8');
    assert.equal(after, before, 'src/data.json was stale — it has now been regenerated; commit the change');
  });
});
