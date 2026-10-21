/**
 * Reorder a component's Figma properties to the code's order (contracts/figma-conversion.json → propertyOrder)
 * through the Figma MCP `use_figma` tool. CONFIG = { id, variants: [...in order, state last], others: [...in order] }
 * (the "code" side of the component's Property order line in .ai/maps/figma-map.md).
 * Variants are reordered by renaming every variant. Other properties can only be reordered by re-creating them, so
 * the script first saves every layer's property bindings and every instance's chosen values (labels, toggles,
 * swapped icons — inside other components too), re-creates the properties in order, then puts both back.
 */
const CONFIG = __CONFIG__;
const node = await figma.getNodeByIdAsync(CONFIG.id); let page = node; while (page.type !== 'PAGE') page = page.parent; await figma.setCurrentPageAsync(page);
const owner = node; const comps = owner.type === 'COMPONENT_SET' ? owner.children : [owner];
const base = k => k.split('#')[0];
const defs0 = owner.componentPropertyDefinitions;
// 1 · variants: rename in order
if (owner.type === 'COMPONENT_SET' && CONFIG.variants?.length) for (const v of comps) { const p = v.variantProperties; const order = [...CONFIG.variants, ...Object.keys(p).filter(k => !CONFIG.variants.includes(k))]; v.name = order.map(k => `${k}=${p[k]}`).join(', '); }
// 2 · other properties: already in order?
const current = Object.keys(owner.componentPropertyDefinitions).filter(k => defs0[k].type !== 'VARIANT').map(base);
const wanted = [...CONFIG.others.filter(n => current.includes(n)), ...current.filter(n => !CONFIG.others.includes(n))];
let restored = 0, instances = 0;
if (JSON.stringify(current) !== JSON.stringify(wanted)) {
  const fonts = new Set(); for (const c of comps) for (const t of c.findAll(n => n.type === 'TEXT')) for (const s of t.getStyledTextSegments(['fontName'])) fonts.add(JSON.stringify(s.fontName));
  const insts = (await Promise.all(comps.map(c => c.getInstancesAsync()))).flat();
  for (const i of insts) for (const t of i.findAll(n => n.type === 'TEXT')) for (const s of t.getStyledTextSegments(['fontName'])) fonts.add(JSON.stringify(s.fontName));
  for (const f of fonts) await figma.loadFontAsync(JSON.parse(f));
  const defs = Object.fromEntries(Object.entries(defs0).filter(([, d]) => d.type !== 'VARIANT').map(([k, d]) => [base(k), { key: k, ...d }]));
  const keyToName = Object.fromEntries(Object.values(defs).map(d => [d.key, base(d.key)]));
  // bindings, by layer
  const refs = []; for (const c of comps) for (const n of [c, ...c.findAll(() => true)]) { const r = n.componentPropertyReferences; if (r && Object.keys(r).length) refs.push([n, Object.fromEntries(Object.entries(r).map(([f, k]) => [f, keyToName[k] ?? k]))]); }
  // instance values
  const values = insts.map(i => [i, Object.fromEntries(Object.entries(i.componentProperties).filter(([k, p]) => p.type !== 'VARIANT' && keyToName[k]).map(([k, p]) => [keyToName[k], p.value]))]);
  instances = insts.length;
  for (const d of Object.values(defs)) owner.deleteComponentProperty(d.key);
  const newKey = {};
  for (const n of wanted) { const d = defs[n]; newKey[n] = owner.addComponentProperty(n, d.type, d.defaultValue, d.preferredValues ? { preferredValues: d.preferredValues } : undefined); }
  for (const [n, r] of refs) { try { n.componentPropertyReferences = Object.fromEntries(Object.entries(r).map(([f, name]) => [f, newKey[name] ?? name])); restored++; } catch (e) {} }
  for (const [i, v] of values) { const set = Object.fromEntries(Object.entries(v).filter(([n, val]) => newKey[n] && val !== defs[n].defaultValue).map(([n, val]) => [newKey[n], val])); if (Object.keys(set).length) try { i.setProperties(set); } catch (e) {} }
}
return { order: Object.entries(owner.componentPropertyDefinitions).map(([k, d]) => base(k) + (d.type === 'VARIANT' ? '*' : '')).join(', '), restored, instances };
