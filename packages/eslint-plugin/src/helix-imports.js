/** Tracks which JSX names in a file are Helix components imported from @helixds/react. */
import data from './data.json' with { type: 'json' };

export const HELIX_SOURCE = '@helixds/react';

// The real @helixds packages (generated from each packages/<dir>/package.json) — they and their subpaths
// (`@helixds/react/globals.css`) are never look-alikes.
const isRealPackage = source => data.packages.some(pkg => source === pkg || source.startsWith(pkg + '/'));

/**
 * A package path that looks like Helix but isn't @helixds/react: `@helix/react`, `@helix/components`,
 * `@helix/design-system`, `helix-ds`, and Helix's former name `@helix-ds/core` (ADR-023)… Agents invent
 * these — most recorded `bare` answers came with one. Their imports are still treated as Helix components so the other rules can check them.
 */
export function isLookalikeSource(source) {
  return typeof source === 'string' && !isRealPackage(source) && /^@?helix(?:[-_]?ds)?(?:\/|$)/i.test(source);
}

/**
 * Returns visitor handlers that fill `components` (local JSX name → Helix component name) from the file's
 * imports, plus a resolver for a JSXOpeningElement. Handles `import { Button }`, `import { Button as B }`
 * and `import * as Helix` (`<Helix.Button>`).
 */
export function helixImports() {
  const components = new Map();
  const namespaces = new Set();
  return {
    ImportDeclaration(node) {
      if (node.source.value !== HELIX_SOURCE && !isLookalikeSource(node.source.value)) return;
      for (const spec of node.specifiers) {
        if (spec.type === 'ImportNamespaceSpecifier') namespaces.add(spec.local.name);
        else if (spec.type === 'ImportSpecifier' && data.props[spec.imported.name]) components.set(spec.local.name, spec.imported.name);
      }
    },
    /** The Helix component an opening element renders, or undefined. */
    resolve(opening) {
      const name = opening.name;
      if (name.type === 'JSXIdentifier') return components.get(name.name);
      if (name.type === 'JSXMemberExpression' && name.object.type === 'JSXIdentifier' && namespaces.has(name.object.name)) {
        return data.props[name.property.name] ? name.property.name : undefined;
      }
      return undefined;
    },
  };
}
