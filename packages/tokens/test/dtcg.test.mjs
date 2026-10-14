// Tests the DTCG 2025.10 converter (src/dtcg.mjs): every CSS form Helix uses survives CSS → $value → CSS
// exactly, the standard's shapes come out, and what the standard forbids is refused. Run: pnpm --filter @helixds/tokens test
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fromCss, toCss, isAlias } from '../src/dtcg.mjs';

const roundTrip = (css, type) => {
  const { $value, $type, $extensions } = fromCss(css, type);
  return toCss($value, $type ?? type, { extensions: $extensions });
};

describe('dtcg.mjs', () => {
  it('round-trips every kind of literal Helix uses', () => {
    const cases = [
      ['#2563eb', 'color'], ['#EFF6FF', 'color'], ['16px', 'dimension'], ['0px', 'dimension'], ['1.5rem', 'dimension'],
      ['-0.03em', 'dimension'], ['0em', 'dimension'], ['250ms', 'duration'], ['2s', 'duration'],
      ['cubic-bezier(0.4, 0, 0.2, 1)', 'cubicBezier'], ['Inter, ui-sans-serif, system-ui, sans-serif', 'fontFamily'],
      ['1.02', 'number'], ['600', 'fontWeight'],
      ['0 1px 2px rgba(0,0,0,0.05)', 'shadow'], ['0 0 0 3px rgba(37,99,235,0.25)', 'shadow'],
      ['0 -20px 25px rgba(0,0,0,0.1), 0 -10px 10px rgba(0,0,0,0.04)', 'shadow'], ['none', 'shadow'],
    ];
    for (const [css, type] of cases) assert.equal(roundTrip(css, type), css, `${type} ${css}`);
  });

  it('writes the standard\'s shapes', () => {
    assert.deepEqual(fromCss('#2563eb', 'color').$value, { colorSpace: 'srgb', components: [0.1451, 0.3882, 0.9216], hex: '#2563eb' });
    assert.deepEqual(fromCss('16px', 'dimension').$value, { value: 16, unit: 'px' });
    assert.deepEqual(fromCss('cubic-bezier(0.4, 0, 0.2, 1)', 'cubicBezier').$value, [0.4, 0, 0.2, 1]);
    assert.deepEqual(fromCss('Inter, sans-serif', 'fontFamily').$value, ['Inter', 'sans-serif']);
    assert.equal(fromCss('rgba(0,0,0,0.05)', 'color').$value.alpha, 0.05);
  });

  it('keeps em — which the standard\'s dimension doesn\'t allow — as a number with cssUnit', () => {
    assert.deepEqual(fromCss('0.05em', 'dimension'), { $type: 'number', $value: 0.05, $extensions: { 'com.helixds': { cssUnit: 'em' } } });
  });

  it('refuses units the standard doesn\'t allow, and passes aliases through', () => {
    assert.throws(() => fromCss('12vw', 'dimension'), /vw/);
    assert.throws(() => fromCss('50%', 'dimension'), /%/);
    assert.deepEqual(fromCss('{primitive.spacing.100}', 'dimension'), { $value: '{primitive.spacing.100}' });
    assert.ok(isAlias('{a.b}') && !isAlias('#fff'));
  });

  it('renders an alias inside a composite through `ref`', () => {
    const shadow = { color: '{primitive.color.black}', offsetX: { value: 0, unit: 'px' }, offsetY: { value: 1, unit: 'px' }, blur: { value: 2, unit: 'px' }, spread: { value: 0, unit: 'px' } };
    assert.equal(toCss(shadow, 'shadow', { ref: () => 'var(--black)' }), '0 1px 2px var(--black)');
  });

  it('tokens.json has no literal $value left in a pre-2025.10 string form', () => {
    const tokens = JSON.parse(fs.readFileSync(new URL('../src/tokens.json', import.meta.url), 'utf8'));
    const stale = [];
    (function walk(node, at) {
      if (!node || typeof node !== 'object') return;
      if ('$value' in node) {
        if (typeof node.$value === 'string' && !isAlias(node.$value) && node.$type !== 'fontFamily') stale.push(at.join('.'));
        return;
      }
      for (const [k, v] of Object.entries(node)) if (!k.startsWith('$')) walk(v, [...at, k]);
    })(tokens, []);
    assert.deepEqual(stale, []);
  });
});
