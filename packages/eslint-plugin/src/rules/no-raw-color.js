/**
 * helix/no-raw-color — colors must come from Helix semantic tokens.
 *
 *   style={{ color: '#1d4ed8' }}      → var(--helix-color-fill-primary-interactive-hover) (suggested)
 *   className="bg-blue-600"           → a Helix fill token instead of a Tailwind palette class
 *
 * Suggestions come from tokens.json: the semantic tokens whose light-mode value is exactly that color.
 * A hex with no token match is still reported — it's a color outside the system.
 */
import data from '../data.json' with { type: 'json' };

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;

// Tailwind palette names → the Helix primitive ramp with the same values (Helix gray is Tailwind slate,
// orange is amber, turquoise is sky). Other palette names have no Helix equivalent.
const TAILWIND_HUE = { blue: 'blue', slate: 'gray', gray: 'gray', green: 'green', amber: 'orange', orange: 'orange', red: 'red', sky: 'turquoise' };
const TAILWIND_PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const TAILWIND_CLASS = new RegExp(`(?<![\\w-])(?:[\\w-]+:)*(bg|text|border(?:-[trblxy])?|ring|outline|divide|fill|stroke|from|via|to|placeholder|accent|caret|decoration|shadow)-(${TAILWIND_PALETTE})-(50|[1-9]00|950)(?:/\\d+)?(?![\\w-])`, 'g');
// Which semantic surface a utility paints — used to rank suggestions (bg-blue-600 → a fill token first).
const SURFACE = { bg: 'fill', from: 'fill', via: 'fill', to: 'fill', text: 'text', placeholder: 'text', caret: 'text', decoration: 'text', fill: 'icon', stroke: 'icon' };

const NOT_COLOR_ATTRS = /^(href|to|id|htmlFor|key|src|alt|name|aria-[\w-]+|data-[\w-]+)$/;

function expand(hex) {
  const h = hex.slice(1).toLowerCase();
  if (h.length === 3 || h.length === 4) return '#' + [...h.slice(0, 3)].map(c => c + c).join('');
  return '#' + h.slice(0, 6);
}

function tokensFor(hex, surface) {
  const vars = data.colors[expand(hex)] ?? [];
  if (!surface) return vars;
  const prefix = `--helix-color-${surface}-`;
  return [...vars.filter(v => v.startsWith(prefix)), ...vars.filter(v => !v.startsWith(prefix))];
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Use Helix semantic color tokens instead of raw hex values or Tailwind palette classes' },
    hasSuggestions: true,
    schema: [],
    messages: {
      hex: '`{{hex}}` is a raw color. Use a Helix semantic token: {{tokens}}.',
      hexUnknown: '`{{hex}}` is a raw color and no Helix token has this value — pick a semantic token (`pnpm helix search "<role>"`).',
      tailwind: '`{{cls}}` is a Tailwind palette color. Use a Helix semantic token: {{tokens}}.',
      tailwindUnknown: '`{{cls}}` is a Tailwind palette color outside Helix — use a semantic token (`pnpm helix search "<role>"`).',
      replace: 'Replace with var({{token}})',
    },
  },
  create(context) {
    const source = context.sourceCode;

    function check(node, text, offset) {
      for (const match of text.matchAll(HEX)) {
        const hex = match[0];
        const tokens = tokensFor(hex);
        const start = offset + match.index;
        context.report({
          node,
          loc: { start: source.getLocFromIndex(start), end: source.getLocFromIndex(start + hex.length) },
          messageId: tokens.length ? 'hex' : 'hexUnknown',
          data: { hex, tokens: tokens.slice(0, 3).map(t => `var(${t})`).join(', ') },
          suggest: tokens.slice(0, 3).map(token => ({
            messageId: 'replace',
            data: { token },
            fix: fixer => fixer.replaceTextRange([start, start + hex.length], `var(${token})`),
          })),
        });
      }
      for (const match of text.matchAll(TAILWIND_CLASS)) {
        const [cls, utility, palette, step] = match;
        const hue = TAILWIND_HUE[palette];
        const hex = hue && data.primitives[`${hue}-${step}`];
        const tokens = hex ? tokensFor(hex, SURFACE[utility] ?? 'border') : [];
        const start = offset + match.index;
        context.report({
          node,
          loc: { start: source.getLocFromIndex(start), end: source.getLocFromIndex(start + cls.length) },
          messageId: tokens.length ? 'tailwind' : 'tailwindUnknown',
          data: { cls, tokens: tokens.slice(0, 3).map(t => `var(${t})`).join(', ') },
        });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value !== 'string' || /^(Import|Export\w*)Declaration$/.test(node.parent?.type ?? '')) return;
        // `href="#add"` or `id="#cafe"` is an anchor, not a color.
        if (node.parent?.type === 'JSXAttribute' && NOT_COLOR_ATTRS.test(node.parent.name.name)) return;
        // Offsets are taken from the raw source text so a fix lands exactly on the characters in the file.
        check(node, source.getText(node), node.range[0]);
      },
      TemplateElement(node) {
        check(node, source.getText(node), node.range[0]);
      },
    };
  },
};
