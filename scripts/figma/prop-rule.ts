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
  showHideBooleans: string[]; textChildren: string[]; overlays: string[]; slotsWithText: string[]; photoProps: string[];
  partSuffix: Record<string, string>;
  patterns: { id: string; components: string[] }[];
};
const WHY = Object.fromEntries(STANDARD.rules.map(r => [r.id, r.why]));
const has = (list: string[], v: string) => list.includes(v);

let currentComponent = '';
export function setComponent(name: string) { currentComponent = name; }
/** The standard's pattern this component follows, if any (form-field, checkable, group…). */
export function patternOf(component: string) { return STANDARD.patterns.find(p => p.components.includes(component))?.id; }

/** No rule matched: the standard has to learn this kind of prop (the owner extends figma-conversion.json). */
export const UNMATCHED = 'unmatched';

/** The Figma properties a prop must become, each tagged with the standard's rule id. [] = no property. */
export function expectedFor(prop: Prop, parts: string[]): Expected[] {
  const name = prop.name, type = (prop.type ?? '').replace(/\s+/g, ' ').trim();
  const out = (rule: string, list: Omit<Expected, 'why' | 'rule'>[], why?: string[]) =>
    list.map((e, i) => ({ ...e, rule, why: why?.[i] ?? WHY[rule] }));
  const sk = STANDARD.skip;
  if (sk.namePatterns.some(p => new RegExp(p).test(name)) || has(sk.names, name) || sk.typePatterns.some(p => new RegExp(p).test(type)) ||
      (sk.nonStringValue && name === 'value' && !/^string$/.test(type))) return [];
  if (type.includes('ReactElement') || (name === 'children' && type.includes('ReactNode') && !has(STANDARD.textChildren, currentComponent))) return [];
  if (name === 'expanded' && has(STANDARD.overlays, currentComponent)) return [];
  const optional = !prop.required && /undefined/.test(type);
  if (/TablerIcon|HelixIconComponent/.test(type)) return optional
    ? out('icon', [{ name, type: 'BOOLEAN' }, { name, type: 'INSTANCE_SWAP' }], ['shows the icon', 'which icon'])
    : out('icon', [{ name, type: 'INSTANCE_SWAP' }], ['which icon']);
  const literals = type.split('|').map(t => t.trim()).filter(t => t !== 'undefined');
  if (literals.length > 1 && literals.every(t => /^'[^']*'$/.test(t) || /^\d+$/.test(t)))
    return out('union', [{ name, type: 'VARIANT', values: literals.map(t => t.replace(/'/g, '')) }]);
  if (/^boolean/.test(type))
    return has(STANDARD.showHideBooleans, name) ? out('show-hide-boolean', [{ name, type: 'BOOLEAN' }])
      : out('look-boolean', [{ name, type: 'VARIANT', values: ['false', 'true'] }]);
  if (/ReactNode/.test(type)) return optional
    ? (has(STANDARD.slotsWithText, name) ? out('slot', [{ name, type: 'BOOLEAN' }, { name: `${name} text`, type: 'TEXT' }], ['shows the slot', 'its text']) : out('slot', [{ name, type: 'BOOLEAN' }]))
    : out('text', [{ name, type: 'TEXT' }]);
  if (/^string/.test(type)) {
    if (has(STANDARD.photoProps, name)) return out('photo', [{ name, type: 'BOOLEAN' }]);
    if (name === 'placeholder' || !optional) return out('text', [{ name, type: 'TEXT' }]);
    const partSuffix = STANDARD.partSuffix[name] ?? name.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
    const visible = parts.some(part => part.endsWith('-' + partSuffix)) || /Label$/.test(name);
    if (!visible) return []; // aria-text: read by screen readers only
    return out('optional-text', [{ name, type: 'BOOLEAN' }, { name: `${name} text`, type: 'TEXT' }], ['shows the part', 'its text']);
  }
  return [{ name, type: 'TEXT', rule: UNMATCHED, why: 'no rule in contracts/figma-conversion.json covers this type — extend the standard' }];
}
