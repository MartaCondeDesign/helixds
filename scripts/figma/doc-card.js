/**
 * Doc card — lay a component page out as one card (owner's layout, 2026-10-22; .ai/skills/components-to-figma.md → Phase 7b)
 * through the Figma MCP `use_figma` tool. Paste with CONFIG filled in:
 *   [{ page: 'Button', name: 'Button', description: '<the component's purpose, from its {Name}.doc.ts>', main: 'Button' }, …]
 * (one entry per page; `pnpm figma:doc-cards [Name…]` prints the list from the .doc.ts files)
 *
 * The card is the page's doc frame (a FRAME named like the component), redrawn as a vertical auto-layout:
 *   doc-header   title (Heading / 3xl / Bold, text/neutral) + description (Body / l / Regular, text/neutral/light, 720px)
 *   doc-divider  1px, border/neutral, edge to edge
 *   doc-body     the ❖ Propstar tables (and any loose component), the main set first; every other set gets
 *                its name above its table (Heading / m / Bold), so a child component (ChartTooltip…) reads as one
 * Tokens (owner's choice): fill/page, radius/2xl, padding spacing/layout/l, gaps spacing/layout/m.
 * Safe to re-run: it updates the texts and re-stacks the body; nothing outside the doc frame is touched.
 * The description is the same sentence Storybook's docs page opens with — never the conversion notes.
 */
const CONFIGS = __CONFIG__;
const V = {}; for (const v of await figma.variables.getLocalVariablesAsync()) V[v.name] = v;
const TS = Object.fromEntries((await figma.getLocalTextStylesAsync()).map(s => [s.name, s]));
const STYLE = { title: 'Heading / 3xl / Bold', description: 'Body / l / Regular', subtitle: 'Heading / m / Bold' };
for (const s of Object.values(STYLE)) await figma.loadFontAsync(TS[s].fontName);
const paint = n => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', V[n]);
const bind = (n, keys, v) => { for (const k of keys) n.setBoundVariable(k, V[v]); };
const PAD = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'], RAD = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'];
const text = (name, chars, style, color) => { const t = figma.createText(); t.name = name; t.textStyleId = TS[STYLE[style]].id; t.characters = chars; t.fills = [paint(color)]; return t; };
const vstack = (name, gap) => { const f = figma.createAutoLayout('VERTICAL'); f.name = name; f.fills = []; bind(f, ['itemSpacing'], gap); return f; };

const out = [];
for (const CONFIG of CONFIGS) {
  const page = figma.root.children.find(p => p.name.trim() === CONFIG.page.trim());
  if (!page) { out.push({ page: CONFIG.page, missing: 'no page' }); continue; }
  await page.loadAsync();
  const card = page.children.find(n => n.type === 'FRAME' && n.name.trim() === CONFIG.name);
  if (!card) { out.push({ page: page.name, missing: `no doc frame named ${CONFIG.name}` }); continue; }
  // what the body shows: every child that isn't doc chrome (old loose texts, header, divider, subtitles)
  const body0 = card.findOne(n => n.name === 'doc-body');
  const flat = body0 ? body0.children.flatMap(n => n.name.startsWith('doc-section') ? n.children.filter(k => k.type !== 'TEXT') : [n]) : card.children;
  const items = flat.filter(n => n.type !== 'TEXT' && !['doc-header', 'doc-divider', 'doc-body'].includes(n.name));
  const isMain = n => n.name === `❖ ${CONFIG.main}` || n.name === CONFIG.main;
  const order = new Map(items.map(n => [n, [n.absoluteTransform[1][2], n.absoluteTransform[0][2]]]));
  items.sort((a, b) => (isMain(b) - isMain(a)) || (order.get(a)[0] - order.get(b)[0]) || (order.get(a)[1] - order.get(b)[1]));
  const pos = { x: card.x, y: card.y };
  const keep = figma.createFrame(); page.appendChild(keep); keep.name = 'doc-card tmp'; for (const n of items) keep.appendChild(n);
  for (const n of [...card.children]) n.remove();

  card.layoutMode = 'VERTICAL'; card.primaryAxisSizingMode = 'AUTO'; card.counterAxisSizingMode = 'AUTO';
  card.fills = [paint('fill/page')]; card.strokes = []; card.clipsContent = false;
  bind(card, RAD, 'radius/2xl'); bind(card, PAD, 'spacing/layout/l'); bind(card, ['itemSpacing'], 'spacing/layout/m');

  const head = vstack('doc-header', 'spacing/s'); card.appendChild(head);
  head.appendChild(text('doc-title', CONFIG.name, 'title', 'text/neutral'));
  const d = text('doc-description', CONFIG.description, 'description', 'text/neutral/light'); head.appendChild(d); d.textAutoResize = 'HEIGHT'; d.resize(720, d.height);
  const div = figma.createFrame(); div.name = 'doc-divider'; card.appendChild(div); div.resize(100, 1); div.fills = [paint('border/neutral')]; div.layoutSizingHorizontal = 'FILL';
  const body = vstack('doc-body', 'spacing/layout/m'); card.appendChild(body);
  for (const n of items) {
    const setName = n.name.startsWith('❖ ') ? n.name.slice(2) : n.name;
    if (!isMain(n)) { const g = vstack(`doc-section ${setName}`, 'spacing/m'); body.appendChild(g); g.appendChild(text('doc-subtitle', setName, 'subtitle', 'text/neutral')); g.appendChild(n); }
    else body.appendChild(n);
  }
  keep.remove();
  card.x = pos.x; card.y = pos.y;
  out.push({ page: page.name, card: card.id, w: Math.round(card.width), h: Math.round(card.height), body: body.children.map(n => n.name) });
}
return out;
