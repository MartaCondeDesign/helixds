// Types for resolver.mjs — a DTCG 2025.10 resolver reader.

export type TokenTree = Record<string, unknown>;

export function loadResolver(resolverPath: string): {
  document: Record<string, unknown>;
  /** The merged token tree for these modifier inputs ({ theme: 'dark' }); aliases are left unresolved. */
  resolve(inputs?: Record<string, string>): TokenTree;
  /** Each modifier's context names. */
  modifiers: Record<string, string[]>;
};
