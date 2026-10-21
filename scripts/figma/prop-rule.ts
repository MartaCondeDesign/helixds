/**
 * The code prop → Figma property rule (root CLAUDE.md rule 16), applied from the conversion standard
 * contracts/figma-conversion.json (human-readable: .ai/maps/figma-conversion.md). Every list of names and every
 * rule's wording comes from that file — this module only knows how to match a prop to a rule. Shared by:
 *   scripts/docs-figma-map.ts   the per-component listing, .ai/maps/figma-map.md
 *   scripts/figma/props.ts      `pnpm figma:props` — flags props no rule covers and stale exceptions
 */
import fs from 'fs';
import path from 'path';

export interface Prop { name: string; type?: string; required?: boolean; default?: unknown; description?: string }
export type Expected = { name: string; type: 'VARIANT' | 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP'; values?: string[]; why: string; rule?: string };

const STANDARD_PATH = path.resolve(import.meta.dirname, '../../contracts/figma-conversion.json');
export const STANDARD = JSON.parse(fs.readFileSync(STANDARD_PATH, 'utf8')) as {
  version: string; approved: string;
  rules: { id: string; why: string }[];
  skip: { namePatterns: string[]; names: string[]; typePatterns: string[]; nonStringValue: boolean };
  showHideBooleans: string[]; textChildren: string[]; overlays: string[]; slotsWithText: string[];
  partSuffix: Record<string, string>;
  patterns: { id: string; components: string[] }[];
};
const WHY = Object.fromEntries(STANDARD.rules.map(r => [r.id, r.why]));
const has = (list: string[], v: string) => list.includes(v);

const ROOT = path.resolve(import.meta.dirname, '../..');
const HELIX = fs.readdirSync(path.join(ROOT, 'contracts/components')).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, ''));
let currentComponent = '';
let currentSource = '';
let currentListCount: Record<string, { min?: number; max?: number }> = {};
/** The component being converted (and its contract's figma.listCount ranges, if any) — its TSX is read for list-delegated. */
export function setComponent(name: string, contract?: { figma?: { listCount?: Record<string, { min?: number; max?: number }> } }) {
  currentComponent = name; currentListCount = contract?.figma?.listCount ?? {};
  const file = ['components', 'layout'].map(d => path.join(ROOT, `packages/core/src/${d}/${name}/${name}.tsx`)).find(f => fs.existsSync(f));
  currentSource = file ? fs.readFileSync(file, 'utf8') : '';
}
/** list-delegated: the Helix component this one hands a list prop to (`<Menu options={options}>` → 'Menu'), if any.
 *  That component draws the items and owns the count; this one only holds an exposed instance of it. */
export function delegateOf(name: string): string | undefined {
  const m = currentSource.match(new RegExp(`<([A-Z]\\w*)\\b[^>]*?\\b${name}=\\{${name}\\}`));
  return m && HELIX.includes(m[1]) && m[1] !== currentComponent ? m[1] : undefined;
}
/** The standard's pattern this component follows, if any (form-field, checkable, group…). */
export function patternOf(component: string) { return STANDARD.patterns.find(p => p.components.includes(component))?.id; }

/** No rule matched: the standard has to learn this kind of prop (the owner extends figma-conversion.json). */
export const UNMATCHED = 'unmatched';
/** Suffix of a Figma-only helper property — the extra toggle Figma needs next to the property named like the code prop (errorMessage. before errorMessage). */
export const HELPER: string = (STANDARD as any).naming?.helperSuffix ?? '.';

