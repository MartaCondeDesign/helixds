import type { ComponentDoc } from '@helix-ds/core';

export function createComponentDocsParameters(doc: Pick<ComponentDoc, 'purpose' | 'tokens'>) {
  return {
    docs: {
      description: {
        component: doc.purpose,
      },
    },
    // `helixTokens` is intentionally reserved for Components/* stories.
    helixTokens: doc.tokens,
  };
}
