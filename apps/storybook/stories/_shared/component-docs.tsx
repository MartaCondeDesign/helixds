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
  // A markdown "\n\n" here would render as two separate <p> elements with the browser's default
  // paragraph margin (~16px) between them — not controllable to a specific value. Using a raw <br/>
  // plus an inline-block <a> with its own margin-top keeps it a single block so the 8px gap actually
  // applies (Storybook's Description block passes raw HTML through).
  const description = figmaUrl
    ? `${doc.purpose}<br/><a href="${figmaUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;">View in Figma ↗</a>`
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
