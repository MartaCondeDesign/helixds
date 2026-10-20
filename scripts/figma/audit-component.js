/**
 * Figma component audit — run through the Figma MCP `use_figma` tool (Plugin API), never by hand.
 * Paste this file's contents as the `code` argument, with SET_ID / PAGE_ID / EXPECTED filled in
 * (see .ai/skills/components-to-figma.md → "Phase 6 — Audit"). Returns a JSON report; `pass` must be true
 * before figma-sync.json may record the component as synced.
 *
 * Checks, on every variant of the COMPONENT_SET:
 *   1 colors     every visible SOLID fill/stroke is bound to a `Theme` variable — no hex, no Primitives
 *   2 spacing    every non-zero padding / itemSpacing / counterAxisSpacing / corner radius is bound to a
 *                variable — no literal numbers (negative itemSpacing is reported too: it's a layout hack)
 *   3 spacers    no empty FRAME/RECTANGLE used as a spacer (no children, no visible fill/stroke) — spacing
 *                is auto-layout padding/gap bound to a spacing variable, never a node
 *   4 states     the set has a `state` axis whose values include every state in EXPECTED.states
 *                (from the contract: intrinsic hover/focus/active + authored ones like disabled/invalid)
 *   5 parity     with EXPECTED.colors (from `pnpm figma:expected <Name>`, real computed styles from the
 *                browser), the resolved fill/stroke/text color of each listed part matches code in light
 *                AND dark mode (±5 per 0–255 channel). A root fill is compared as its COMPOSITE: the root's
 *                own fill with any `state-layer` child (the Figma stand-in for a CSS color-mix) blended on top.
 *   7 fallback   every bound paint's plain `color` (what Figma falls back to in some renders) equals the
 *                variable's resolved value — a black fallback made edited main components render black
 *   6 border     a layer that has a border in one variant has it in every variant, at the same weight —
 *                a border never appears/disappears between states, only its color changes (otherwise the
 *                component changes size; see .ai/maps/patterns/border-always.md)
 *                — and the border counts in the auto layout (strokesIncludedInLayout), like CSS border-box
 *   8 layout     with EXPECTED.layout (same file, measured in the browser): per variant, the root's height,
 *                padding, gap (itemSpacing) and corner radius, each icon's width/height, and each text layer's
 *                font size, line height, weight and family equal code's (±0.5px)
 *   9 binding    and each of those is bound to the RIGHT variable — the one code's token resolves to
 *                (EXPECTED.layout.*.figma, scripts/figma/token-chain.ts) — and each text layer uses the named
 *                Text Style code's typography comes from. Being bound to *a* variable with the same number
 *                isn't enough: change the token and Figma wouldn't follow.
 */
const SET_ID = '__SET_ID__';
const PAGE_ID = '__PAGE_ID__';
const EXPECTED = __EXPECTED__; // { states: [...], colors: { "<variant name>": { "<layer name>": { fill, stroke, text } (light), dark: {...} } } }

// SET_ID may be the component set or the page holding it (figma-sync.json records pages for some components).
let set = await figma.getNodeByIdAsync(SET_ID);
if (set.type === 'PAGE') { await figma.setCurrentPageAsync(set); set = set.findAllWithCriteria({ types: ['COMPONENT_SET'] })[0]; }
// PAGE_ID may be left as is: the set's own page is found by walking up.
let page = PAGE_ID.startsWith('__') ? set : await figma.getNodeByIdAsync(PAGE_ID);
while (page && page.type !== 'PAGE') page = page.parent;
await figma.setCurrentPageAsync(page);
// A plain COMPONENT (Tooltip, Modal, a layout composition) is its own single variant.
const VARIANTS = set.type === 'COMPONENT_SET' ? set.children : [set];
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const colById = Object.fromEntries(cols.map(c => [c.id, c]));
const vars = await figma.variables.getLocalVariablesAsync();
const varById = Object.fromEntries(vars.map(v => [v.id, v]));
const theme = cols.find(c => c.name === 'Theme');
const issues = { colors: [], spacing: [], spacers: [], states: [], parity: [], border: [], fallback: [], layout: [], binding: [] };
const where = (variant, node) => `${variant.name} › ${node === variant ? '(root)' : node.name}`;

