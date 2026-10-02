/**
 * Expected Figma colors, from code — `pnpm figma:expected <Name>` (Storybook must be running).
 *
 * Renders the component in Storybook for every Figma variant listed in its spec below, puts it into each
 * interaction state for real (hover = pointer over it, press = pointer down, focus = keyboard focus,
 * disabled/invalid = props), in light AND dark theme, and records the computed colors of each part.
 * Writes .ai/figma-expected/{Name}.json — the EXPECTED input of scripts/figma/audit-component.js, which
 * compares those colors against the Figma variants (the parity check). Nothing here is hand-typed color:
 * if Figma disagrees with this file, Figma is wrong (root CLAUDE.md rule 8).
 *
 * A spec maps Figma variant axes to Storybook args + a state, and Figma layer names to DOM parts:
 *   parts: { '<figma layer>': { part: '<data-helix-part>', fill?: true, stroke?: true, text?: true } }
 * `(root)` is the variant component itself.
 */
import fs from 'fs';
import path from 'path';
import { chromium, type Page } from 'playwright';

type State = 'default' | 'hover' | 'press' | 'focus' | 'disabled' | 'invalid';
type PartSpec = { part: string; fill?: boolean; stroke?: boolean; text?: boolean; placeholder?: boolean };
type Spec = {
  story: string;                              // a story rendering exactly one instance from its args
  axes: Record<string, string[]>;             // Figma variant axes (besides state) -> values
  states: State[];                            // the `state` axis values, in order
  args: (v: Record<string, string>, state: State) => Record<string, string | boolean>;
  parts: Record<string, PartSpec>;
  target: string;                             // the data-helix-part that receives hover/press/focus
  scope?: (v: Record<string, string>) => string; // when the story renders several instances: CSS selector of the one to measure
  storyFor?: Partial<Record<State, string>>;       // a different story for a state whose prop the main story won't take from the URL
};

// Stories with NO `play` function only: a play that fails puts Storybook's error overlay on top of the
// component, and every pointer state (hover/press) silently measures the overlay instead.
const SPECS: Record<string, Spec> = {
  Chip: {
    story: 'components-chip--variants',
    axes: { variant: ['neutral', 'info', 'success', 'warning', 'danger'], size: ['s'], dismissible: ['false'] },
    states: ['default', 'hover', 'press', 'focus', 'disabled'],
    args: (v, s) => ({ size: v.size!, dismissible: v.dismissible === 'true', disabled: s === 'disabled' }),
    parts: { '(root)': { part: 'chip', fill: true, stroke: true }, 'chip-label': { part: 'chip-label', text: true } },
    target: 'chip',
    scope: v => `[data-helix-part="chip"][data-variant="${v.variant}"]`,
  },
  Input: {
    story: 'components-input--default',
    axes: { size: ['m'] },
    states: ['default', 'hover', 'focus', 'invalid', 'disabled'],
    args: (v, s) => ({ label: 'Label', size: v.size!, placeholder: 'Placeholder', invalid: s === 'invalid', disabled: s === 'disabled' }),
    parts: { '(root)': { part: 'input-wrapper', fill: true, stroke: true }, 'input-field': { part: 'input-field', placeholder: true } },
    target: 'input-field',
  },
  Textarea: {
    story: 'components-textarea--default',
    axes: { size: ['m'] },
    states: ['default', 'hover', 'focus', 'invalid', 'disabled'],
    args: (v, s) => ({ label: 'Label', size: v.size!, placeholder: 'Placeholder', invalid: s === 'invalid', disabled: s === 'disabled' }),
    parts: { '(root)': { part: 'textarea-wrapper', fill: true, stroke: true }, 'textarea-field': { part: 'textarea-field', placeholder: true } },
    target: 'textarea-field',
    storyFor: { disabled: 'components-textarea--disabled' }, // the Default story ignores a URL `disabled` arg
  },
  Badge: {
    story: 'components-badge--all-variants',
    axes: { variant: ['neutral', 'info', 'success', 'warning', 'danger'], size: ['s'] },
    states: ['default'],
    args: () => ({}),
    parts: { '(root)': { part: 'badge', fill: true, stroke: true }, 'badge-label': { part: 'badge-label', text: true } },
    target: 'badge',
    scope: v => `[data-helix-part="badge"][data-variant="${v.variant}"]`,
  },
};

