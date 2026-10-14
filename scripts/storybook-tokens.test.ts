// Tests that Storybook's Foundation pages really show tokens.json — not just that the coverage check passes:
//   1. names    — the CSS var _tokens.tsx computes for every token exists in the built dist/helix.css
//   2. values   — the value a page prints for every token equals what the CSS resolves to (light theme), and
//                 a semantic shadow resolves to its primitive.shadow.dark twin in dark
//   3. pages    — every Foundation story renders, every var() it writes by hand exists, and a category no
//                 story claims shows at the end of the file's last story
//   4. the gate — verify:storybook-tokens fails, naming the token, when a story stops showing one (sabotage on a
//                 copy of the stories), and passes on the real ones
//   5. changelog — a squash-merge body's "* subject" lines become that entry's changes
// Run: pnpm test:storybook-tokens (builds the tokens first). Runs in pre-commit.
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { categoriesOf, OtherTokens, resolvedCss, tokenRows } from '../apps/storybook/stories/Foundation/_tokens';
import { resolveThemes } from '../packages/tokens/test/css-themes.mjs';
import { squashedChanges } from './changelog-lib';

const root = path.resolve(import.meta.dirname, '..');
const storybook = path.join(root, 'apps/storybook');
const fromStorybook = createRequire(path.join(storybook, 'package.json'));
const { renderToStaticMarkup } = fromStorybook('react-dom/server') as typeof import('react-dom/server');
const { createElement } = fromStorybook('react') as typeof import('react');
const css = fs.readFileSync(path.join(root, 'packages/tokens/dist/helix.css'), 'utf8');
const { light, dark } = resolveThemes(css);

const allRows = (['primitive', 'semantic'] as const).flatMap(layer => categoriesOf(layer).flatMap(cat => tokenRows(`${layer}.${cat}`)));
const plain = allRows.filter(row => row.token.$type !== 'typography'); // a typography token is one var per sub-property

describe('Foundation token rows (_tokens.tsx)', () => {
  it('reads every primitive and semantic token in tokens.json', () => {
    assert.ok(allRows.length > 300, `only ${allRows.length} rows`);
    assert.ok(allRows.some(row => row.path === 'primitive.shadow.dark.xl-up'), 'nested groups are walked');
  });

  it('names each token by the CSS var the build really writes', () => {
    const missing = plain.filter(row => !light.has(row.cssVar)).map(row => `${row.path} → ${row.cssVar}`);
    assert.deepEqual(missing, []);
    for (const row of allRows.filter(r => r.token.$type === 'typography')) assert.ok(light.has(`${row.cssVar}-fontSize`), row.path);
  });

  it('prints the value the CSS resolves to, for every token (light theme)', () => {
    const norm = (v: string) => v.replace(/\s+/g, ' ').replace(/,\s*/g, ',').trim();
    const wrong = plain
      .map(row => ({ row, shown: resolvedCss(row.token).css, real: light.get(row.cssVar) ?? '' }))
      .filter(({ shown, real }) => norm(shown) !== norm(real))
      .map(({ row, shown, real }) => `${row.path}: page shows ${shown}, CSS is ${real}`);
    assert.deepEqual(wrong, []);
  });

  it('shows the alias a semantic token points to', () => {
    const m = tokenRows('semantic.spacing').find(row => row.key === 'm')!;
    assert.equal(resolvedCss(m.token).alias, 'primitive.spacing.100');
  });

  it('semantic shadows switch to primitive.shadow.dark.* in dark mode', () => {
    for (const row of tokenRows('semantic.shadow')) {
      const twin = `--helix-primitive-shadow-dark-${row.key}`;
      if (dark.has(twin)) assert.equal(dark.get(row.cssVar), dark.get(twin), row.path);
    }
  });
});

describe('Foundation stories', () => {
  const dir = path.join(storybook, 'stories/Foundation');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.stories.tsx'));

  it('every story renders', async () => {
    let count = 0;
    for (const file of files) {
      const mod = await import(path.join(dir, file)) as Record<string, { render?: (a: object, c: object) => unknown }>;
      for (const [name, story] of Object.entries(mod)) {
        if (name === 'default' || typeof story?.render !== 'function') continue;
        const html = renderToStaticMarkup(story.render({}, {}) as Parameters<typeof renderToStaticMarkup>[0]);
        assert.ok(html.includes('--helix-'), `${file} › ${name} renders no token`);
        count++;
      }
    }
    assert.ok(count >= 17, `only ${count} stories`);
  });

  it('every var(--helix-…) a Foundation page writes by hand exists in helix.css', () => {
    // A renamed token leaves a page pointing at a var that no longer exists: the preview silently renders
    // with no color (the old pages' --helix-color-fill-neutral did, for weeks). Template vars
    // (`var(--helix-radius-${key})`) come from tokens.json and are covered by the tests above.
    const unknown: string[] = [];
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.tsx'))) {
      for (const m of fs.readFileSync(path.join(dir, file), 'utf8').matchAll(/var\((--helix-[\w-]+)\)/g)) {
        if (!light.has(m[1]!)) unknown.push(`${file}: ${m[1]}`);
      }
    }
    assert.deepEqual(unknown, []);
  });

  it('a category no story claims shows at the end of the last story, and nothing shows when none is left', () => {
    const html = renderToStaticMarkup(createElement(OtherTokens, { layer: 'semantic', claimed: categoriesOf('semantic').filter(c => c !== 'blur') }));
    for (const row of tokenRows('semantic.blur')) assert.ok(html.includes(row.cssVar), row.path);
    const none = renderToStaticMarkup(createElement(OtherTokens, { layer: 'semantic', claimed: categoriesOf('semantic') }));
    assert.equal(none, '', 'nothing renders while every category has a story');
  });
});

describe('verify:storybook-tokens (the pre-commit gate)', () => {
  const run = (...args: string[]) => spawnSync('npx', ['tsx', '--tsconfig', 'apps/storybook/tsconfig.json', 'scripts/verify-storybook-tokens.ts', ...args], { cwd: root, encoding: 'utf8' });
  // Same depth as stories/Foundation, so the copied stories' relative imports still resolve.
  const copy = path.join(storybook, 'stories/__gate-test__');
  after(() => fs.rmSync(copy, { recursive: true, force: true }));

  it('passes on the real stories', () => {
    const out = run();
    assert.equal(out.status, 0, out.stderr);
  });

  it('fails, naming the token, when a story stops showing one', () => {
    fs.cpSync(path.join(storybook, 'stories/Foundation'), copy, { recursive: true });
    const file = path.join(copy, 'Semantic.stories.tsx');
    const source = fs.readFileSync(file, 'utf8');
    const hidden = source.replace('<TokenTable path="semantic.radius" preview="radius" />', '<TokenTable path="semantic.radius" preview="radius" only={row => row.key !== "m"} />');
    assert.notEqual(hidden, source, 'the sabotage edit applied');
    fs.writeFileSync(file, hidden);
    const out = run('--dir', copy);
    assert.equal(out.status, 1);
    assert.match(out.stderr, /semantic\.radius \(1\): m/);
  });
});

describe('changelog', () => {
  it('lists the commits a squash merge folded in', () => {
    const body = 'Summary line\n\n* First change\n\nDetails\n\n* Second change\n  indented, not a change\n---------\nCo-authored-by: X';
    assert.deepEqual(squashedChanges(body), ['First change', 'Second change']);
    assert.deepEqual(squashedChanges('a plain commit body'), []);
  });
});
