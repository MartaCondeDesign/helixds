/**
 * Shared naming-rule checks for tokens.json, per packages/tokens/CLAUDE.md
 * ("Semantic naming vocabulary"). Used by verify-token-naming.ts (audits the
 * whole file) and token-cli.ts (checks one new key before writing it).
 */

// Words that must never appear as a hyphen-delimited segment of a semantic/component
// token key — each has a required replacement per packages/tokens/CLAUDE.md.
export const BANNED_SEGMENTS: Record<string, string> = {
  rest: 'default',
  active: 'press',
  subtle: 'a `-light` modifier (e.g. `primary-light`)',
  strong: 'a `-dark` modifier (e.g. `neutral-dark`)',
  brand: 'primary',
};

export function hasSegment(key: string, word: string): boolean {
  return key.toLowerCase().split('-').includes(word);
}

/** Checks a single key against the banned-segment rules. Returns violation messages, empty if clean. */
export function checkKeyNaming(key: string): string[] {
  const violations: string[] = [];
  for (const [banned, replacement] of Object.entries(BANNED_SEGMENTS)) {
    if (hasSegment(key, banned)) {
      violations.push(`Key segment '${banned}' is banned — use ${replacement} instead.`);
    }
  }
  return violations;
}

/** Checks whether an icon-family token's $value alias illegally points at semantic.color.text.*. */
export function checkIconAliasNaming(pathParts: string[], value: unknown): string[] {
  if (!pathParts.includes('icon')) return [];
  if (typeof value !== 'string' || !value.includes('semantic.color.text.')) return [];
  return [`Icon token aliases '${value}' — icons must alias semantic.color.icon.*, never semantic.color.text.*.`];
}
