/**
 * helix/no-raw-spacing — padding, margin and gap must come from Helix spacing tokens.
 *
 *   style={{ padding: '16px' }}       → var(--helix-spacing-component-l) / var(--helix-spacing-m) (suggested)
 *   style={{ marginTop: '2rem' }}     → var(--helix-spacing-layout-m) / var(--helix-spacing-xl) (2rem = 32px)
 *   style={{ gap: 12 }}               → a number is px in React, so it is a raw value too
 *
 * Suggestions come from tokens.json: the semantic spacing tokens with exactly that value (rem counted at
 * 16px). A value with no token match is still reported — it's spacing outside the scale. 0, auto and
 * anything already written with var() pass. Sizes (width, maxWidth, height) are not spacing and are
 * left alone.
 */
import data from '../data.json' with { type: 'json' };

const SPACING_PROP = /^(padding|margin)(Top|Right|Bottom|Left|Inline|Block|InlineStart|InlineEnd|BlockStart|BlockEnd)?$|^(gap|rowGap|columnGap)$/;
const LENGTH = /(?<![\w-])(\d*\.?\d+)(px|rem)\b/g;

function tokensFor(amount, unit) {
  const px = unit === 'rem' ? Number(amount) * 16 : Number(amount);
  return data.spacing[`${px}px`] ?? [];
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Use Helix spacing tokens instead of raw px/rem values for padding, margin and gap' },
    hasSuggestions: true,
    schema: [],
    messages: {
      raw: '`{{value}}` is a raw spacing value for `{{prop}}`. Use a Helix spacing token: {{tokens}}.',
      rawUnknown: '`{{value}}` for `{{prop}}` is outside the Helix spacing scale — use the nearest `--helix-spacing-*` token.',
      replace: 'Replace with var({{token}})',
    },
  },
  create(context) {
    const source = context.sourceCode;

    // `range` is the exact characters to replace; `wrap` turns a token into the replacement text.
    function report(node, prop, value, range, tokens, wrap) {
      context.report({
        node,
        loc: { start: source.getLocFromIndex(range[0]), end: source.getLocFromIndex(range[1]) },
        messageId: tokens.length ? 'raw' : 'rawUnknown',
        data: { prop, value, tokens: tokens.slice(0, 3).map(t => `var(${t})`).join(', ') },
        suggest: tokens.slice(0, 3).map(token => ({
          messageId: 'replace',
          data: { token },
          fix: fixer => fixer.replaceTextRange(range, wrap(token)),
        })),
      });
    }

    return {
      Property(node) {
        const prop = node.key.type === 'Identifier' ? node.key.name : node.key.value;
        if (typeof prop !== 'string' || !SPACING_PROP.test(prop)) return;
        const value = node.value;

        // gap: 12 — React reads a bare number as px.
        if (value.type === 'Literal' && typeof value.value === 'number') {
          if (value.value !== 0) {
            report(value, prop, String(value.value), value.range, data.spacing[`${value.value}px`] ?? [], t => `'var(${t})'`);
          }
          return;
        }

        const parts = value.type === 'Literal' && typeof value.value === 'string' ? [value]
          : value.type === 'TemplateLiteral' ? value.quasis : [];
        for (const part of parts) {
          // Offsets come from the raw source text so a fix lands exactly on the characters in the file.
          const text = source.getText(part);
          for (const match of text.matchAll(LENGTH)) {
            const [raw, amount, unit] = match;
            if (Number(amount) === 0) continue;
            const start = part.range[0] + match.index;
            report(part, prop, raw, [start, start + raw.length], tokensFor(amount, unit), t => `var(${t})`);
          }
        }
      },
    };
  },
};