const toHex = (css: string): string => {
  if (!css || css === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(css)) return 'none';
  let m = css.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return '#' + m.slice(1, 4).map(x => Number(x).toString(16).padStart(2, '0')).join('');
  m = css.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/);
  if (m) return '#' + m.slice(1, 4).map(x => Math.round(Number(x) * 255).toString(16).padStart(2, '0')).join('');
  return css;
};

async function measure(page: Page, spec: Spec, v: Record<string, string>, state: State, theme: 'light' | 'dark') {
  const scope = spec.scope ? spec.scope(v) : null;
  await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
  await page.mouse.move(0, 0);
  const target = (scope ? page.locator(scope).first() : page.locator(`[data-helix-part="${spec.target}"]`).first());
  if (state === 'hover' || state === 'press') {
    const box = await target.boundingBox(); // a real pointer move — locator.hover() can stall on Storybook's own overlays
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  }
  if (state === 'press') await page.mouse.down();
  if (state === 'focus') { await page.keyboard.press('Shift'); await target.focus(); }
  await page.waitForTimeout(350); // let CSS transitions finish
  const raw = await page.evaluate(({ parts, scope }) => {
    const root: ParentNode = (scope && document.querySelector(scope)?.parentElement) || document;
    const out: Record<string, Record<string, string>> = {};
    for (const [layer, p] of Object.entries(parts)) {
      const el = scope && document.querySelector(scope)?.matches(`[data-helix-part="${p.part}"]`) ? document.querySelector(scope) : (scope ? document.querySelector(scope)?.querySelector(`[data-helix-part="${p.part}"]`) : root.querySelector(`[data-helix-part="${p.part}"]`));
      if (!el) continue;
      const cs = getComputedStyle(el);
      out[layer] = {};
      if (p.fill) out[layer]!.fill = cs.backgroundColor;
      if (p.stroke) out[layer]!.stroke = parseFloat(cs.borderTopWidth) > 0 ? cs.borderTopColor : 'transparent';
      if (p.text) out[layer]!.fill = cs.color; // a Figma TEXT layer's fill is its text color
      if (p.placeholder) out[layer]!.fill = getComputedStyle(el, '::placeholder').color; // the Figma layer shows placeholder text
    }
    return out;
  }, { parts: spec.parts, scope });
  if (state === 'press') await page.mouse.up();
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([p, c]) => [p, toHex(c)]))]));
}

async function main() {
  const name = process.argv[2];
  const spec = name ? SPECS[name] : undefined;
  if (!spec) { console.error(`Usage: pnpm figma:expected <${Object.keys(SPECS).join('|')}>`); process.exit(1); }
  const url = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const combos = Object.entries(spec.axes).reduce<Record<string, string>[]>((acc, [k, vals]) => acc.flatMap(a => vals.map(v => ({ ...a, [k]: v }))), [{}]);
  const colors: Record<string, { light: unknown; dark: unknown }> = {};
  for (const v of combos) for (const state of spec.states) {
    const args = Object.entries(spec.args(v, state)).map(([k, x]) => `${k}:${typeof x === 'boolean' ? '!' + x : x}`).join(';');
    await page.goto(`${url}/iframe.html?viewMode=story&id=${spec.storyFor?.[state] ?? spec.story}&args=${encodeURIComponent(args)}`);
    await page.waitForSelector(spec.scope ? spec.scope(v) : `[data-helix-part="${spec.target}"]`, { state: 'attached' });
    const variantName = [...Object.entries(v).map(([k, x]) => `${k}=${x}`), ...(spec.states.length > 1 ? [`state=${state}`] : [])].join(', ');
    colors[variantName] = { light: await measure(page, spec, v, state, 'light'), dark: await measure(page, spec, v, state, 'dark') };
  }
  await browser.close();
  const out = path.resolve(__dirname, '../../.ai/figma-expected', `${name}.json`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ $comment: `Generated by pnpm figma:expected ${name} from Storybook computed styles — do not hand-edit.`, states: spec.states, colors }, null, 2) + '\n');
  console.log(`✅ ${path.relative(process.cwd(), out)} — ${Object.keys(colors).length} variants × light/dark`);
}
main();
