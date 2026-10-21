import type { ComponentDoc } from '@helixds/react';
import figmaSync from '../../../../contracts/figma-sync.json';

// Every Components/* and Layout/* story must show a link to its Figma component — see
// apps/storybook/CLAUDE.md's "Every component story links to Figma" rule. Looked up from
// contracts/figma-sync.json by name so it can't drift from the actual node id on file; renders
// nothing (not a broken link) for a component not yet modeled in Figma. The link opens the public
// Figma Community file (figmaCommunityUrl): the working file is private, and a Community page takes
// no node-id, so every component links to the same page.
function findFigmaUrl(name: string): string | undefined {
  const entry = figmaSync.components.find(c => c.name === name);
  if (!entry?.inFigma || !entry.figmaNodeId) return undefined;
  return figmaSync.figmaCommunityUrl;
}

export function createComponentDocsParameters(doc: Pick<ComponentDoc, 'name' | 'purpose' | 'tokens'>) {
  const figmaUrl = findFigmaUrl(doc.name);
  // Verified 2026-08-25 against real screenshots: three attempts at putting the link on its own
  // line/block below the purpose text — markdown "\n\n" (two <p>s, browser default ~16-24px gap),
  // "<br/>" + inline-block <a style="margin-top:8px">, and a self-contained <p style="margin:8px...">
  // wrapping the link — all rendered with the SAME oversized gap. Whatever Storybook's docs markdown
  // pipeline is doing here, an inline `style` margin on a new block is not surviving it, and there's
  // no reliable way to prove why without DOM access this session has none of. Stopped fighting
  // block-to-block spacing entirely: the link is now inline, appended straight after the purpose
  // text on the same line/paragraph — there is no vertical gap to control because there's no second
  // block. This is a deliberate layout change (link no longer on its own line), not a smaller version
  // of the same fix.
  const description = figmaUrl
    ? `${doc.purpose} <a href="${figmaUrl}" target="_blank" rel="noopener noreferrer">View in Figma</a>`
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
