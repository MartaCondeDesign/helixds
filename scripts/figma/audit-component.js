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
 */
const SET_ID = '__SET_ID__';
const PAGE_ID = '__PAGE_ID__';
const EXPECTED = __EXPECTED__; // { states: [...], colors: { "<variant name>": { "<layer name>": { fill, stroke, text } (light), dark: {...} } } }

const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);
const set = await figma.getNodeByIdAsync(SET_ID);
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const colById = Object.fromEntries(cols.map(c => [c.id, c]));
const vars = await figma.variables.getLocalVariablesAsync();
const varById = Object.fromEntries(vars.map(v => [v.id, v]));
const theme = cols.find(c => c.name === 'Theme');
const issues = { colors: [], spacing: [], spacers: [], states: [], parity: [], border: [], fallback: [] };
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
for (const variant of set.children) walk(variant, variant);

// 6 border — per layer name: present everywhere at one weight, or nowhere
const strokeByLayer = {};
for (const variant of set.children) {
  const visit = n => {
    const key = n === variant ? '(root)' : n.name;
    const has = Array.isArray(n.strokes) && n.strokes.some(p => p.visible !== false);
    (strokeByLayer[key] ??= []).push(has ? `${n.strokeWeight}` : 'none');
    if ('children' in n && n.type !== 'INSTANCE') n.children.forEach(visit);
  };
  visit(variant);
}
for (const [layer, weights] of Object.entries(strokeByLayer)) {
  const set_ = [...new Set(weights)];
  if (set_.length > 1) issues.border.push(`${layer}: border ${set_.join(' / ')} across variants — keep the border in every state and change only its color`);
}

// 4 states
const axes = set.componentPropertyDefinitions;
const stateAxis = axes.state?.variantOptions ?? [];
for (const s of EXPECTED.states ?? []) if (!stateAxis.includes(s)) issues.states.push(`missing state=${s} (has: ${stateAxis.join(', ') || 'no state axis'})`);

// 5 parity — resolve colors in light and dark through a temporary instance
const toHex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
async function paintRgb(node, p) {
  const id = p.boundVariables?.color?.id;
  if (!id) return p.color;
  const v = await figma.variables.getVariableByIdAsync(id);
  return v.resolveForConsumer(node).value;
}
async function resolvedColor(node, key) {
  const p = (node[key] || []).find(x => x.type === 'SOLID' && x.visible !== false);
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
        const comp = set.children.find(c => c.name === variantName);
        if (!comp) { issues.parity.push(`variant "${variantName}" not found`); continue; }
        const inst = comp.createInstance(); frame.appendChild(inst);
        const want = mode === 'light' ? parts.light : parts.dark;
        for (const [layer, props] of Object.entries(want || {})) {
          const node = layer === '(root)' ? inst : inst.findOne(n => n.name === layer);
          if (!node) { issues.parity.push(`${variantName} › ${layer}: layer missing`); continue; }
          for (const [prop, hex] of Object.entries(props)) {
            const key = prop === 'stroke' ? 'strokes' : 'fills';
            const got = await resolvedColor(node, key);
            const close = (a, b) => a && b && [1, 3, 5].every(i => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)) <= 5);
            // A transparent border in code is still a border (border-always.md): in Figma it's a stroke in the
            // same color as the fill underneath, so it's invisible but keeps the size — accept that too.
            const transparentOk = hex === 'none' && (got === null || (key === 'strokes' && close(got, await resolvedColor(node, 'fills'))));
            if (hex === 'none' ? !transparentOk : !close(got, hex)) issues.parity.push(`${mode} ${variantName} › ${layer} ${prop}: Figma ${got ?? 'none'} ≠ code ${hex}`);
          }
        }
        inst.remove();
      }
    }
  } finally { frame.remove(); }
}

const counts = Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, v.length]));
return { set: set.name, variants: set.children.length, stateAxis, pass: Object.values(counts).every(n => n === 0), counts, issues: Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, v.slice(0, 25)])) };