/** The Figma properties a prop must become, each tagged with the standard's rule id. [] = no property. */
export function expectedFor(prop: Prop, parts: string[]): Expected[] {
  const name = prop.name, type = (prop.type ?? '').replace(/\s+/g, ' ').trim();
  const out = (rule: string, list: Omit<Expected, 'why' | 'rule'>[], why?: string[]) =>
    list.map((e, i) => ({ ...e, rule, why: why?.[i] ?? WHY[rule] }));
  const sk = STANDARD.skip;
  // list-count: a list of drawn items → VARIANT {name} = 1 … N (checked before skip, which drops other arrays as data)
  const lc = (STANDARD as any).listCount as { props: string[]; min: number; max: number } | undefined;
  if (lc && has(lc.props, name) && /\[\]|Array</.test(type)) {
    if (delegateOf(name)) return []; // list-delegated: the nested component owns the count (whyNone says which)
    const r = currentListCount[name] ?? {}; const min = r.min ?? lc.min, max = r.max ?? lc.max;
    return out('list-count', [{ name, type: 'VARIANT', values: Array.from({ length: max - min + 1 }, (_, i) => String(min + i)) }]);
  }
  if (sk.namePatterns.some(p => new RegExp(p).test(name)) || has(sk.names, name) || sk.typePatterns.some(p => new RegExp(p).test(type)) ||
      (sk.nonStringValue && name === 'value' && !/^string$/.test(type))) return [];
  if (type.includes('ReactElement') || (name === 'children' && type.includes('ReactNode') && !has(STANDARD.textChildren, currentComponent))) return [];
  if (name === 'expanded' && has(STANDARD.overlays, currentComponent)) return [];
  const optional = !prop.required && /undefined/.test(type);
  if (/TablerIcon|HelixIconComponent/.test(type)) return optional
    ? out('icon', [{ name: `${name}${HELPER}`, type: 'BOOLEAN' }, { name, type: 'INSTANCE_SWAP' }], ['shows the icon (Figma-only helper)', 'which icon'])
    : out('icon', [{ name, type: 'INSTANCE_SWAP' }], ['which icon']);
  const literals = type.split('|').map(t => t.trim()).filter(t => t !== 'undefined');
  if (literals.length > 1 && literals.every(t => /^'[^']*'$/.test(t) || /^\d+$/.test(t)))
    return out('union', [{ name, type: 'VARIANT', values: literals.map(t => t.replace(/'/g, '')) }]);
  if (/^boolean/.test(type))
    return has(STANDARD.showHideBooleans, name) ? out('show-hide-boolean', [{ name, type: 'BOOLEAN' }])
      : out('look-boolean', [{ name, type: 'VARIANT', values: ['false', 'true'] }]);
  if (/ReactNode/.test(type)) return optional
    ? (has(STANDARD.slotsWithText, name) ? out('slot', [{ name: `${name}${HELPER}`, type: 'BOOLEAN' }, { name, type: 'TEXT' }], ['shows the slot (Figma-only helper)', 'its text']) : out('slot', [{ name, type: 'BOOLEAN' }]))
    : out('text', [{ name, type: 'TEXT' }]);
  if (/^string/.test(type)) {
    if (name === 'placeholder') return out('text', [{ name, type: 'TEXT' }]);
    const partSuffix = STANDARD.partSuffix[name] ?? name.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
    // a part renders it: {prefix}-{suffix} in the anatomy (a label can render as the -legend, -title, -content or -initials part), or a *Label prop
    const visible = parts.some(part => part.endsWith('-' + partSuffix) || (name === 'label' && /-(legend|title|content|initials)$/.test(part))) || /Label$/.test(name);
    if (!visible) return []; // aria-text: read by screen readers only (IconButton's label, an optional aria description)
    if (!optional) return out('text', [{ name, type: 'TEXT' }]);
    return out('optional-text', [{ name: `${name}${HELPER}`, type: 'BOOLEAN' }, { name, type: 'TEXT' }], ['shows the part (Figma-only helper)', 'its text']);
  }
  return [{ name, type: 'TEXT', rule: UNMATCHED, why: 'no rule in contracts/figma-conversion.json covers this type — extend the standard' }];
}

/** Why a prop has no Figma property (expectedFor returned []): the rule id and its reason, shown in figma-map. */
export function whyNone(prop: Prop): string {
  const name = prop.name, type = (prop.type ?? '').replace(/\s+/g, ' ').trim();
  const sk = STANDARD.skip as typeof STANDARD.skip & { why?: Record<string, string> };
  const lc = (STANDARD as any).listCount as { props: string[] } | undefined;
  const to = lc && has(lc.props, name) ? delegateOf(name) : undefined;
  if (to) return `drawn by the nested ${to}: this component holds an exposed ${to} instance and the designer picks how many items on it — the count is ${to}'s property, not this one's (owner's rule 2026-10-21) · \`list-delegated\``;
  const own = sk.why?.[name] ?? (name.startsWith('aria-') ? sk.why?.['aria-*'] : undefined);
  if (own) return `${own} · \`skip\``;
  if (/^on[A-Z]/.test(name)) return 'an event handler — behaviour, nothing to draw · `skip`';
  if (/^default[A-Z]/.test(name)) return `the uncontrolled twin of \`${name[7].toLowerCase()}${name.slice(8)}\` — only the starting value, Figma shows that prop · \`skip\``;
  if (sk.typePatterns.some(p => new RegExp(p).test(type))) return 'data (a list or a ref) — content, not a design property · `skip`';
  if (has(sk.names, name)) return 'wiring or configuration (ids, refs, limits, classes) — nothing a designer sets · `skip`';
  if (sk.nonStringValue && name === 'value') return 'the value code works with — not a design property · `skip`';
  if (type.includes('ReactElement') || name === 'children') return 'another component or free content placed inside — not a property · `nested`';
  if (name === 'expanded') return 'closed = not on screen; Figma draws it open · `overlay-expanded`';
  return 'read by screen readers only — no part draws it · `aria-text`';
}
