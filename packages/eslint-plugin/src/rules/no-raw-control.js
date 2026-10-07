/**
 * helix/no-raw-control — a plain <button>, <select>, <textarea> or <input> where Helix has a component.
 *
 *   <button onClick={save}>Save</button>   → <Button onClick={save}>Save</Button>
 *
 * Allowed in a file marked as a custom component with a `// [CUSTOM] reason: …` header — the AGENTS.md
 * component hierarchy (Helix core first, custom second) and what `pnpm helix scaffold:custom` writes.
 * A `[CUSTOM]` tag with no reason doesn't count, and is reported on its own.
 */

// `[CUSTOM]` followed by a real word — the same check the eval reviewer applies.
const CUSTOM_WITH_REASON = /\[CUSTOM\]\s*(?:reason\s*:)?\s*\w+/;

const INPUT_BY_TYPE = { checkbox: 'Checkbox', radio: 'RadioButton', submit: 'Button', button: 'Button', reset: 'Button' };
const CONTROL = { button: 'Button (or IconButton for an icon-only action)', select: 'Select (or MultiSelect)', textarea: 'Textarea' };

function helixFor(opening) {
  const tag = opening.name.name;
  if (tag !== 'input') return CONTROL[tag];
  const type = opening.attributes.find(a => a.type === 'JSXAttribute' && a.name.name === 'type');
  const value = type?.value?.type === 'Literal' ? type.value.value : undefined;
  if (value === 'hidden') return undefined;
  return INPUT_BY_TYPE[value] ?? 'Input';
}

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Use Helix components instead of plain native controls, or mark the file // [CUSTOM] reason: …' },
    schema: [],
    messages: {
      raw: '<{{tag}}> has a Helix equivalent — use {{helix}} from @helix/react. If you really need a custom control, start the file with `// [CUSTOM] reason: <why Helix doesn\'t cover it>` (pnpm helix scaffold:custom).',
      noReason: '`[CUSTOM]` needs a reason: `// [CUSTOM] reason: <why Helix doesn\'t cover it>`.',
    },
  },
  create(context) {
    const comments = context.sourceCode.getAllComments().filter(c => c.value.includes('[CUSTOM]'));
    const isCustom = comments.some(c => CUSTOM_WITH_REASON.test(c.value));

    return {
      Program() {
        for (const comment of comments) {
          if (!CUSTOM_WITH_REASON.test(comment.value)) context.report({ loc: comment.loc, messageId: 'noReason' });
        }
      },
      JSXOpeningElement(node) {
        if (isCustom || node.name.type !== 'JSXIdentifier') return;
        const helix = helixFor(node);
        if (helix) context.report({ node: node.name, messageId: 'raw', data: { tag: node.name.name, helix } });
      },
    };
  },
};
