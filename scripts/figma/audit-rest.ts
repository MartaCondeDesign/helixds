/**
 * Figma audit without an agent — the same layout + binding checks as audit-component.js (8 and 9), run over the
 * Figma REST API so it can run on a schedule (CI) or before a release. Compares every component that has an
 * expected file (.ai/figma-expected/<Name>.json, from `pnpm figma:expected`) against its Figma component set:
 *
 *   layout     root height, padding, gap, corner radius; icon sizes; text size, line height, weight, family
 *   textStyle  each text layer uses the named Text Style code's typography comes from
 *   variables  each value is bound to the variable code's token resolves to — needs Figma's Variables REST
 *              API, which Figma only opens to Enterprise plans. Without it this check says so and is skipped
 *              (never reported as passing): run audit-component.js through the Figma MCP for it.
 *
 * Colors in dark mode also need the Variables API — they stay in audit-component.js (check 5).
 *
 * Needs FIGMA_TOKEN in the environment (a personal access token with file_content:read, and
 * file_variables:read on Enterprise). The token is read from the environment only — never written anywhere.
 * Writes .ai/figma-audit.json and exits 1 when something differs.
 *
 * Run: FIGMA_TOKEN=… pnpm figma:audit [Name,…]
 */
import fs from 'fs';
import path from 'path';
import { normalise } from './token-chain.ts';

const root = path.resolve(import.meta.dirname, '../..');
const token = process.env.FIGMA_TOKEN;
if (!token) {
  console.error('FIGMA_TOKEN is not set. Create a personal access token in Figma (Settings → Security) and run:\n  FIGMA_TOKEN=… pnpm figma:audit');
  process.exit(2);
}
const sync = JSON.parse(fs.readFileSync(path.join(root, 'contracts/figma-sync.json'), 'utf8'));
const fileKey: string = sync.figmaFileKey;
const expectedDir = path.join(root, '.ai/figma-expected');
const only = (process.argv[2] ?? '').split(',').filter(Boolean);
const names = fs.readdirSync(expectedDir).map(f => f.replace(/\.json$/, '')).filter(n => !only.length || only.includes(n));

const api = async (p: string) => {
  const r = await fetch(`https://api.figma.com/v1/${p}`, { headers: { 'X-Figma-Token': token } });
  return { status: r.status, body: r.ok ? await r.json() : await r.text() };
};

type Measured = { value: number | string; token: string | null; figma: string | null };
const FIGMA_KEY: Record<string, string> = { height: 'height', width: 'width', paddingTop: 'paddingTop', paddingRight: 'paddingRight', paddingBottom: 'paddingBottom', paddingLeft: 'paddingLeft', itemSpacing: 'itemSpacing', cornerRadius: 'topLeftRadius' };
const accepted = (target: string) => { const rest = target.split('.').slice(1); return [normalise(rest.join('.')), normalise(rest.slice(1).join('.'))]; };

function value(node: any, prop: string): number | string | undefined {
  const box = node.absoluteBoundingBox ?? {};
  switch (prop) {
    case 'height': return box.height;
    case 'width': return box.width;
    case 'cornerRadius': return node.rectangleCornerRadii?.[0] ?? node.cornerRadius ?? 0;
    case 'fontSize': return node.style?.fontSize;
    case 'lineHeight': return node.style?.lineHeightPx;
    case 'fontWeight': return node.style?.fontWeight;
    case 'fontFamily': return node.style?.fontFamily;
    default: return node[prop] ?? 0;
  }
}
const findAll = (n: any, test: (x: any) => boolean, out: any[] = []): any[] => {
  if (test(n)) out.push(n);
  for (const c of n.children ?? []) findAll(c, test, out);
  return out;
};

