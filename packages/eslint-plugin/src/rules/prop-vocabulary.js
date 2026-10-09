/**
 * helix/prop-vocabulary — anti-synonym props and values on Helix components (`.ai/maps/prop-map.md`).
 *
 *   <Button onPress={save}>        → onClick
 *   <Badge variant="error" />      → variant="danger"
 *   <Button size="sm">             → size="s"
 *
 * Only on components imported from @helixds/react, and only when that component actually documents the
 * canonical prop — so `onPress` on a Card (which has no onClick prop) is left alone. A few anti-synonyms are
 * also real HTML attributes (`<Button type="submit">`, `<Input name="email">`); those are left alone on the
 * components whose props extend HTML attributes (data.passthrough). On the others they don't compile, so
 * they're reported: `<PageHeader title>` → label. (unknown-prop skips anti-synonyms and leaves them here.)
 */
import data from '../data.json' with { type: 'json' };
import { helixImports } from '../helix-imports.js';

const PASSTHROUGH = new Set(['type', 'name', 'title', 'readonly', 'content', 'slot']);
const takesHtml = new Set(data.passthrough ?? []);

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Use Helix canonical prop names and values (prop-map.md)' },
    fixable: 'code',
    schema: [],
    messages: {
      prop: "`{{wrong}}` is not a Helix prop — {{component}} uses `{{canonical}}`.",
      value: '`{{prop}}="{{wrong}}"` is not a Helix value — use `{{prop}}="{{canonical}}"`.',
    },
  },
  create(context) {
    const imports = helixImports();
    return {
      ImportDeclaration: imports.ImportDeclaration,
      JSXOpeningElement(node) {
        const component = imports.resolve(node);
        if (!component) return;
        const props = new Set(data.props[component]);
        const present = new Set(node.attributes.filter(a => a.type === 'JSXAttribute').map(a => a.name.name));

        for (const attr of node.attributes) {
          if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') continue;
          const name = attr.name.name;

          const canonical = data.antiSynonyms[name];
          if (canonical && props.has(canonical) && !props.has(name) && !(PASSTHROUGH.has(name) && takesHtml.has(component))) {
            context.report({
              node: attr.name,
              messageId: 'prop',
              data: { wrong: name, canonical, component },
              // Renaming is safe only when it doesn't collide with the canonical prop already being set.
              fix: present.has(canonical) ? null : fixer => fixer.replaceText(attr.name, canonical),
            });
          }

          const synonyms = data.valueSynonyms[name];
          const value = attr.value?.type === 'Literal' && typeof attr.value.value === 'string' ? attr.value.value : undefined;
          if (synonyms && value && props.has(name) && synonyms[value]) {
            context.report({
              node: attr.value,
              messageId: 'value',
              data: { prop: name, wrong: value, canonical: synonyms[value] },
              fix: fixer => fixer.replaceText(attr.value, `"${synonyms[value]}"`),
            });
          }
        }
      },
    };
  },
};
