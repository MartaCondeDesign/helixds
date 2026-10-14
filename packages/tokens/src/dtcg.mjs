/**
 * DTCG 2025.10 token values ⇄ CSS — the one place that knows the format (https://www.designtokens.org/tr/2025.10/format/).
 *
 * tokens.json stores values the way the standard defines them: a color is { colorSpace, components, alpha?, hex? },
 * a dimension or duration is { value, unit }, a cubicBezier is [x1, y1, x2, y2], a fontFamily is a list of names,
 * a shadow is { color, offsetX, offsetY, blur, spread } (or a list of them). Every script that needs the CSS
 * string — the build, the linter's data, the MCP/CLI, the token audits, Storybook — calls `toCss` here instead of
 * reading `$value` as a string. `fromCss` goes the other way, for `pnpm token:add` and the one-off migration.
 *
 * Two values the standard has no shape for keep their meaning through `$extensions["com.helixds"]`:
 *   - a length relative to the font size (`letterSpacing` in em): `$type: "number"` holds the multiplier,
 *     `cssUnit: "em"` the unit — the standard's dimension only allows px and rem.
 *   - `toCss` writes a shadow with every length 0 and a transparent color as `none`, the CSS it stands for.
 *
 * Plain JavaScript (types in dtcg.d.mts) so the eslint plugin's build script, which runs on bare node, can use it.
 */

export const EXTENSION = 'com.helixds';

/** "{primitive.color.blue.600}" — a reference to another token. */
export function isAlias(value) {
  return typeof value === 'string' && /^\{[^{}]+\}$/.test(value);
}

const round = n => Math.round(n * 1e4) / 1e4;
const hex2 = n => Math.round(n * 255).toString(16).padStart(2, '0');

// ─── to CSS ──────────────────────────────────────────────────────────────────

function colorToCss(color) {
  const rgb = color.hex
    ? [1, 3, 5].map(i => parseInt(color.hex.slice(i, i + 2), 16))
    : color.components.map(c => Math.round(c * 255));
  const alpha = color.alpha ?? 1;
  if (alpha < 1) return `rgba(${rgb.join(',')},${round(alpha)})`;
  return color.hex ?? `#${color.components.map(hex2).join('')}`;
}

const lengthToCss = d => `${d.value}${d.unit}`;
// Inside a shadow a zero length is written bare ("0 1px 2px"), as CSS authors do.
const shadowLength = d => (d.value === 0 ? '0' : lengthToCss(d));

function shadowLayerToCss(layer, ref) {
  const part = v => (isAlias(v) ? ref(v) : null);
  const color = part(layer.color) ?? colorToCss(layer.color);
  const len = v => part(v) ?? shadowLength(v);
  const spread = isAlias(layer.spread) || layer.spread?.value ? ` ${len(layer.spread)}` : '';
  return `${layer.inset ? 'inset ' : ''}${len(layer.offsetX)} ${len(layer.offsetY)} ${len(layer.blur)}${spread} ${color}`;
}

function isNoShadow(layers) {
  return layers.length === 1 && !isAlias(layers[0].color) && (layers[0].color.alpha ?? 1) === 0
    && ['offsetX', 'offsetY', 'blur', 'spread'].every(k => !isAlias(layers[0][k]) && layers[0][k].value === 0);
}

/**
 * The CSS for a token's own (non-alias) value. `ref` renders an alias found *inside* a composite value
 * (a shadow's color) — by default it's left as the alias string.
 */
export function toCss(value, type, { extensions, ref = v => v } = {}) {
  if (isAlias(value)) return ref(value);
  switch (type) {
    case 'color': return colorToCss(value);
    case 'dimension':
    case 'duration': return lengthToCss(value);
    case 'cubicBezier': return `cubic-bezier(${value.join(', ')})`;
    case 'fontFamily': return Array.isArray(value) ? value.join(', ') : value;
    case 'shadow': {
      const layers = Array.isArray(value) ? value : [value];
      return isNoShadow(layers) ? 'none' : layers.map(l => (isAlias(l) ? ref(l) : shadowLayerToCss(l, ref))).join(', ');
    }
    case 'number': {
      const unit = extensions?.[EXTENSION]?.cssUnit;
      return unit ? `${value}${unit}` : String(value);
    }
    default: return String(value); // fontWeight, number-like, anything new
  }
}

