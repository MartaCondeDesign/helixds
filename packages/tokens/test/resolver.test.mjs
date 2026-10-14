// Tests the DTCG 2025.10 resolver reader (src/resolver.mjs) and what the build makes of Helix's themes:
// the spec's merge and input rules, and that dark mode in dist/helix.css comes from tokens.dark.json through
// helix.resolver.json — a component color aliasing a semantic color follows it with no entry of its own.
// Run: pnpm --filter @helixds/tokens test (after pnpm --filter @helixds/tokens build)
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadResolver } from '../src/resolver.mjs';
import { resolveThemes } from './css-themes.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-resolver-'));
after(() => fs.rmSync(dir, { recursive: true, force: true }));
const color = hex => ({ $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0, 0], hex } });
function resolverWith(doc, files = {}) {
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), JSON.stringify(content));
  const file = path.join(dir, `r${Math.random().toString(36).slice(2)}.resolver.json`);
  fs.writeFileSync(file, JSON.stringify({ version: '2025.10', ...doc }));
  return loadResolver(file);
}

describe('resolver.mjs', () => {
  const r = resolverWith({
    sets: { base: { sources: [{ $ref: 'base.json' }, { brand: { a: color('#222222') } }] } },
    modifiers: { theme: { contexts: { light: [], dark: [{ $ref: 'dark.json' }] }, default: 'light' } },
    resolutionOrder: [{ $ref: '#/sets/base' }, { $ref: '#/modifiers/theme' }],
  }, {
    'base.json': { brand: { a: color('#111111'), b: { $type: 'color', $value: '{brand.a}' } } },
    'dark.json': { brand: { a: color('#eeeeee') } },
  });

  it('merges sources in order — the last occurrence of a token wins, groups merge', () => {
    const light = r.resolve();
    assert.equal(light.brand.a.$value.hex, '#222222');
    assert.equal(light.brand.b.$value, '{brand.a}');
  });

  it('a modifier context lays its tokens on top; aliases stay unresolved for the build', () => {
    const dark = r.resolve({ theme: 'dark' });
    assert.equal(dark.brand.a.$value.hex, '#eeeeee');
    assert.equal(dark.brand.b.$value, '{brand.a}');
  });

  it('validates inputs against the modifiers, as the spec requires', () => {
    assert.throws(() => r.resolve({ theme: 'sepia' }), /not a context/);
    assert.throws(() => r.resolve({ density: 'compact' }), /not a modifier/);
    assert.throws(() => resolverWith({ modifiers: { theme: { contexts: { light: [] }, default: 'dark' } }, resolutionOrder: [] }), /default/);
    assert.throws(() => resolverWith({ version: '2024.01', resolutionOrder: [] }), /2025\.10/);
  });
});

describe('Helix themes (dist/helix.css)', () => {
  const css = fs.readFileSync(new URL('../dist/helix.css', import.meta.url), 'utf8');
  const { light, dark } = resolveThemes(css);
  const helix = loadResolver(new URL('../src/helix.resolver.json', import.meta.url).pathname);

  it('the dark block applies tokens.dark.json', () => {
    const darkFile = JSON.parse(fs.readFileSync(new URL('../src/tokens.dark.json', import.meta.url), 'utf8'));
    assert.ok(darkFile.semantic.color.fill.page);
    assert.notEqual(light.get('--helix-color-fill-page'), dark.get('--helix-color-fill-page'));
  });

  it('a component color aliasing a semantic color takes its dark value with no entry of its own', () => {
    const tree = helix.resolve({ theme: 'light' });
    const darkFile = JSON.parse(fs.readFileSync(new URL('../src/tokens.dark.json', import.meta.url), 'utf8'));
    const followers = [];
    (function walk(node, at) {
      for (const [k, v] of Object.entries(node)) {
        if (k.startsWith('$') || !v || typeof v !== 'object') continue;
        if ('$value' in v) {
          const m = typeof v.$value === 'string' && v.$value.match(/^\{semantic\.color\.(\w+)\.([\w-]+)\}$/);
          if (m && darkFile.semantic?.color?.[m[1]]?.[m[2]]) followers.push([`--helix-${[...at, k].join('-')}`, `--helix-color-${m[1]}-${m[2]}`]);
        } else walk(v, [...at, k]);
      }
    })(tree.component, []);
    assert.ok(followers.length > 50);
    for (const [component, semantic] of followers) assert.equal(dark.get(component), dark.get(semantic), component);
  });

  it('the mobile media block applies tokens.mobile.json — the viewport modifier\'s mobile context', () => {
    const block = css.match(/@media \(max-width: (\d+)px\) \{\s*:root \{([^}]*)\}/);
    assert.ok(block, 'no mobile media block');
    const tree = helix.resolve({ viewport: 'mobile' });
    const mobileFile = JSON.parse(fs.readFileSync(new URL('../src/tokens.mobile.json', import.meta.url), 'utf8'));
    for (const key of Object.keys(mobileFile.primitive.fontSize)) {
      const mobile = tree.semantic.fontSize.mobile[key].$value;
      assert.match(block[2], new RegExp(`--helix-primitive-fontSize-${key}: ${mobile.value}${mobile.unit};`));
    }
    assert.equal(Number(block[1]) + 1, tree.primitive.breakpoint.tablet.$value.value);
  });
});
