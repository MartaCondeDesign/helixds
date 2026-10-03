/**
 * Property table — reproduces Propstar's "Create property table"
 * (https://www.figma.com/community/plugin/1116018586739867857) through the Figma MCP `use_figma` tool.
 * Paste this file's contents as the `code` argument with PAGE_ID / SET_ID / BOOLEANS filled in.
 *
 * Layout (same as Propstar's output):
 *   "❖ {Set name}" — a GRID frame, no fill, no gaps.
 *     column 0       one label per value of the FIRST variant axis (rows)
 *     header rows    one per column level: boolean groups first ("icon: False" / "icon: True"), then every
 *                    other variant axis in order; non-leaf levels get a "Bracket" under their label
 *     cells          "Instance" frames, 24px padding, centered content, 1px dashed #9747FF border;
 *                    cells holding an instance also get a 3% #9747FF fill
 *   The real COMPONENT_SET sits absolutely positioned over the cells where every boolean has its default
 *   value — its variants are moved so each one is centered in its own cell. Every other cell holds an
 *   INSTANCE of the matching variant with those booleans flipped.
 *   Labels: Inter Medium 12, #9747FF (Propstar's own annotation color — documentation chrome, not part of
 *   the component, so it isn't bound to a design token).
 */
const PAGE_ID = '__PAGE_ID__';
const SET_ID = '__SET_ID__';
const BOOLEANS = __BOOLEANS__; // e.g. ['icon'] — boolean component properties to expand into column groups

const PURPLE = { r: 151 / 255, g: 71 / 255, b: 1 };
const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
const set = await figma.getNodeByIdAsync(SET_ID);
const defs = set.componentPropertyDefinitions;
const axes = Object.entries(defs).filter(([, d]) => d.type === 'VARIANT').map(([k, d]) => [k, d.variantOptions]);
const boolKeys = BOOLEANS.map(b => Object.keys(defs).find(k => defs[k].type === 'BOOLEAN' && k.split('#')[0] === b)).filter(Boolean);
const [rowAxis, ...colAxes] = axes;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// Column tuples: boolean combinations (outermost) x remaining variant axes
// each boolean's default value comes first — the real set sits over those cells
const boolCombos = boolKeys.reduce((acc, k) => acc.flatMap(a => [{ ...a, [k]: defs[k].defaultValue }, { ...a, [k]: !defs[k].defaultValue }]), [{}]);
const isDefault = col => boolKeys.every(k => col.bools[k] === defs[k].defaultValue);
const variantCombos = colAxes.reduce((acc, [k, vals]) => acc.flatMap(a => vals.map(v => ({ ...a, [k]: v }))), [{}]);
const columns = boolCombos.flatMap(b => variantCombos.map(v => ({ bools: b, variant: v })));
const variantOf = (rowVal, v) => set.children.find(c => {
  const vp = c.variantProperties;
  return vp[rowAxis[0]] === rowVal && Object.entries(v).every(([k, x]) => vp[k] === x);
});

// Cell sizes: content + 2 x 24px padding, measured with the column's booleans on (a shown part grows the cell)
const measure = (comp, bools) => { if (isDefault({ bools })) return [comp.width, comp.height]; const i = comp.createInstance(); i.setProperties(bools); const r = [i.width, i.height]; i.remove(); return r; };
const colW = columns.map(col => Math.max(...rowAxis[1].map(r => { const c = variantOf(r, col.variant); return c ? measure(c, col.bools)[0] : 0; })) + 48);
const rowH = rowAxis[1].map(r => Math.max(...columns.map(col => { const c = variantOf(r, col.variant); return c ? measure(c, col.bools)[1] : 0; })) + 48);

// Header levels
const levels = [...boolKeys.map(k => ({ kind: 'bool', key: k })), ...colAxes.map(([k]) => ({ kind: 'variant', key: k }))];
const HEADER_GROUP = 42, HEADER_LEAF = 25;
const headerH = levels.map((l, i) => (i === levels.length - 1 ? HEADER_LEAF : HEADER_GROUP));

const table = figma.createFrame();
table.name = `❖ ${set.name}`;
table.fills = []; table.clipsContent = false;
table.layoutMode = 'GRID';
table.gridRowCount = levels.length + rowAxis[1].length;
table.gridColumnCount = 1 + columns.length;
table.gridRowGap = 0; table.gridColumnGap = 0;

const mkText = s => { const t = figma.createText(); t.fontName = { family: 'Inter', style: 'Medium' }; t.fontSize = 12; t.characters = s; t.fills = [{ type: 'SOLID', color: PURPLE }]; return t; };
const place = (node, row, col, colSpan = 1, fill = false) => {
  table.appendChildAt(node, row, col);
  if (colSpan > 1) node.gridColumnSpan = colSpan;
  if (fill) { node.layoutSizingHorizontal = 'FILL'; node.layoutSizingVertical = 'FILL'; } // stretch across the spanned track(s)
};

// Row labels (column 0)
let labelColW = 0;
rowAxis[1].forEach((val, i) => {
  const f = figma.createAutoLayout('HORIZONTAL', { name: 'Label' }); f.fills = [];
  f.paddingTop = 10; f.paddingBottom = 10; f.paddingRight = 10; f.paddingLeft = 0;
  f.primaryAxisAlignItems = 'MAX'; f.counterAxisAlignItems = 'CENTER';
  f.appendChild(mkText(val));
  labelColW = Math.max(labelColW, f.width); // measured while still hugging its text
  place(f, levels.length + i, 0, 1, true);
});

