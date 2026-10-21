/**
 * Figma property snapshot — run through the Figma MCP `use_figma` tool (Plugin API) as is, no placeholders.
 * Returns every component set's (and every standalone component's) properties, exactly as the properties panel
 * shows them: { components: { <name>: { nodeId, type, page, properties: [{ name, type, values? }] } } }.
 * Save the returned JSON to a file and run `pnpm figma:snapshot <file>` — it writes .ai/figma-props.json and
 * regenerates .ai/maps/figma-map.md, so the code-vs-Figma listing is never hand-maintained.
 */
const NAMES = null; // or ['Modal', 'Card'] to read only those (then pnpm figma:snapshot <file> --merge)
const out = {};
for (const page of figma.root.children) {
  await page.loadAsync();
  const nodes = page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })
    .filter(n => n.type === 'COMPONENT_SET' || n.parent?.type !== 'COMPONENT_SET');
  for (const n of nodes) {
    if (page.name === 'Icons' && n.type === 'COMPONENT') continue; // the icon library itself, not a Helix component
    if (NAMES && !NAMES.includes(n.name)) continue;
    const defs = n.componentPropertyDefinitions;
    out[n.name] = {
      nodeId: n.id, type: n.type, page: page.name,
      properties: Object.entries(defs).map(([key, d]) => ({
        name: key.split('#')[0], type: d.type, ...(d.type === 'VARIANT' ? { values: d.variantOptions } : {}),
      })),
    };
  }
}
return { components: out };
