import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { missingExport, readCells, unresolvedImport } from '../src/cells.ts';

const allowed = ['react', '@acme/ui'];

describe('@helix/proof cells', () => {
  it('accepts allowed packages, their subpaths and relative imports', () => {
    const code = `import { useState } from 'react';\nimport { createRoot } from 'react-dom/client';`;
    assert.equal(unresolvedImport(code, [...allowed, 'react-dom']), null);
    assert.equal(unresolvedImport(`import { Button } from '@acme/ui/button';\nimport './local';`, allowed), null);
  });

  it('flags the first package the answer made up', () => {
    assert.equal(unresolvedImport(`import { Button } from '@acme/react';\nimport 'react';`, allowed), '@acme/react');
    assert.equal(unresolvedImport(`const m = import('lodash');`, allowed), 'lodash');
    // A name that only starts like an allowed package is still a different package.
    assert.equal(unresolvedImport(`import x from 'react-query';`, allowed), 'react-query');
  });

  it('flags a named import its package does not export', () => {
    const exportsByPackage = { '@acme/ui': ['Button', 'Card'] };
    assert.equal(missingExport(`import { Button, Card } from '@acme/ui';`, exportsByPackage), null);
    assert.deepEqual(missingExport(`import { Button, AcmeTopBar as Bar } from '@acme/ui';`, exportsByPackage), { pkg: '@acme/ui', name: 'AcmeTopBar' });
    assert.equal(missingExport(`import { Whatever } from 'react';`, exportsByPackage), null);
  });

  it('reads answers, skips ones without a variant, and normalizes scores to 0–100', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'proof-'));
    const write = (name: string, body: object) => writeFileSync(path.join(dir, name), JSON.stringify(body));
    write('a.json', { promptId: 'task', variant: 'bare', rep: 1, score: 0.5, passed: false, generatedCode: `import { X } from 'nope';` });
    write('b.json', { promptId: 'task', variant: 'skill', rep: 0, score: 92, passed: true, generatedCode: `import { Button } from '@acme/ui';` });
    write('c.json', { promptId: 'task', score: 1, passed: true, generatedCode: 'x' });
    write('d.json', { promptId: 'task', variant: 'bare', rep: 2, score: 0, passed: false, generatedCode: '  ' });

    const cells = readCells(dir, allowed);
    assert.deepEqual(cells.map(c => [c.id, c.score, c.buildError]), [
      ['a', 50, 'Cannot resolve "nope"'],
      ['b', 92, null],
      ['d', 0, 'No code in the answer'],
    ]);
  });

  it('turns a made-up import, missed criteria and invalid patterns into plain issues', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'proof-'));
    writeFileSync(path.join(dir, 'a.json'), JSON.stringify({
      promptId: 'task', variant: 'bare', score: 0.4, passed: false, generatedCode: `import { Button } from '@acme/react';`,
      successResults: [{ text: 'Imports `Button` from `@acme/ui`', pass: false }, { text: 'Has a label', pass: true }],
      invalidResults: [{ text: '`onClick=` — anti-synonym', pass: false }],
    }));
    assert.deepEqual(readCells(dir, allowed)[0].issues, [
      "Imports a package that doesn't exist",
      'Missed: Imports Button from @acme/ui',
      'Used: onClick=',
    ]);
  });

  it('shows only the latest round per task × variant, and every answer when there is no round', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'proof-'));
    const write = (name: string, body: object) =>
      writeFileSync(path.join(dir, name), JSON.stringify({ promptId: 'task', score: 1, passed: true, generatedCode: 'x', ...body }));
    write('old-1.json', { variant: 'bare', rep: 0 });
    write('old-2.json', { variant: 'bare', rep: 1 });
    write('r1.json', { variant: 'skill', rep: 0, round: '2026-10-01T10-00' });
    write('r2a.json', { variant: 'skill', rep: 0, round: '2026-10-06T17-30' });
    write('r2b.json', { variant: 'skill', rep: 1, round: '2026-10-06T17-30' });
    write('fill.json', { variant: 'skill', rep: 2 });

    assert.deepEqual(readCells(dir, allowed).map(c => c.id).sort(), ['old-1', 'old-2', 'r2a', 'r2b']);
  });
});
