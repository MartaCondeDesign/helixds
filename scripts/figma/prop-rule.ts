/**
 * The code prop → Figma property rule (root CLAUDE.md rule 16), shared by:
 *   scripts/docs-figma-map.ts   the per-component listing, .ai/maps/figma-map.md
 *   scripts/figma/props.ts      `pnpm figma:props` — proposes the conversion of every new or changed prop and
 *                               records the owner's approval in the contract (figma.propertyMap)
 */
export interface Prop { name: string; type?: string; required?: boolean; default?: unknown; description?: string }
// Prop → the data-helix-part suffix that renders it, when it isn't just the prop in kebab-case.
const PART_SUFFIX: Record<string, string> = { errorMessage: 'error' };
// ── Exact parity rule (owner's decision 2026-10-20) ─────────────────────────────────────────────────
// Every code prop a designer can see has a Figma property with the SAME NAME, shown the same way in the
// properties panel: a code boolean is a Figma toggle, a code string is a Figma text field, a code union is a
// Figma dropdown with the same values. The one Figma-only property is `state` (hover / press / focus / open),
// because those are CSS pseudo-classes, not props.
export type Expected = { name: string; type: 'VARIANT' | 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP'; values?: string[]; why: string };

// Not a design choice: behaviour, data, ids and wiring.
const SKIP = (name: string, type: string) =>
  /^on[A-Z]/.test(name) || /^default[A-Z]/.test(name) || name.startsWith('aria-') ||
  ['className', 'id', 'name', 'href', 'ref', 'anchorRef', 'activeValue', 'invalidAttempt', 'closeOnBackdropClick',
   'decorative', 'rows', 'maxLength', 'max', 'height', 'stroke', 'color', 'values'].includes(name) ||
  /\[\]|Array<|RefObject/.test(type) || (name === 'value' && !/^string$/.test(type.trim()));
// A boolean that only shows or hides a part → a real BOOLEAN. Any other boolean changes the look → a VARIANT
// with the values false / true (Figma shows a two-value true/false variant as an on/off toggle too).
const SHOW_HIDE_BOOLEANS = new Set(['required', 'showCloseButton', 'showCount', 'dismissible']);
// Props whose Figma layer is another component or free content, not a property.
const NESTED = (name: string, type: string) => type.includes('ReactElement') || (name === 'children' && type.includes('ReactNode') && !TEXT_CHILDREN.has(currentComponent));
const TEXT_CHILDREN = new Set(['Button', 'Accordion', 'Modal', 'SidePanel', 'Card']);
let currentComponent = '';
export function setComponent(name: string) { currentComponent = name; }
const OVERLAYS = new Set(['Modal', 'SidePanel', 'Menu', 'Tooltip']);

export function expectedFor(prop: Prop, parts: string[]): Expected[] {
  const name = prop.name, type = (prop.type ?? '').replace(/\s+/g, ' ').trim();
  if (SKIP(name, type) || NESTED(name, type)) return [];
  // An overlay's `expanded` is whether it's on screen at all — Figma draws it open, there's no closed look.
  if (name === 'expanded' && OVERLAYS.has(currentComponent)) return [];
  const optional = !prop.required && /undefined/.test(type);
  if (/TablerIcon|HelixIconComponent/.test(type)) return optional
    ? [{ name, type: 'BOOLEAN', why: 'shows the icon' }, { name, type: 'INSTANCE_SWAP', why: 'which icon' }]
    : [{ name, type: 'INSTANCE_SWAP', why: 'which icon' }];
  const literals = type.split('|').map(t => t.trim()).filter(t => t !== 'undefined');
  if (literals.length > 1 && literals.every(t => /^'[^']*'$/.test(t) || /^\d+$/.test(t)))
    return [{ name, type: 'VARIANT', values: literals.map(t => t.replace(/'/g, '')), why: 'same values as code' }];
  if (/^boolean/.test(type))
    return SHOW_HIDE_BOOLEANS.has(name) ? [{ name, type: 'BOOLEAN', why: 'shows / hides a part' }]
      : [{ name, type: 'VARIANT', values: ['false', 'true'], why: 'changes the look → true/false toggle' }];
  if (/ReactNode/.test(type)) return optional
    ? (name === 'header' ? [{ name, type: 'BOOLEAN', why: 'shows the slot' }, { name: `${name} text`, type: 'TEXT', why: 'its text' }] : [{ name, type: 'BOOLEAN', why: 'shows the slot' }])
    : [{ name, type: 'TEXT', why: 'its text' }];
  if (/^string/.test(type)) {
    if (name === 'src') return [{ name, type: 'BOOLEAN', why: 'shows the photo' }];
    if (name === 'placeholder' || !optional) return [{ name, type: 'TEXT', why: 'its text' }];
    const partSuffix = PART_SUFFIX[name] ?? name.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
    const visible = parts.some(part => part.endsWith('-' + partSuffix)) || /Label$/.test(name);
    if (!visible) return []; // aria-only text (Icon's label, Chart's description)
    return [{ name, type: 'BOOLEAN', why: 'shows the part' }, { name: `${name} text`, type: 'TEXT', why: 'its text' }];
  }
  return [];
}

