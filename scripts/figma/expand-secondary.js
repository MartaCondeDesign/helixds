/**
 * Draw a set's secondary toggles at every size and state (contracts/figma-conversion.json → variants.secondary,
 * owner's decision 2026-10-21) — run through the Figma MCP `use_figma` tool with CONFIG filled in:
 *   { id, order: [axes in variant-name order], axes: [{ axis, values: [non-default values], base: 'default value' }],
 *     loadingDisables: bool, states: ['default', …] }
 * For each axis value, the existing reference pair (axis=value vs axis=base, every other axis at the first
 * variant that has both) gives the delta — which layers' size/visibility change, which layers appear or go —
 * and every variant with axis=base gets a copy with axis=value and that delta, keeping its own colors and state.
 * Loading where code disables the control (loadingDisables) is only drawn at state=default, enabled, valid.
 */
const CONFIG = __CONFIG__;
const set = await figma.getNodeByIdAsync(CONFIG.id); let page = set; while (page.type !== 'PAGE') page = page.parent; await figma.setCurrentPageAsync(page);
const fonts = new Set(); for (const t of set.findAll(n => n.type === 'TEXT')) for (const s of t.getStyledTextSegments(['fontName'])) fonts.add(JSON.stringify(s.fontName));
for (const f of fonts) await figma.loadFontAsync(JSON.parse(f));
const nameOf = p => CONFIG.order.map(k => `${k}=${p[k]}`).join(', ');
const byName = () => Object.fromEntries(set.children.map(v => [v.name, v]));
// path of a node inside its variant: names, with an index among same-named siblings
const pathOf = (n, root) => { const parts = []; while (n !== root) { const sib = n.parent.children.filter(c => c.name === n.name); parts.unshift(n.name + '#' + sib.indexOf(n)); n = n.parent; } return parts.join('/'); };
const index = root => Object.fromEntries([root, ...root.findAll(() => true)].map(n => [n === root ? '' : pathOf(n, root), n]));
const LAYOUT = ['visible', 'layoutSizingHorizontal', 'layoutSizingVertical', 'primaryAxisSizingMode', 'counterAxisSizingMode'];
const val = (n, k) => { try { return n[k]; } catch (e) { return undefined; } };
function deltaOf(a, b) {
  const A = index(a), B = index(b), d = { props: [], add: [], remove: [] };
  for (const [p, nb] of Object.entries(B)) {
    const na = A[p];
    if (!na) { d.add.push({ path: p, node: nb }); continue; }
    for (const k of LAYOUT) if (val(na, k) !== undefined && val(na, k) !== val(nb, k)) d.props.push({ path: p, k, v: val(nb, k) });
    // a width only travels when it's fixed (fullWidth); a hugging layer's width just follows its content
    if (Math.abs(na.width - nb.width) > 0.5 && val(nb, 'layoutSizingHorizontal') === 'FIXED') d.props.push({ path: p, k: 'width', v: nb.width });
  }
  for (const p of Object.keys(A)) if (!B[p]) d.remove.push(p);
  return d;
}
function apply(comp, d) {
  const I = index(comp);
  for (const p of d.remove) I[p]?.remove();
  for (const { path, node } of d.add) {
    const parentPath = path.split('/').slice(0, -1).join('/');
    const parent = index(comp)[parentPath]; if (!parent || !('appendChild' in parent)) continue;
    const at = node.parent.children.indexOf(node);
    parent.insertChild(Math.min(at, parent.children.length), node.clone());
  }
  const J = index(comp);
  for (const { path, k, v } of d.props) { const n = J[path]; if (!n) continue; try { if (k === 'width') n.resize(v, n.height); else n[k] = v; } catch (e) {} }
}
const copyOf = (src, props) => {
  const refs = Object.entries(index(src)).filter(([, n]) => n.componentPropertyReferences && Object.keys(n.componentPropertyReferences).length).map(([p, n]) => [p, n.componentPropertyReferences]);
  const inst = src.createInstance(); page.appendChild(inst);
  const comp = figma.createComponentFromNode(inst.detachInstance()); comp.name = nameOf(props); set.appendChild(comp);
  const I = index(comp); for (const [p, r] of refs) if (p && I[p]) try { I[p].componentPropertyReferences = r; } catch (e) {}
  return comp;
};
const report = [];
for (const { axis, values, base } of CONFIG.axes) for (const value of values) {
  const all = set.children.map(v => v.variantProperties);
  const refP = all.find(p => p[axis] === value && byName()[nameOf({ ...p, [axis]: base })] && (!p.state || p.state === 'default') && p.disabled !== 'true' && p.invalid !== 'true' && Object.entries(p).every(([k, x]) => k === axis || !CONFIG.axes.some(a => a.axis === k) || x === CONFIG.axes.find(a => a.axis === k).base));
  if (!refP) { report.push(`${axis}=${value}: no reference pair`); continue; }
  const m = byName(); const d = deltaOf(m[nameOf({ ...refP, [axis]: base })], m[nameOf(refP)]);
  let made = 0;
  for (const v of [...set.children]) {
    const p = v.variantProperties; if (p[axis] !== base) continue;
    const t = { ...p, [axis]: value };
    if (byName()[nameOf(t)]) continue;
    const loading = t.isLoading === 'true' && CONFIG.loadingDisables;
    if (loading && ((t.state && t.state !== 'default') || t.disabled === 'true' || t.invalid === 'true')) continue;
    if (axis === 'isLoading' && v.variantProperties.isLoading !== base) continue;
    apply(copyOf(v, t), d); made++;
  }
  report.push(`${axis}=${value}: ${made} (delta ${d.props.length} props, +${d.add.length}, -${d.remove.length})`);
}
return { report, total: set.children.length };