function checkPaints(variant, node, key) {
  const paints = node[key];
  if (!Array.isArray(paints)) return;
  for (const p of paints) {
    if (p.type !== 'SOLID' || p.visible === false) continue;
    const id = p.boundVariables?.color?.id;
    if (!id) { issues.colors.push(`${where(variant, node)}: ${key} is a raw color, not a variable`); continue; }
    const coll = colById[varById[id]?.variableCollectionId]?.name;
    if (coll !== 'Theme') issues.colors.push(`${where(variant, node)}: ${key} bound to ${coll}:${varById[id]?.name} — must be a Theme variable`);
    const r = varById[id]?.resolveForConsumer(node)?.value;
    if (r && [r.r - p.color.r, r.g - p.color.g, r.b - p.color.b].some(d => Math.abs(d) > 0.02)) issues.fallback.push(`${where(variant, node)}: ${key} fallback color differs from the variable's value — rebuild the paint with color = resolved value`);
  }
}
const SPACING_KEYS = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'itemSpacing', 'counterAxisSpacing'];
const RADIUS_KEYS = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'];
function checkSpacing(variant, node) {
  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    for (const k of SPACING_KEYS) {
      if (k === 'counterAxisSpacing' && node.layoutWrap !== 'WRAP') continue;
      const v = node[k];
      if (typeof v !== 'number' || v === 0) continue;
      if (v < 0) issues.spacing.push(`${where(variant, node)}: ${k} is negative (${v}) — a layout hack, rebuild the structure instead`);
      else if (!node.boundVariables?.[k]) issues.spacing.push(`${where(variant, node)}: ${k} = ${v} is a literal — bind a spacing variable`);
    }
  }
  for (const k of RADIUS_KEYS) {
    if (typeof node[k] === 'number' && node[k] > 0 && !node.boundVariables?.[k]) { issues.spacing.push(`${where(variant, node)}: ${k} = ${node[k]} is a literal — bind a radius variable`); break; }
  }
}
function isSpacer(node) {
  if (!['FRAME', 'RECTANGLE'].includes(node.type)) return false;
  if ('children' in node && node.children.length) return false;
  const visible = arr => Array.isArray(arr) && arr.some(p => p.visible !== false);
  return !visible(node.fills) && !visible(node.strokes);
}
function walk(variant, node) {
  checkPaints(variant, node, 'fills');
  checkPaints(variant, node, 'strokes');
  checkSpacing(variant, node);
  if (node !== variant && node.name !== 'state-layer' && isSpacer(node)) issues.spacers.push(`${where(variant, node)}: empty ${node.type} used as spacing — use padding/gap bound to a spacing variable`);
  if ('children' in node && node.type !== 'INSTANCE') for (const c of node.children) walk(variant, c);
}
for (const variant of VARIANTS) walk(variant, variant);

// 6 border — per layer name: present everywhere at one weight, or nowhere
const strokeByLayer = {};
for (const variant of VARIANTS) {
  const visit = n => {
    const key = n === variant ? '(root)' : n.name;
    // a hidden stroke still counts as a border: code's transparent border keeps the size (border-always.md)
    const has = Array.isArray(n.strokes) && n.strokes.length > 0;
    // per-side borders (a bottom-only divider) have a mixed strokeWeight: compare the four sides instead
    const weight = typeof n.strokeWeight === 'symbol' ? [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight].join('/') : `${n.strokeWeight}`;
    (strokeByLayer[key] ??= []).push(has ? weight : 'none');
    // code is border-box: the border takes space (1 border + padding = the distance to the content). An
    // auto-layout frame whose stroke sits outside the layout is 2px narrower and its content 1px closer to
    // the edge than in code — Badge, Input and Textarea had exactly this.
    if (has && n.layoutMode && n.layoutMode !== 'NONE' && n.type !== 'INSTANCE' && n.strokesIncludedInLayout === false && !(EXPECTED.borderOutsideLayout && n === variant))
      issues.border.push(`${where(variant, n)}: border not included in the auto layout — set strokesIncludedInLayout = true (CSS border-box)`);
    if ('children' in n && n.type !== 'INSTANCE') n.children.forEach(visit);
  };
  visit(variant);
}
for (const [layer, weights] of Object.entries(strokeByLayer)) {
  const set_ = [...new Set(weights)];
  if (set_.length > 1) issues.border.push(`${layer}: border ${set_.join(' / ')} across variants — keep the border in every state and change only its color`);
}

// 4 states
const axes = set.type === 'COMPONENT_SET' ? set.componentPropertyDefinitions : {};
const stateAxis = axes.state?.variantOptions ?? [];
// a component with no states but its resting one (PageHeader, Card…) needs no state axis
const onlyDefault = (EXPECTED.states ?? []).every(s => s === 'default');
for (const s of EXPECTED.states ?? []) if (!(onlyDefault && !stateAxis.length) && !stateAxis.includes(s)) issues.states.push(`missing state=${s} (has: ${stateAxis.join(', ') || 'no state axis'})`);

