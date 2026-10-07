/**
 * helix/unknown-prop — a prop a Helix component doesn't have (contracts/components/*.json).
 *
 *   <Button wobble>                  → not a Button prop
 *   <Button label="Save" />          → not a Button prop — Button's text goes in children
 *
 * The contract is the source of truth: a prop is valid if the component's contract lists it, or if it's a
 * standard HTML/React attribute every Helix component passes through to its element (id, aria-*, data-*,
 * DOM events…). prop-vocabulary already reports — and fixes — known anti-synonyms (`isPending` → `isLoading`),
 * so those are skipped here instead of reported twice. Only on components imported from @helixds/react.
 */
import data from '../data.json' with { type: 'json' };
import { helixImports } from '../helix-imports.js';

// Standard attributes React and the DOM accept on any element — passed through by Helix components.
const HTML = new Set([
  'key', 'ref', 'children', 'className', 'style', 'id', 'title', 'role', 'tabIndex', 'hidden', 'lang', 'dir',
  'slot', 'draggable', 'spellCheck', 'translate', 'inert', 'autoFocus', 'contentEditable', 'inputMode',
  'enterKeyHint', 'is', 'nonce', 'suppressHydrationWarning', 'suppressContentEditableWarning',
  // form and field attributes
  'type', 'name', 'value', 'defaultValue', 'checked', 'defaultChecked', 'disabled', 'form', 'formAction',
  'formMethod', 'formNoValidate', 'formTarget', 'autoComplete', 'placeholder', 'readOnly', 'required', 'min',
  'max', 'step', 'minLength', 'maxLength', 'pattern', 'multiple', 'accept', 'capture', 'list', 'size', 'rows',
  'cols', 'wrap', 'htmlFor',
  // links, media, tables
  'href', 'target', 'rel', 'download', 'hrefLang', 'src', 'srcSet', 'sizes', 'alt', 'width', 'height',
  'loading', 'decoding', 'crossOrigin', 'referrerPolicy', 'colSpan', 'rowSpan', 'scope', 'headers', 'open',
  'popover', 'popoverTarget', 'popoverTargetAction',
]);
const isPassthrough = (name) =>
  HTML.has(name) || name.startsWith('aria-') || name.startsWith('data-') || /^on[A-Z]/.test(name);

// Text props an agent reaches for when a component takes its text as children (Button, Card…).
const TEXT_PROPS = new Set(['label', 'text', 'content', 'caption']);

export default {
  meta: {
    type: 'problem',
    docs: { description: "Only use props a Helix component's contract documents" },
    schema: [],
    messages: {
      unknown: '`{{prop}}` is not a {{component}} prop. {{component}} props: {{props}}.',
      children: '`{{prop}}` is not a {{component}} prop — {{component}} takes its text as children: <{{component}}>…</{{component}}>.',
    },
  },
  create(context) {
    const imports = helixImports();
    return {
      ImportDeclaration: imports.ImportDeclaration,
      JSXOpeningElement(node) {
        const component = imports.resolve(node);
        const documented = component ? data.props[component] : undefined;
        // No contract for it (a Doc export, a helper) — nothing to check against.
        if (!documented) return;
        const props = new Set(documented);

        for (const attr of node.attributes) {
          if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') continue;
          const name = attr.name.name;
          if (props.has(name) || isPassthrough(name)) continue;
          // A known anti-synonym of a prop this component has: prop-vocabulary reports and fixes it.
          const canonical = data.antiSynonyms[name];
          if (canonical && props.has(canonical)) continue;

          const takesChildren = props.has('children') && TEXT_PROPS.has(name);
          context.report({
            node: attr.name,
            messageId: takesChildren ? 'children' : 'unknown',
            data: { prop: name, component, props: documented.join(', ') },
          });
        }
      },
    };
  },
};
