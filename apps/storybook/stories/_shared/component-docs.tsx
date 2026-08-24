import type { ComponentDoc } from '@helix-ds/core';
import figmaSync from '../../../../contracts/figma-sync.json';

// Every Components/* and Layout/* story must show a link to its Figma component — see
// apps/storybook/CLAUDE.md's "Every component story links to Figma" rule. Looked up from
// contracts/figma-sync.json by name so it can't drift from the actual node id on file; renders
// nothing (not a broken link) for a component not yet modeled in Figma.
function findFigmaUrl(name: string): string | undefined {
  const entry = figmaSync.components.find(c => c.name === name);
  if (!entry?.inFigma || !entry.figmaNodeId) return undefined;
  return `${figmaSync.figmaFileUrl}?node-id=${entry.figmaNodeId.replace(':', '-')}`;
}

export function createComponentDocsParameters(doc: Pick<ComponentDoc, 'name' | 'purpose' | 'tokens'>) {
  const figmaUrl = findFigmaUrl(doc.name);
  const description = figmaUrl
    ? `${doc.purpose}\n\n[View in Figma ↗](${figmaUrl})`
    : doc.purpose;

  return {
    docs: {
      description: {
        component: description,
      },
    },
    // `helixTokens` is intentionally reserved for Components/* stories.
    helixTokens: doc.tokens,
    figmaUrl,
  };
}