// Column headers
levels.forEach((lvl, li) => {
  const isLeaf = li === levels.length - 1;
  let c = 0;
  while (c < columns.length) {
    const key = lvl.kind === 'bool' ? lvl.key : lvl.key;
    const valOf = col => (lvl.kind === 'bool' ? col.bools[key] : col.variant[key]);
    // group = consecutive columns sharing this level's value and every outer level's value
    const same = (a, b) => levels.slice(0, li + 1).every(l => (l.kind === 'bool' ? a.bools[l.key] === b.bools[l.key] : a.variant[l.key] === b.variant[l.key]));
    let span = 1; while (c + span < columns.length && same(columns[c], columns[c + span])) span++;
    const v = valOf(columns[c]);
    const text = lvl.kind === 'bool' ? `${key.split('#')[0]}: ${cap(String(v))}` : String(v);
    const f = figma.createAutoLayout('VERTICAL', { name: 'Label' }); f.fills = [];
    f.primaryAxisAlignItems = 'MAX'; f.counterAxisAlignItems = 'CENTER';
    f.paddingLeft = 10; f.paddingRight = 10; f.paddingTop = 0; f.paddingBottom = isLeaf ? 10 : 0;
    f.itemSpacing = isLeaf ? 0 : 13;
    f.appendChild(mkText(text));
    if (!isLeaf) {
      const br = figma.createFrame(); br.name = 'Bracket'; br.fills = [];
      br.strokes = [{ type: 'SOLID', color: PURPLE }]; br.strokeWeight = 1;
      br.strokeTopWeight = 1; br.strokeLeftWeight = 1; br.strokeRightWeight = 1; br.strokeBottomWeight = 0;
      br.resize(10, 14);
      f.appendChild(br); br.layoutSizingHorizontal = 'FILL';
    }
    place(f, li, 1 + c, span, true);
    c += span;
  }
});

// Cells
const instances = [];
rowAxis[1].forEach((rowVal, ri) => columns.forEach((col, ci) => {
  const cell = figma.createAutoLayout('HORIZONTAL', { name: 'Instance' });
  cell.paddingTop = cell.paddingBottom = cell.paddingLeft = cell.paddingRight = 24;
  cell.primaryAxisAlignItems = 'CENTER'; cell.counterAxisAlignItems = 'CENTER';
  cell.strokes = [{ type: 'SOLID', color: PURPLE }]; cell.strokeWeight = 1; cell.dashPattern = [10, 5];
  cell.fills = [];
  const comp = variantOf(rowVal, col.variant);
  if (comp && !isDefault(col)) {
    const inst = comp.createInstance(); cell.appendChild(inst);
    inst.setProperties(col.bools);
    cell.fills = [{ type: 'SOLID', color: PURPLE, opacity: 0.03 }];
    instances.push(inst.id);
  }
  place(cell, levels.length + ri, 1 + ci, 1, true);
}));

// Fixed track sizes, like Propstar's output
[...headerH, ...rowH].forEach((v, i) => { table.gridRowSizes[i].type = 'FIXED'; table.gridRowSizes[i].value = v; });
[labelColW, ...colW].forEach((v, i) => { table.gridColumnSizes[i].type = 'FIXED'; table.gridColumnSizes[i].value = v; });
table.primaryAxisSizingMode = 'AUTO'; table.counterAxisSizingMode = 'AUTO'; // hug the tracks

// The real set over the default (all-false) cells, each variant centered in its own cell
const parent = set.parent;
const at = { x: set.x, y: set.y, index: parent.children.indexOf(set) };
parent.insertChild(Math.max(at.index, 0), table);
table.x = at.x; table.y = at.y;
table.appendChild(set);
set.layoutPositioning = 'ABSOLUTE';
const defaultCols = columns.map((c, i) => [c, i]).filter(([c]) => isDefault(c));
const colX = i => labelColW + colW.slice(0, i).reduce((a, b) => a + b, 0);
const rowY = i => headerH.reduce((a, b) => a + b, 0) + rowH.slice(0, i).reduce((a, b) => a + b, 0);
const x0 = colX(defaultCols[0][1]);
set.x = x0; set.y = rowY(0);
rowAxis[1].forEach((rowVal, ri) => defaultCols.forEach(([col, ci]) => {
  const comp = variantOf(rowVal, col.variant); if (!comp) return;
  comp.x = colX(ci) - x0 + (colW[ci] - comp.width) / 2;
  comp.y = rowY(ri) - rowY(0) + (rowH[ri] - comp.height) / 2;
}));
set.resize(defaultCols.reduce((a, [, ci]) => a + colW[ci], 0), rowH.reduce((a, b) => a + b, 0));

if (parent.type === 'FRAME' && parent.layoutMode === 'NONE') parent.resize(Math.max(parent.width, table.x + table.width), table.y + table.height);
await table.screenshot({ scale: 1.5 });
return { tableId: table.id, rows: rowAxis[1].length, columns: columns.length, instances: instances.length };