// 5 parity — resolve colors in light and dark through a temporary instance
const toHex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
async function paintRgb(node, p) {
  const id = p.boundVariables?.color?.id;
  if (!id) return p.color;
  const v = await figma.variables.getVariableByIdAsync(id);
  return v.resolveForConsumer(node).value;
}
async function resolvedColor(node, key, part = false) {
  let p = (node[key] || []).find(x => x.type === 'SOLID' && x.visible !== false);
  // A part with no fill of its own shows code's `color` through what it holds: an icon instance's vector
  // stroke (currentColor), or the text inside a wrapper frame that carries the part's own spacing.
  if (!p && part && key === 'fills' && node.type !== 'TEXT' && 'findOne' in node) {
    const inner = node.findOne(n => n.type === 'TEXT' || n.type === 'VECTOR');
    p = inner && (inner[inner.type === 'TEXT' ? 'fills' : 'strokes'] || []).find(x => x.type === 'SOLID' && x.visible !== false);
    if (p) node = inner;
  }
  if (!p) return null;
  let c = await paintRgb(node, p);
  // composite: a state-layer child (absolute rectangle, layer opacity) blended over the root fill
  if (key === 'fills' && 'children' in node) {
    const layer = node.children.find(n => n.name === 'state-layer' && n.visible !== false);
    const lp = layer && (layer.fills || []).find(x => x.type === 'SOLID' && x.visible !== false);
    if (lp) { const o = await paintRgb(layer, lp); const a = layer.opacity * (lp.opacity ?? 1); c = { r: o.r * a + c.r * (1 - a), g: o.g * a + c.g * (1 - a), b: o.b * a + c.b * (1 - a) }; }
  }
  return toHex(c);
}
if (EXPECTED.colors && theme) {
  const frame = figma.createFrame(); frame.name = '__audit_tmp__'; frame.x = -20000;
  try {
    for (const mode of ['light', 'dark']) {
      const modeId = theme.modes.find(m => m.name === mode).modeId;
      frame.setExplicitVariableModeForCollection(theme, modeId);
      for (const [variantName, parts] of Object.entries(EXPECTED.colors)) {
        const comp = VARIANTS.find(c => c.name === variantName) ?? (variantName === '' && VARIANTS.length === 1 ? VARIANTS[0] : null);
        if (!comp) { issues.parity.push(`variant "${variantName}" not found`); continue; }
        const inst = comp.createInstance(); frame.appendChild(inst);
        const want = mode === 'light' ? parts.light : parts.dark;
        for (const [layer, props] of Object.entries(want || {})) {
          const node = layer === '(root)' ? inst : inst.findOne(n => n.name === layer);
          if (!node) { issues.parity.push(`${variantName} › ${layer}: layer missing`); continue; }
          for (const [prop, hex] of Object.entries(props)) {
            const key = prop === 'stroke' ? 'strokes' : 'fills';
            const got = await resolvedColor(node, key, layer !== '(root)');
            const close = (a, b) => a && b && [1, 3, 5].every(i => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)) <= 5);
            // A transparent border in code is still a border (border-always.md): in Figma it's a stroke in the
            // same color as the fill underneath, so it's invisible but keeps the size — accept that too.
            // A transparent fill sits on the page, so fill/page reads the same — and Figma needs a fill there to
            // cast a focus ring's spread shadow (ghost Button/IconButton focus). Accepted only bound to fill/page.
            const pagePaint = key === 'fills' && (node.fills || []).find(x => x.type === 'SOLID' && x.visible !== false);
            const onPage = !!pagePaint && varById[pagePaint.boundVariables?.color?.id]?.name === 'fill/page';
            const transparentOk = hex === 'none' && (got === null || onPage || (key === 'strokes' && close(got, await resolvedColor(node, 'fills'))));
            if (hex === 'none' ? !transparentOk : !close(got, hex)) issues.parity.push(`${mode} ${variantName} › ${layer} ${prop}: Figma ${got ?? 'none'} ≠ code ${hex}`);
          }
        }
        inst.remove();
      }
    }
  } finally { frame.remove(); }
}

