export interface ComponentDoc {
  name: string;
  purpose: string;
  contract: string;
  a11y: string[];
  variants: { name: string; description: string }[];
  sizes: string[];
  tokens: { part: string; label: string; token?: string; value?: string; kind?: 'color' | 'typography' | 'space' | 'shadow' | 'radius' | 'other'; variant?: string; meta?: string }[];
  features: string[];
  examples: { label: string; code: string }[];
}

export function createComponentDocsParameters(doc: Pick<ComponentDoc, 'purpose' | 'tokens'>) {
  return {
    docs: {
      description: {
        component: doc.purpose,
      },
    },
    helixTokens: doc.tokens,
  };
}
