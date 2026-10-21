/**
 * helix/story-has-controls — every component story has working Controls (Helix's own Storybook only:
 * apps/storybook/stories/{Components,Layout}, see eslint.config.mjs; not in `recommended`).
 *
 *   export const Disabled: Story = {
 *     parameters: { controls: { disable: true } },          → remove it
 *     render: () => <Checkbox label="Off" disabled />,      → render: ({ label }) => <Checkbox label={label} disabled />
 *   };
 *
 * The two ways a story lost its Controls panel (Badge, Checkbox › Disabled and 35 more, 2026-10-21):
 * `controls: { disable: true }`, and a `render` with no args, which ignores every control. A story that
 * really can't have them (an open overlay) says why in a `// controls-off: <reason>` comment inside it or
 * right above it. Stories hidden from the sidebar (`tags: ['!dev']`) are test-only and skipped.
 */

const CONTROLS_OFF = /controls-off\s*:\s*\w+/;

const HOW_TO_FIX =
  'Fix it now, no need to ask: remove `controls.disable`, give the story `args`, and make `render` read them — ' +
  'a story with several instances applies the shared args (size, variant, label, icon…) to every one and turns off ' +
  'only the controls it fixes per instance (`argTypes: { disabled: { control: false } }`). Icon and slot props: a ' +
  "select with a `mapping`, default set with `mapped('Name')` (stories/_shared/mapped-arg.ts). Only an open overlay " +
  'may keep them off, with `// controls-off: <reason>`. See apps/storybook/CLAUDE.md → "Every story has Controls".';

const keyName = p => (p.key?.type === 'Identifier' ? p.key.name : p.key?.type === 'Literal' ? p.key.value : undefined);
const prop = (obj, name) => obj?.type === 'ObjectExpression' ? obj.properties.find(p => p.type === 'Property' && keyName(p) === name) : undefined;
const unwrap = n => (n?.type === 'TSSatisfiesExpression' || n?.type === 'TSAsExpression' ? n.expression : n);

function hiddenFromSidebar(story) {
  const tags = prop(story, 'tags')?.value;
  return tags?.type === 'ArrayExpression' && tags.elements.some(e => e?.type === 'Literal' && e.value === '!dev');
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Every Components/Layout story has working Controls — no controls.disable, no render that ignores args' },
    schema: [],
    messages: {
      disabled: '{{story}} turns its Controls off (`controls: { disable: true }`). ' + HOW_TO_FIX,
      noArgs: '{{story}}\'s `render` takes no args, so no control changes the canvas. ' + HOW_TO_FIX,
      noReason: '`controls-off` needs a reason: `// controls-off: <why this story can\'t have Controls>`.',
    },
  },
  create(context) {
    const source = context.sourceCode;

    function excused(node, statement) {
      const comments = [...source.getCommentsBefore(statement), ...source.getCommentsInside(node)];
      return comments.some(c => CONTROLS_OFF.test(c.value));
    }

    function check(obj, label, statement) {
      if (obj?.type !== 'ObjectExpression' || hiddenFromSidebar(obj) || excused(obj, statement)) return;
      const controls = prop(prop(obj, 'parameters')?.value, 'controls');
      const disable = prop(controls?.value, 'disable');
      if (disable?.value.type === 'Literal' && disable.value.value === true) {
        context.report({ node: disable, messageId: 'disabled', data: { story: label } });
      }
      const render = prop(obj, 'render')?.value;
      if ((render?.type === 'ArrowFunctionExpression' || render?.type === 'FunctionExpression') && render.params.length === 0) {
        context.report({ node: render, messageId: 'noArgs', data: { story: label } });
      }
    }

    return {
      Program(program) {
        for (const c of source.getAllComments()) {
          if (/controls-off/.test(c.value) && !CONTROLS_OFF.test(c.value)) context.report({ loc: c.loc, messageId: 'noReason' });
        }
        const metaNames = new Set();
        for (const s of program.body) {
          if (s.type !== 'ExportDefaultDeclaration') continue;
          const d = unwrap(s.declaration);
          if (d.type === 'Identifier') metaNames.add(d.name);
          else check(d, 'The meta', s);
        }
        for (const s of program.body) {
          const decl = s.type === 'ExportNamedDeclaration' ? s.declaration : s;
          if (decl?.type !== 'VariableDeclaration') continue;
          for (const d of decl.declarations) {
            if (d.id.type !== 'Identifier') continue;
            if (metaNames.has(d.id.name)) check(unwrap(d.init), 'The meta', s);
            else if (s.type === 'ExportNamedDeclaration') check(unwrap(d.init), d.id.name, s);
          }
        }
      },
    };
  },
};
