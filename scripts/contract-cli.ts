/**
 * Scaffolds a new component contract, and a matching eval prompt stub so new
 * components get vibe-test coverage from day one instead of relying on someone
 * remembering to add it later.
 * Run: pnpm contract <ComponentName>
 */
import fs from 'fs';
import path from 'path';

const name = process.argv[2];

if (!name) {
  console.error('Usage: pnpm contract <ComponentName>');
  process.exit(1);
}
if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
  console.error(`"${name}" is not PascalCase. Use e.g. "Tooltip", "DatePicker".`);
  process.exit(1);
}

const kebabName = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const contractsDir = path.resolve(import.meta.dirname, '../contracts/components');
const promptsDir = path.resolve(import.meta.dirname, '../evals/prompts');

const contractPath = path.join(contractsDir, `${name}.json`);
const promptPath = path.join(promptsDir, `${kebabName}-basic.md`);

if (fs.existsSync(contractPath)) {
  console.error(`❌ ${contractPath} already exists. Refusing to overwrite — edit it directly.`);
  process.exit(1);
}
if (fs.existsSync(promptPath)) {
  console.error(`❌ ${promptPath} already exists. Refusing to overwrite — edit it directly.`);
  process.exit(1);
}

const contract = {
  $schema: '../component.schema.json',
  name,
  version: '0.1.0',
  status: 'draft',

  purpose: `TODO: one sentence — what ${name} is for, written from the user's perspective.`,

  neverUseFor: ['TODO: an anti-pattern this component must never be used for'],

  states: {
    intrinsic: ['hover', 'focus', 'active'],
    authored: [],
  },

  anatomy: [
    { part: `${kebabName}-root`, element: 'div', description: 'TODO: root layout element.' },
  ],

  props: [],

  sizing: {
    height: {
      mode: 'fixed',
      values: {},
      unit: 'px',
      note: 'TODO: use the shared control/field scale from ADR-004, or document a local exception.',
    },
    width: {
      default: 'hug',
      modes: {
        hug: 'Width shrinks to content.',
        fill: 'Width expands to 100% of container.',
        fixed: 'Explicit value set by the consumer.',
      },
    },
  },

  tokenPolicy: {
    allowed: ['color.fill', 'color.text', 'color.border', 'spacing', 'radius', 'fontSize'],
    forbidden: ['primitive.color'],
  },

  a11y: {
    role: 'TODO',
    keyboardNav: [],
    wcag: [],
  },
};

const promptStub = `---
id: ${kebabName}-basic
category: component-selection
difficulty: easy
turns: 1
---

# Prompt

TODO: a natural-language task an agent would ask for that should use ${name}.

# Success criteria

- [ ] Imports \`${name}\` from \`@helix-ds/core\`
- [ ] TODO: canonical prop usage, taken from \`contracts/components/${name}.json\` once it's filled in

# Escape hatches (partial credit)

- TODO: legitimate but non-ideal outputs

# Invalid patterns (auto-fail)

- TODO: anti-synonyms and hallucinated props to catch, from \`.ai/maps/prop-map.md\`

# Expected output shape

\`\`\`tsx
// TODO: reference implementation. \`pnpm eval:run\` scores this against the criteria
// above — if it doesn't score 100%, the criteria are written ambiguously.
\`\`\`
`;

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(promptsDir, { recursive: true });
fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2) + '\n');
fs.writeFileSync(promptPath, promptStub);

console.log(`✅ Scaffolded:`);
console.log(`   contracts/components/${name}.json`);
console.log(`   evals/prompts/${kebabName}-basic.md`);
console.log(`\nNext: fill in the contract's purpose/states/anatomy/props/tokenPolicy/sizing,`);
console.log(`then the eval's Success criteria/Invalid patterns, then run:`);
console.log(`   pnpm verify:contract`);
console.log(`   pnpm eval:run --prompt ${kebabName}-basic`);
