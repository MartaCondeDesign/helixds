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
const helix = "import { Button, Badge, Card, Input } from '@helixds/react';\n";

tester.run('prop-vocabulary', plugin.rules['prop-vocabulary'], {
  valid: [
    helix + '<Button onClick={save}>Save</Button>',
    helix + '<Button type="submit" variant="primary">Save</Button>',  // native passthrough, not variant
    helix + '<Input name="email" label="Email" />',
    helix + '<Card onPress={open}>…</Card>',                            // Card has no onClick
    '<Button onPress={save} />',                                        // not imported from Helix
    "import { Button } from './my-button';\n<Button onPress={save} />",
  ],
  invalid: [
    {
      code: helix + '<Button onPress={save}>Save</Button>',
      output: helix + '<Button onClick={save}>Save</Button>',
      errors: [{ messageId: 'prop' }],
    },
    {
      code: helix + '<Button loading>Save</Button>',
      output: helix + '<Button isLoading>Save</Button>',
      errors: [{ messageId: 'prop' }],
    },
    {
      code: "import * as Helix from '@helixds/react';\n<Helix.Button onPress={save} />",
      output: "import * as Helix from '@helixds/react';\n<Helix.Button onClick={save} />",
      errors: [{ messageId: 'prop' }],
    },
    {
      code: "import { Button as B } from '@helixds/react';\n<B onPress={save} />",
      output: "import { Button as B } from '@helixds/react';\n<B onClick={save} />",
      errors: [{ messageId: 'prop' }],
    },
    {
      // Both set: reported, but not auto-renamed into a duplicate prop.
      code: helix + '<Button onPress={a} onClick={b} />',
      output: null,
      errors: [{ messageId: 'prop' }],
    },
    {
      // A look-alike import is still checked as Helix (import-source reports the path itself).
      code: "import { Button } from '@helixds/react';\n<Button onPress={save} />",
      output: "import { Button } from '@helixds/react';\n<Button onClick={save} />",
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
    "import { Button } from '@helixds/react';",
    "import { tokens } from '@helixds/tokens';",
    "import helix from '@helixds/eslint-plugin';",
    "import '@helixds/react/globals.css';",
    "import '@helixds/wc';",
    "import { Button } from './helix/button';",
  ],
  invalid: [
    {
      // Helix's former package name (ADR-023) is now a look-alike — fixed to the new one.
      code: "import { Button, toast } from '@helix-ds/core';",
      output: "import { Button, toast } from '@helixds/react';",
      errors: [{ messageId: 'source' }],
    },
    {
      // The package `bare` agents guess most (ADR-023) — a look-alike, fixed to the real one.
      code: "import { Button } from '@helix/react';",
      output: "import { Button } from '@helixds/react';",
      errors: [{ messageId: 'source' }],
    },
    {
      code: 'import { Button } from "helix-ds";',
      output: 'import { Button } from "@helixds/react";',
      errors: [{ messageId: 'source' }],
    },
    {
      code: "import { Button, Spinner } from '@helixds/components';",
      output: null,
      errors: [{ messageId: 'unknown', data: { source: '@helixds/components', names: '`Spinner`' } }],
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

tester.run('no-raw-spacing', plugin.rules['no-raw-spacing'], {
  valid: [
    "const s = { padding: 'var(--helix-spacing-m)' };",
    "const s = { margin: 0, gap: '0px', marginInline: 'auto' };",
    "const s = { maxWidth: '600px', width: 320 };",
    "const s = { padding: `calc(var(--helix-spacing-m) * 2)` };",
  ],
  invalid: [
    {
      code: "const s = { padding: '16px' };",
      errors: [{
        messageId: 'raw',
        suggestions: [
          { messageId: 'replace', output: "const s = { padding: 'var(--helix-spacing-m)' };" },
          { messageId: 'replace', output: "const s = { padding: 'var(--helix-spacing-component-l)' };" },
        ],
      }],
    },
    {
      code: "<div style={{ marginTop: '2rem' }} />",
      errors: [{
        messageId: 'raw',
        suggestions: [
          { messageId: 'replace', output: "<div style={{ marginTop: 'var(--helix-spacing-xl)' }} />" },
          { messageId: 'replace', output: "<div style={{ marginTop: 'var(--helix-spacing-layout-m)' }} />" },
        ],
      }],
    },
    {
      code: 'const s = { gap: 8 };',
      errors: [{
        messageId: 'raw',
        suggestions: [
          { messageId: 'replace', output: "const s = { gap: 'var(--helix-spacing-xs)' };" },
          { messageId: 'replace', output: "const s = { gap: 'var(--helix-spacing-component-s)' };" },
        ],
      }],
    },
    {
      code: "const s = { padding: '8px 20px' };",
      errors: [
        { messageId: 'raw', suggestions: 2 },
        { messageId: 'rawUnknown', suggestions: [] },
      ],
    },
  ],
});

tester.run('no-raw-control', plugin.rules['no-raw-control'], {
  valid: [
    helix + '<Button onClick={save}>Save</Button>',
    '// [CUSTOM] reason: Helix has no color picker\n<input type="color" />',
    '/* [CUSTOM] calendar heatmap */\n<button />',
    '<input type="hidden" name="id" />',
  ],
  invalid: [
    { code: '<button onPress={save}>Save</button>', errors: [{ messageId: 'raw', data: { tag: 'button', helix: 'Button (or IconButton for an icon-only action)' } }] },
    { code: '<input type="checkbox" />', errors: [{ messageId: 'raw', data: { tag: 'input', helix: 'Checkbox' } }] },
    { code: '<select />', errors: [{ messageId: 'raw' }] },
    { code: '// [CUSTOM]\n<button />', errors: [{ messageId: 'noReason' }, { messageId: 'raw' }] },
  ],
});

tester.run('unknown-prop', plugin.rules['unknown-prop'], {
  valid: [
    helix + '<Button variant="primary" isLoading={saving} onClick={save}>Save</Button>',
    helix + '<Button id="save" aria-busy={saving} data-testid="save" onMouseEnter={hover}>Save</Button>',  // HTML passthrough
    helix + '<Button loading>Save</Button>',            // anti-synonym — prop-vocabulary reports and fixes it
    helix + '<Card>…</Card>',
    '<Button isPending />',                             // not imported from Helix
  ],
  invalid: [
    {
      // What an agent with no guide wrote in the evals: a prop from another library.
      code: helix + '<Button wobble>Save</Button>',
      errors: [{ messageId: 'unknown', data: { prop: 'wobble', component: 'Button', props: 'variant, size, isLoading, disabled, icon, iconEnd, fullWidth, onClick, children' } }],
    },
    {
      // Button takes its text as children — the message says so instead of listing props.
      code: helix + '<Button label="Save" onClick={save} />',
      errors: [{ messageId: 'children' }],
    },
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
