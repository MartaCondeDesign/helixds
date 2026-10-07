/**
 * helix/import-source — Helix components come from @helixds/react, nowhere else.
 *
 *   import { Button } from '@helix/react';     → '@helixds/react'   (what `bare` agents guess most)
 *   import { Button } from '@helix-ds/core';   → '@helixds/react'   (Helix's former name, ADR-023)
 *
 * Auto-fixed when every imported name really is an @helixds/react export; otherwise only reported (the
 * import may also name things Helix doesn't have — fixing the path would just move the error).
 */
import data from '../data.json' with { type: 'json' };
import { HELIX_SOURCE, isLookalikeSource } from '../helix-imports.js';

const EXPORTS = new Set(data.coreExports);

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Import Helix components from @helixds/react, not a look-alike package path' },
    fixable: 'code',
    schema: [],
    messages: {
      source: "`{{source}}` is not a Helix package — Helix components come from '@helixds/react'.",
      unknown: "`{{source}}` is not a Helix package, and @helixds/react has no {{names}} — check `pnpm helix components`.",
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (!isLookalikeSource(source)) return;
        const named = node.specifiers.filter(s => s.type === 'ImportSpecifier').map(s => s.imported.name);
        const missing = named.filter(name => !EXPORTS.has(name));
        const quote = node.source.raw[0];
        context.report({
          node: node.source,
          messageId: missing.length ? 'unknown' : 'source',
          data: { source, names: missing.map(n => `\`${n}\``).join(', ') },
          fix: missing.length ? null : fixer => fixer.replaceText(node.source, `${quote}${HELIX_SOURCE}${quote}`),
        });
      },
    };
  },
};