async function main() {
  const entries = names.map(n => ({ name: n, id: sync.components.find((c: any) => c.name === n)?.figmaNodeId as string | undefined }));
  const ids = entries.map(e => e.id).filter(Boolean);
  const nodes = await api(`files/${fileKey}/nodes?ids=${encodeURIComponent(ids.join(','))}`);
  if (nodes.status !== 200) {
    console.error(`Figma REST ${nodes.status}: ${String(nodes.body).slice(0, 200)}`);
    process.exit(2);
  }
  const vars = await api(`files/${fileKey}/variables/local`);
  const varById: Record<string, { name: string; collection: string }> = {};
  if (vars.status === 200) {
    const { variables, variableCollections } = vars.body.meta;
    for (const v of Object.values<any>(variables)) varById[v.id] = { name: v.name, collection: variableCollections[v.variableCollectionId]?.name };
  }
  const variablesNote = vars.status === 200 ? null
    : `variables not checked — Figma's Variables REST API answered ${vars.status} (it's Enterprise-only); run audit-component.js through the Figma MCP for that check`;

  const report: Record<string, { layout: string[]; textStyle: string[]; variables: string[] }> = {};
  for (const { name, id } of entries) {
    const issues = { layout: [] as string[], textStyle: [] as string[], variables: [] as string[] };
    report[name] = issues;
    if (!id) { issues.layout.push('no figmaNodeId in contracts/figma-sync.json'); continue; }
    const entry = nodes.body.nodes[id];
    const set = entry && findAll(entry.document, n => n.type === 'COMPONENT_SET')[0];
    if (!set) { issues.layout.push(`no component set under node ${id}`); continue; }
    const styles: Record<string, { name: string }> = entry.styles ?? {};
    const expected = JSON.parse(fs.readFileSync(path.join(expectedDir, `${name}.json`), 'utf8'));
    for (const [key, layers] of Object.entries<Record<string, Record<string, Measured | string>>>(expected.layout ?? {})) {
      const want = key.split(', ').filter(Boolean);
      const variants = set.children.filter((v: any) => want.every(p => v.name.split(', ').includes(p)));
      if (!variants.length) { issues.layout.push(`no variant matches "${key}"`); continue; }
      for (const variant of variants) {
        for (const [layer, props] of Object.entries(layers)) {
          const node = layer === '(root)' ? variant : findAll(variant, n => n.name === layer)[0];
          if (!node) { issues.layout.push(`${variant.name} › ${layer}: layer missing`); continue; }
          for (const [prop, w] of Object.entries(props)) {
            if (prop === 'textStyle') {
              const style = styles[node.styles?.text]?.name;
              if (!style) issues.textStyle.push(`${variant.name} › ${layer}: no Text Style — code's typography is "${w}"`);
              else if (normalise(style) !== normalise(w as string)) issues.textStyle.push(`${variant.name} › ${layer}: Text Style "${style}" — code's typography is "${w}"`);
              continue;
            }
            const m = w as Measured;
            const got = value(node, prop);
            const ok = typeof m.value === 'number' ? typeof got === 'number' && Math.abs(got - m.value) <= 0.5 : normalise(String(got)) === normalise(m.value);
            if (!ok) issues.layout.push(`${variant.name} › ${layer} ${prop}: Figma ${got ?? 'none'} ≠ code ${m.value}${m.token ? ` (${m.token})` : ''}`);
            if (variablesNote || !m.figma || !FIGMA_KEY[prop]) continue;
            const alias = node.boundVariables?.[FIGMA_KEY[prop]];
            const v = alias && varById[alias.id];
            if (!alias) issues.variables.push(`${variant.name} › ${layer} ${prop}: not bound — code uses ${m.figma}`);
            else if (v && !accepted(m.figma).includes(normalise(v.name))) issues.variables.push(`${variant.name} › ${layer} ${prop}: bound to ${v.collection}/${v.name} — code uses ${m.figma}`);
          }
        }
      }
    }
  }

  // Same finding in every state of a variant reads as one line.
  const collapse = (xs: string[]) => [...new Set(xs.map(x => x.replace(/state=[\w-]+/, 'state=*')))];
  let failing = 0;
  for (const [name, i] of Object.entries(report)) {
    const lines = [...collapse(i.layout), ...collapse(i.textStyle), ...collapse(i.variables)];
    if (lines.length) failing++;
    console.log(`${lines.length ? '✗' : '✓'} ${name}${lines.length ? ` — ${lines.length} difference(s)` : ''}`);
    for (const l of lines.slice(0, 12)) console.log(`   ${l}`);
  }
  if (variablesNote) console.log(`\n⚠ ${variablesNote}`);
  fs.writeFileSync(path.join(root, '.ai/figma-audit.json'), JSON.stringify({
    $comment: 'Generated by pnpm figma:audit (Figma REST) — do not hand-edit.',
    auditedAt: new Date().toISOString(), variablesChecked: !variablesNote, variablesNote,
    components: Object.fromEntries(Object.entries(report).map(([n, i]) => [n, { layout: collapse(i.layout), textStyle: collapse(i.textStyle), variables: collapse(i.variables) }])),
  }, null, 2) + '\n');
  console.log(`\n${Object.keys(report).length - failing} of ${Object.keys(report).length} components match code · .ai/figma-audit.json written`);
  process.exit(failing ? 1 : 0);
}
main();