// ─── from CSS ────────────────────────────────────────────────────────────────

function parseColor(css) {
  const s = css.trim();
  let rgb, alpha;
  if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(s)) {
    rgb = [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
    if (s.length === 9) alpha = parseInt(s.slice(7, 9), 16) / 255;
  } else {
    const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
    if (!m) throw new Error(`Not a color this converter knows: ${css}`);
    rgb = m.slice(1, 4).map(Number);
    if (m[4] !== undefined) alpha = Number(m[4]);
  }
  const color = { colorSpace: 'srgb', components: rgb.map(c => round(c / 255)) };
  if (alpha !== undefined && alpha < 1) color.alpha = round(alpha);
  color.hex = `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`;
  if (alpha === undefined && s.startsWith('#')) color.hex = s.slice(0, 7); // keep the authored case
  return color;
}

function parseLength(css, units) {
  const m = css.trim().match(/^(-?[\d.]+)([a-z%]*)$/i);
  if (!m) throw new Error(`Not a length: ${css}`);
  const unit = m[2] || units[0];
  if (!units.includes(unit)) throw new Error(`Unit "${unit}" isn't allowed by DTCG 2025.10 here (${units.join('/')}): ${css}`);
  return { value: Number(m[1]), unit };
}

// Split on commas that aren't inside parentheses (rgba(…), cubic-bezier(…)).
const splitTop = s => s.split(/,(?![^(]*\))/).map(x => x.trim()).filter(Boolean);

function parseShadow(css) {
  if (css.trim() === 'none') {
    const zero = { value: 0, unit: 'px' };
    return { color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0, hex: '#000000' }, offsetX: zero, offsetY: zero, blur: zero, spread: zero };
  }
  const layers = splitTop(css).map(layer => {
    const inset = /^inset\s/.test(layer);
    const body = layer.replace(/^inset\s+/, '');
    const color = body.match(/(rgba?\([^)]*\)|#[0-9a-f]{3,8})\s*$/i)?.[1];
    if (!color) throw new Error(`Shadow without a color: ${layer}`);
    const lengths = body.slice(0, body.lastIndexOf(color)).trim().split(/\s+/).map(l => parseLength(l, ['px', 'rem']));
    const [offsetX, offsetY, blur = { value: 0, unit: 'px' }, spread = { value: 0, unit: 'px' }] = lengths;
    return { color: parseColor(color), offsetX, offsetY, blur, spread, ...(inset ? { inset: true } : {}) };
  });
  return layers.length === 1 ? layers[0] : layers;
}

/**
 * A CSS value → its DTCG 2025.10 `$value`. Returns `{ $value }`, plus `$type`/`$extensions` when the standard
 * needs a different shape (a length in em becomes a number with `cssUnit: "em"`).
 */
export function fromCss(css, type) {
  if (isAlias(css)) return { $value: css };
  const s = String(css).trim();
  switch (type) {
    case 'color': return { $value: parseColor(s) };
    case 'dimension': {
      const em = s.match(/^(-?[\d.]+)em$/);
      if (em) return { $type: 'number', $value: Number(em[1]), $extensions: { [EXTENSION]: { cssUnit: 'em' } } };
      return { $value: parseLength(s, ['px', 'rem']) };
    }
    case 'duration': return { $value: parseLength(s, ['ms', 's']) };
    case 'cubicBezier': {
      const m = s.match(/^cubic-bezier\(([^)]*)\)$/);
      if (!m) throw new Error(`Not a cubic-bezier(): ${css}`);
      return { $value: m[1].split(',').map(Number) };
    }
    case 'fontFamily': return { $value: splitTop(s) };
    case 'fontWeight': return { $value: /^\d+$/.test(s) ? Number(s) : s }; // 600, or a named weight ("bold")
    case 'number': return { $value: Number(s) };
    case 'shadow': return { $value: parseShadow(s) };
    default: return { $value: css };
  }
}