// 8 layout + 9 binding
const norm = s => String(s).toLowerCase().replace(/[\s/.\-]+/g, '.').replace(/^\.|\.$/g, '');
// code token → the names a correct Figma variable can have: with or without its category prefix
// (semantic.color.fill.page → fill/page in Theme; semantic.spacing.component-l → spacing/component/l)
const accepted = target => { const rest = target.split('.').slice(1); return [norm(rest.join('.')), norm(rest.slice(1).join('.'))]; };
const FIGMA_KEY = { height: 'height', width: 'width', paddingTop: 'paddingTop', paddingRight: 'paddingRight', paddingBottom: 'paddingBottom', paddingLeft: 'paddingLeft', itemSpacing: 'itemSpacing', cornerRadius: 'topLeftRadius' };
const WEIGHT = { thin: 100, extralight: 200, light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 };
async function figmaValue(node, prop) {
  if (prop === 'fontSize') return node.fontSize;
  if (prop === 'lineHeight') return node.lineHeight?.unit === 'PIXELS' ? node.lineHeight.value : node.lineHeight?.unit === 'PERCENT' ? Math.round(node.fontSize * node.lineHeight.value) / 100 : 'auto';
  if (prop === 'fontWeight') return node.fontWeight ?? WEIGHT[norm(node.fontName?.style ?? '').replace(/\./g, '')];
  if (prop === 'fontFamily') return node.fontName?.family;
  return node[FIGMA_KEY[prop]];
}
if (EXPECTED.layout) {
  const pairs = key => key.split(', ').filter(Boolean);
  for (const [key, layers] of Object.entries(EXPECTED.layout)) {
    const variants = VARIANTS.filter(v => pairs(key).every(p => v.name.split(', ').includes(p)));
    if (!variants.length) { issues.layout.push(`no variant matches "${key}"`); continue; }
    for (const variant of variants) {
      for (const [layer, props] of Object.entries(layers)) {
        const part = layer === '(root)' ? variant : variant.findOne(n => n.name === layer);
        if (!part) { issues.layout.push(`${variant.name} › ${layer}: layer missing`); continue; }
        // typography is read off the text itself when the part is a frame wrapping it (its own spacing)
        const text = part.type === 'TEXT' ? part : ('findOne' in part ? part.findOne(n => n.type === 'TEXT') : null);
        for (const [prop, want] of Object.entries(props)) {
          const node = (prop === 'textStyle' || ['fontSize', 'lineHeight', 'fontWeight', 'fontFamily'].includes(prop)) && text ? text : part;
          if (prop === 'textStyle') {
            const style = node.textStyleId && typeof node.textStyleId === 'string' ? await figma.getStyleByIdAsync(node.textStyleId) : null;
            if (!style) issues.binding.push(`${variant.name} › ${layer}: no Text Style — code's typography is "${want}"`);
            else if (norm(style.name) !== norm(want)) issues.binding.push(`${variant.name} › ${layer}: Text Style "${style.name}" — code's typography is "${want}"`);
            continue;
          }
          const got = await figmaValue(node, prop);
          // borderOutsideLayout (see expected-styles.ts): Figma's root padding counts from the outer edge, code's
          // from inside the border — compare against code + border, within the 1px a token can't split.
          const outer = EXPECTED.borderOutsideLayout && layer === '(root)' && /^padding/.test(prop) && typeof want.value === 'number';
          const ok = outer ? typeof got === 'number' && Math.abs(got - (want.value + (typeof node.strokeWeight === 'number' ? node.strokeWeight : 1))) <= 1
            : typeof want.value === 'number' ? typeof got === 'number' && Math.abs(got - want.value) <= 0.5 : norm(got) === norm(want.value);
          if (!ok) issues.layout.push(`${variant.name} › ${layer} ${prop}: Figma ${got ?? 'none'} ≠ code ${want.value}${want.token ? ` (${want.token})` : ''}`);
          // Typography binds through the Text Style above; boxes and icons bind each property to a variable.
          if (want.figma && FIGMA_KEY[prop]) {
            const id = node.boundVariables?.[FIGMA_KEY[prop]]?.id;
            const v = id && await figma.variables.getVariableByIdAsync(id);
            if (!v) issues.binding.push(`${variant.name} › ${layer} ${prop}: not bound — code uses ${want.figma}`);
            else if (!accepted(want.figma).includes(norm(v.name))) issues.binding.push(`${variant.name} › ${layer} ${prop}: bound to ${colById[v.variableCollectionId]?.name}/${v.name} — code uses ${want.figma}`);
          }
        }
      }
    }
  }
}

const counts = Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, v.length]));
return { set: set.name, variants: VARIANTS.length, stateAxis, pass: Object.values(counts).every(n => n === 0), counts, issues: Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, v.slice(0, 25)])) };
