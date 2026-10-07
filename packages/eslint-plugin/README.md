# @helix/eslint-plugin

Flags Helix usage mistakes **while the code is being written** — in the editor, for people and AI agents
alike — instead of after the fact in CI or an eval run.

```js
// eslint.config.mjs
import tseslint from 'typescript-eslint';
import helix from '@helix/eslint-plugin';

export default [
  { ...helix.configs.recommended, languageOptions: { parser: tseslint.parser } },
];
```

With the ESLint extension in VS Code / Cursor, the warnings show up as you type. Agents that run
`eslint --fix` (or read editor diagnostics) get the same feedback before the code lands.

## Rules

| Rule | Catches | Fix |
|------|---------|-----|
| `helix/import-source` | `import { Button } from '@helix/react'` — a package path that isn't Helix | auto-fix to `@helix/react` when every imported name exists there |
| `helix/prop-vocabulary` | `onPress`, `loading`, `startIcon`… on a Helix component; `variant="error"`, `size="md"` | auto-fix to `onClick`, `isLoading`, `icon`, `variant="danger"`, `size="m"` |
| `helix/no-raw-color` | `'#1d4ed8'`, `` `1px solid #e2e8f0` ``, `bg-blue-600` | suggests the semantic tokens with that exact color, e.g. `var(--helix-color-fill-primary-interactive-hover)` |
| `helix/no-raw-control` | `<button>`, `<input>`, `<select>`, `<textarea>` | points to the Helix component; allowed in files marked `// [CUSTOM] reason: …` |

`prop-vocabulary` only checks components imported from Helix (or a look-alike path), and only when the
component documents the canonical prop — `onPress` on a `Card`, which has no `onClick`, is left alone.
Native attributes Helix components pass through (`<Button type="submit">`, `<Input name="email">`) are
never reported.

## Where the rules get their knowledge

Nothing is hand-copied. `src/data.json` is generated from the design system's own sources:

- `.ai/maps/prop-map.md` — canonical prop names and values, and their anti-synonyms
- `contracts/components/*.json` — each component's documented props
- `packages/tokens/src/tokens.json` — semantic color tokens and the primitive ramps
- `packages/core/src/index.ts` — what `@helix/react` really exports

Regenerate after changing any of them: `pnpm --filter @helix/eslint-plugin build:data`. The test
suite fails while `data.json` is stale.

## Tested against real agent output

Run over the 181 recorded eval generations in `evals/outputs`, the plugin flags every `onPress` the evals
found (11 via `prop-vocabulary`, the 12th on a native `<button>` via `no-raw-control`), plus 43 invented
`@helix/*` imports and components (`FormField`, `Spinner`, `HxButton`…), with no false positives.
