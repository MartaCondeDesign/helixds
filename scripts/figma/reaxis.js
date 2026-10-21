/**
 * Pattern rebuild — "re-axis" a Figma component set to the conversion standard (contracts/figma-conversion.json)
 * through the Figma MCP `use_figma` tool. Paste this file with CONFIG filled in. It never clones a component and
 * keeps every variant that survives, so instances elsewhere in the file keep working:
 *   - map(oldProps) → the variant's new props (object) or null to delete it (refused if it has instances)
 *   - create: new variants, each { props, from: oldProps predicate, transform(node, V, paint) } — built from a
 *     detached instance of `from` and appended to the set
 *   - renameProps: { oldName: newName } for TEXT / BOOLEAN properties; swaps: [{ layer, name }] adds an
 *     INSTANCE_SWAP `name` bound to the instance inside `layer`
 *   - every focus/open variant gets the focus-ring clip rule (ring layer clips, frames around it don't)
 * Returns { removed, renamed, created, defs }.
 */
const CONFIG = __CONFIG__;
const set = await figma.getNodeByIdAsync(CONFIG.setId); let page = set; while (page.type !== 'PAGE') page = page.parent; await figma.setCurrentPageAsync(page);
for (const f of [['Inter', 'Regular'], ['Inter', 'Medium'], ['Inter', 'Semi Bold'], ['Inter', 'Bold']]) await figma.loadFontAsync({ family: f[0], style: f[1] }).catch(() => {});
const vars = await figma.variables.getLocalVariablesAsync(); const V = n => { const v = vars.find(x => x.name === n); if (!v) throw new Error('no var ' + n); return v; };
const paint = (node, v) => [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: v.resolveForConsumer(node).value }, 'color', v)];
const nameOf = p => CONFIG.axes.map(a => `${a}=${p[a]}`).join(', ');
const olds = set.children.map(v => ({ v, p: { ...v.variantProperties } }));
const removed = [], renamed = [], created = [];
for (const { v, p } of olds) {
  const np = CONFIG.map(p);
  if (!np) { if ((await v.getInstancesAsync()).length) throw new Error(`${v.name} has instances — map it instead of deleting`); removed.push(v.name); v.remove(); continue; }
  v.name = nameOf(np); renamed.push(v.name);
}
for (const c of CONFIG.create ?? []) {
  const src = olds.find(o => o.v.parent && c.from(o.p, o.v.variantProperties))?.v;
  if (!src) throw new Error('no source for ' + JSON.stringify(c.props));
  const f = src.createInstance().detachInstance();
  if (c.transform) await c.transform(f, V, paint);
  const comp = figma.createComponentFromNode(f); comp.name = nameOf(c.props); set.appendChild(comp); created.push(comp.name);
}
const defs = () => set.componentPropertyDefinitions;
// a detached copy loses its property bindings: copy them, layer by layer, from a sibling that survived
const sibling = set.children.find(v => !created.includes(v.name));
for (const v of set.children.filter(v => created.includes(v.name))) for (const n of [v, ...v.findAll(() => true)]) {
  const twin = n === v ? sibling : sibling.findOne(x => x.name === n.name && x.type === n.type);
  if (twin?.componentPropertyReferences && Object.keys(twin.componentPropertyReferences).length) n.componentPropertyReferences = { ...twin.componentPropertyReferences };
}
for (const [from, to] of Object.entries(CONFIG.renameProps ?? {})) { const k = Object.keys(defs()).find(k => k.split('#')[0] === from); if (k) set.editComponentProperty(k, { name: to }); }
for (const s of CONFIG.swaps ?? []) {
  const inst = set.children.map(v => v.findOne(n => n.name === s.layer)).find(Boolean);
  const target = inst?.type === 'INSTANCE' ? inst : inst?.findOne(n => n.type === 'INSTANCE');
  if (!target) continue;
  let key = Object.keys(defs()).find(k => k.split('#')[0] === s.name);
  if (!key) key = set.addComponentProperty(s.name, 'INSTANCE_SWAP', target.mainComponent.id);
  for (const v of set.children) { const l = v.findOne(n => n.name === s.layer); const i = l?.type === 'INSTANCE' ? l : l?.findOne(n => n.type === 'INSTANCE'); if (i) i.componentPropertyReferences = { ...(i.componentPropertyReferences ?? {}), mainComponent: key }; }
}
const hasRing = n => (n.effects || []).some(e => e.type === 'DROP_SHADOW' && e.visible !== false && (e.spread || 0) > 0);
for (const v of set.children) { const st = v.variantProperties?.state; if (st !== 'focus' && st !== 'open') continue;
  const rings = [v, ...v.findAll(n => 'clipsContent' in n && n.type !== 'INSTANCE')].filter(hasRing);
  for (const r of rings) { r.clipsContent = true; for (let a = r.parent; a && a !== v.parent; a = a.parent) { a.clipsContent = false; if (a === v) break; } } }
if (CONFIG.description) set.description = CONFIG.description;
return { removed: removed.length, renamed: renamed.length, created, n: set.children.length, defs: Object.entries(defs()).map(([k, d]) => k.split('#')[0] + ':' + d.type + (d.variantOptions ? '=' + d.variantOptions.join('/') : '')) };
