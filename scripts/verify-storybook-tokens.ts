/**
 * Does Storybook show every token? — every primitive.* and semantic.* token in packages/tokens/src/tokens.json
 * must appear on at least one Foundation/* story, as the CSS var it renders (`var(--helix-shadow-xs)` in a
 * style, or the name in the page's text).
 *
 * A token added to tokens.json shows up here until a Foundation story displays it — the gap that left
 * primitive.shadow.dark.* invisible after it was added. Stories that derive their rows from tokens.json
 * (packages/tokens/CLAUDE.md → "Adding a token", step 6) pass with no edit; a hardcoded list fails here.
 *
 * Needs a running Storybook (pnpm sb). Also runs at the end of `pnpm verify:stable`.
 * Run: pnpm verify:storybook-tokens [--url http://localhost:6006] [--json]
 *      CHROMIUM_PATH=/path/to/chrome to use a browser other than Playwright's own.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const sbUrl = args.includes('--url') ? args[args.indexOf('--url') + 1] : 'http://localhost:6006';
const asJson = args.includes('--json');

type Node = Record<string, unknown>;
const tokens = JSON.parse(fs.readFileSync(path.join(root, 'packages/tokens/src/tokens.json'), 'utf8')) as Node;

/** Every primitive/semantic leaf as [dotted path, CSS var name] — the build's name rule: drop `semantic.`, keep `primitive-`. */
function expected(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const walk = (node: unknown, at: string[]) => {
    if (!node || typeof node !== 'object') return;
    if ('$value' in (node as Node)) {
      const name = at[0] === 'semantic' ? at.slice(1) : at;
      out.push([at.join('.'), `--helix-${name.join('-')}`]);
      return;
    }
    for (const [k, v] of Object.entries(node as Node)) if (!k.startsWith('$')) walk(v, [...at, k]);
  };
  walk(tokens.primitive, ['primitive']);
  walk(tokens.semantic, ['semantic']);
  return out;
}

async function main() {
  const index = await fetch(`${sbUrl}/index.json`).then(r => r.json()).catch(() => null) as
    { entries: Record<string, { id: string; title: string; type: string }> } | null;
  if (!index) {
    console.error(`❌ Storybook isn't reachable at ${sbUrl}. Start it (pnpm sb) or pass --url.`);
    process.exit(1);
  }
  const stories = Object.values(index.entries).filter(e => e.type === 'story' && e.title.startsWith('Foundation/'));

  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  let shown = '';
  for (const story of stories) {
    await page.goto(`${sbUrl}/iframe.html?id=${story.id}&viewMode=story`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#storybook-root > *', { timeout: 15000 }).catch(() => {});
    shown += await page.evaluate(() => document.getElementById('storybook-root')?.outerHTML ?? '');
  }
  await browser.close();

  // A var counts when the page names it whole (not as the prefix of a longer var); a composite token
  // (typography) counts when any of its sub-property vars is shown.
  const names = new Set(shown.match(/--helix-[\w-]+/g) ?? []);
  const covered = ([, cssVar]: [string, string]) => names.has(cssVar) || [...names].some(n => n.startsWith(`${cssVar}-`) && /-(fontSize|fontWeight|fontFamily|lineHeight|letterSpacing)$/.test(n));
  const missing = expected().filter(t => !covered(t));

  const byCategory = new Map<string, string[]>();
  for (const [dotted] of missing) {
    const cat = dotted.split('.').slice(0, 2).join('.');
    byCategory.set(cat, [...(byCategory.get(cat) ?? []), dotted.split('.').slice(2).join('.')]);
  }

  if (asJson) {
    console.log(JSON.stringify({ stories: stories.length, total: expected().length, missing: Object.fromEntries(byCategory) }, null, 2));
  } else if (!missing.length) {
    console.log(`✅ verify:storybook-tokens — all ${expected().length} primitive and semantic tokens appear on the ${stories.length} Foundation stories`);
  } else {
    console.error(`❌ verify:storybook-tokens — ${missing.length} of ${expected().length} tokens appear on no Foundation story (${stories.length} checked):`);
    for (const [cat, keys] of byCategory) console.error(`   ${cat} (${keys.length}): ${keys.join(', ')}`);
    console.error('\nShow them on the matching Foundation story, reading the list from tokens.json (apps/storybook/CLAUDE.md).');
  }
  process.exit(missing.length ? 1 : 0);
}

main();
