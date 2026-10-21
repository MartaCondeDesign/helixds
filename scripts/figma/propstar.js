/**
 * Propstar table — lay a component set out as rows × columns (contracts/figma-conversion.json → variants.propstar)
 * through the Figma MCP `use_figma` tool. Paste with CONFIG filled in:
 *   { setId, rows: [{ label, props }], cols: [{ label, props }], groups: [[label, span]], base: { ...props } }
 * A cell shows the variant whose props = base + row.props + col.props; cells with no such variant stay empty.
 * Replaces the set's current table (if any) in place, resizes the page's doc frame and the set to fit.
 */
const CONFIG = __CONFIG__;
const set = await figma.getNodeByIdAsync(CONFIG.setId); let page = set; while (page.type !== 'PAGE') page = page.parent; await figma.setCurrentPageAsync(page);
let doc = set.parent, x = set.x, y = set.y;
if (doc.name?.startsWith('❖')) { const t = doc; doc = t.parent; x = t.x; y = t.y; doc.appendChild(set); t.remove(); }
const PURPLE = { r: 151 / 255, g: 71 / 255, b: 1 }; await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
const vOf = (r, c) => set.children.find(v => Object.entries({ ...CONFIG.base, ...r.props, ...c.props }).every(([k, x]) => v.variantProperties[k] === x));
const rows = CONFIG.rows, cols = CONFIG.cols, groups = CONFIG.groups ?? [];
// a variant's drawn extent: its own box plus any absolute layer that hangs outside it (an open Select's listbox)
const ext = v => { if (!v) return { w: 0, h: 0 }; let w = v.width, h = v.height; const o = v.absoluteTransform; for (const n of v.findAll(n => n.layoutPositioning === 'ABSOLUTE')) { const t = n.absoluteTransform; w = Math.max(w, t[0][2] - o[0][2] + n.width); h = Math.max(h, t[1][2] - o[1][2] + n.height); } return { w, h }; };
const colW = cols.map(c => Math.max(0, ...rows.map(r => ext(vOf(r, c)).w)) + 48), rowH = rows.map(r => Math.max(0, ...cols.map(c => ext(vOf(r, c)).h)) + 48);
const headerH = groups.length ? [42, 25] : [25];
const table = figma.createFrame(); table.name = '❖ ' + set.name; table.fills = []; table.clipsContent = false; table.layoutMode = 'GRID';
table.gridRowCount = headerH.length + rows.length; table.gridColumnCount = 1 + cols.length; table.gridRowGap = 0; table.gridColumnGap = 0;
const mk = s => { const t = figma.createText(); t.fontName = { family: 'Inter', style: 'Medium' }; t.fontSize = 12; t.characters = s; t.fills = [{ type: 'SOLID', color: PURPLE }]; return t; };
const place = (n, r, c, span = 1) => { table.appendChildAt(n, r, c); if (span > 1) n.gridColumnSpan = span; n.layoutSizingHorizontal = 'FILL'; n.layoutSizingVertical = 'FILL'; };
let labelW = 0; rows.forEach((r, i) => { const f = figma.createAutoLayout('HORIZONTAL', { name: 'Label' }); f.fills = []; f.paddingTop = f.paddingBottom = f.paddingRight = 10; f.primaryAxisAlignItems = 'MAX'; f.counterAxisAlignItems = 'CENTER'; f.appendChild(mk(r.label)); labelW = Math.max(labelW, f.width); place(f, headerH.length + i, 0); });
let gc = 0; for (const [g, span] of groups) { const f = figma.createAutoLayout('VERTICAL', { name: 'Label' }); f.fills = []; f.primaryAxisAlignItems = 'MAX'; f.counterAxisAlignItems = 'CENTER'; f.paddingLeft = f.paddingRight = 10; f.itemSpacing = 13; f.appendChild(mk(g)); const br = figma.createFrame(); br.name = 'Bracket'; br.fills = []; br.strokes = [{ type: 'SOLID', color: PURPLE }]; br.strokeTopWeight = 1; br.strokeLeftWeight = 1; br.strokeRightWeight = 1; br.strokeBottomWeight = 0; br.resize(10, 14); f.appendChild(br); br.layoutSizingHorizontal = 'FILL'; place(f, 0, 1 + gc, span); gc += span; }
cols.forEach((c, i) => { const f = figma.createAutoLayout('VERTICAL', { name: 'Label' }); f.fills = []; f.primaryAxisAlignItems = 'MAX'; f.counterAxisAlignItems = 'CENTER'; f.paddingLeft = f.paddingRight = 10; f.paddingBottom = 10; f.appendChild(mk(c.label)); colW[i] = Math.max(colW[i], f.width); place(f, headerH.length - 1, 1 + i); }); // a column is never narrower than its label
rows.forEach((r, ri) => cols.forEach((c, ci) => { const cell = figma.createAutoLayout('HORIZONTAL', { name: 'Instance' }); cell.paddingTop = cell.paddingBottom = cell.paddingLeft = cell.paddingRight = 24; cell.strokes = vOf(r, c) ? [{ type: 'SOLID', color: PURPLE }] : []; cell.strokeWeight = 1; cell.dashPattern = [10, 5]; cell.fills = []; place(cell, headerH.length + ri, 1 + ci); }));
[...headerH, ...rowH].forEach((v, i) => { table.gridRowSizes[i].type = 'FIXED'; table.gridRowSizes[i].value = v; }); [labelW, ...colW].forEach((v, i) => { table.gridColumnSizes[i].type = 'FIXED'; table.gridColumnSizes[i].value = v; });
table.primaryAxisSizingMode = 'AUTO'; table.counterAxisSizingMode = 'AUTO';
doc.insertChild(doc.children.indexOf(set), table); table.x = x; table.y = y; table.appendChild(set); set.layoutPositioning = 'ABSOLUTE';
const colX = i => labelW + colW.slice(0, i).reduce((a, b) => a + b, 0), rowY = i => headerH.reduce((a, b) => a + b, 0) + rowH.slice(0, i).reduce((a, b) => a + b, 0);
set.x = colX(0); set.y = rowY(0);
rows.forEach((r, ri) => cols.forEach((c, ci) => { const v = vOf(r, c); if (!v) return; v.x = colX(ci) - colX(0) + 24; v.y = rowY(ri) - rowY(0) + (rowH[ri] - ext(v).h) / 2; }));
set.resize(colW.reduce((a, b) => a + b, 0), rowH.reduce((a, b) => a + b, 0));
const unplaced = set.children.filter(v => !rows.some(r => cols.some(c => vOf(r, c) === v))).map(v => v.name);
if (doc.type === 'FRAME') { const texts = doc.children.filter(n => n.type === 'TEXT').sort((a, b) => a.y - b.y); const d = texts[1]; if (d && set.description) { for (const s of d.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(s.fontName); d.characters = set.description; } doc.resize(Math.max(table.x + table.width, ...texts.map(t => t.width)), table.y + table.height); }
return { table: table.id, unplaced };
