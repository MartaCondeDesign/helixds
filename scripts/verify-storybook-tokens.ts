/**
 * Does Storybook show every token? — every primitive.* and semantic.* token in packages/tokens/src/tokens.json
 * must appear on at least one Foundation/* story, as the CSS var it renders (`var(--helix-shadow-xs)` in a
 * style, or the name in the page's text).
 *
 * A token added to tokens.json shows up here until a Foundation story displays it — the gap that left
 * primitive.shadow.dark.* invisible after it was added. Stories that derive their rows from tokens.json
 * (packages/tokens/CLAUDE.md → "Adding a token", step 6) pass with no edit; a hardcoded list fails here.
 *
 * Two ways to look:
 *   - default: renders every story of apps/storybook/stories/Foundation/*.stories.tsx in Node (React server
 *     rendering) — no Storybook, no browser, a few seconds. Runs in .husky/pre-commit, so a commit that leaves a
 *     token off Storybook doesn't go through.
 *   - --url http://localhost:6006: opens each Foundation story in a running Storybook (Playwright) — what
 *     `pnpm verify:stable` runs at its end. CHROMIUM_PATH=/path/to/chrome to use another browser.
 * Run: pnpm verify:storybook-tokens [--url http://localhost:6006] [--json] [--dir <stories dir>]
 *      --dir renders another copy of the Foundation stories (scripts/storybook-tokens.test.ts uses it).
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const sbUrl = args.includes('--url') ? args[args.indexOf('--url') + 1] : undefined;
const asJson = args.includes('--json');
const storiesDir = args.includes('--dir') ? path.resolve(args[args.indexOf('--dir') + 1]!) : undefined;

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

/** Renders every Foundation story in Node and returns the HTML — what the pages show, without a browser. */
async function renderInNode(): Promise<{ html: string; count: number }> {
  const storybookDir = path.join(root, 'apps/storybook');
  // react-dom lives in the Storybook app's dependencies, not the root's.
  const { renderToStaticMarkup } = createRequire(path.join(storybookDir, 'package.json'))('react-dom/server') as typeof import('react-dom/server');
  const dir = storiesDir ?? path.join(storybookDir, 'stories/Foundation');
  let html = '';
  let count = 0;
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.stories.tsx')).sort()) {
    const mod = await import(pathToFileURL(path.join(dir, file)).href) as Record<string, { render?: (args: object, context: object) => unknown }>;
    for (const [name, story] of Object.entries(mod)) {
      if (name === 'default' || typeof story?.render !== 'function') continue;
      html += renderToStaticMarkup(story.render({}, {}) as Parameters<typeof renderToStaticMarkup>[0]);
      count++;
    }
  }
  return { html, count };
}

/** Opens every Foundation story in a running Storybook and returns the rendered HTML. */
async function renderInBrowser(url: string): Promise<{ html: string; count: number }> {
  const index = await fetch(`${url}/index.json`).then(r => r.json()).catch(() => null) as
    { entries: Record<string, { id: string; title: string; type: string }> } | null;
  if (!index) {
    console.error(`❌ Storybook isn't reachable at ${url}. Start it (pnpm sb), or drop --url to check without it.`);
    process.exit(1);
  }
  const stories = Object.values(index.entries).filter(e => e.type === 'story' && e.title.startsWith('Foundation/'));
  const { chromium } = await import('playwright');
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  let html = '';
  for (const story of stories) {
    await page.goto(`${url}/iframe.html?id=${story.id}&viewMode=story`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#storybook-root > *', { timeout: 15000 }).catch(() => {});
    html += await page.evaluate(() => document.getElementById('storybook-root')?.outerHTML ?? '');
  }
  await browser.close();
  return { html, count: stories.length };
}

async function main() {
  const { html: shown, count } = sbUrl ? await renderInBrowser(sbUrl) : await renderInNode();
  const stories = { length: count };

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
  // A category no page claims yet still shows (at the end of the file's last story), so it passes the check —
  // but it's new, so say so: someone should look at it with the design-system owner before it ships.
  const { unclaimedCategories } = await import('../apps/storybook/stories/Foundation/_tokens');
  const fresh = (['primitive', 'semantic'] as const).flatMap(layer => unclaimedCategories(layer).map(c => `${layer}.${c}`));
  if (fresh.length && !asJson) {
    console.warn(`\n⚠️  New token ${fresh.length === 1 ? 'category' : 'categories'} in tokens.json with no Storybook page of ${fresh.length === 1 ? 'its' : 'their'} own: ${fresh.join(', ')}`);
    console.warn('   Review it with the design-system owner (what it is, whether it belongs in tokens.json, which page shows it),');
    console.warn('   then add it to CLAIMED in apps/storybook/stories/Foundation/_tokens.tsx. Until then it shows at the end of the');
    console.warn('   last story of Foundation/Primitives or Foundation/Semantic.');
  }
  process.exit(missing.length ? 1 : 0);
}

main();
