# @helixds/react

React components for **Helix**, a design system for AI-powered products: native HTML elements, Tailwind CSS
v4 and semantic design tokens (`@helixds/tokens`).

## For AI coding agents — read this first

Helix's props are not the ones other libraries use, so guessed props usually don't compile.

1. **Before writing JSX, read the contract of every Helix component you will use** (layout ones too):
   `node_modules/@helixds/react/dist/contracts/<Name>.json` — exact props, which are required, when not to
   use it, and the import line. The list of components: `dist/contracts/manifest.json`.
2. **Import everything from `@helixds/react`** — never `@helix/…` or `@helix-ds/…`.
3. Common mistakes: Button's text is its children (not `label`); form controls require `label`;
   `PageHeader` takes `label` (not `title`); `Select` takes `options`; `Card` takes no `style`.
4. Spacing and color come from `--helix-*` tokens, never raw `px`/hex.

Full guide: [`AGENTS.md`](./AGENTS.md) · prop vocabulary: `dist/prop-map.md`.

## Install

Not published: the packages are marked `"private": true`, so `npm publish` refuses them. Inside the Helix
monorepo, depend on them with `workspace:*`. Elsewhere, pack them and install the tarballs:

```bash
cd packages/tokens && pnpm pack && cd ../core && pnpm pack
npm install ./helixds-tokens-0.1.0.tgz ./helixds-react-0.1.0.tgz react react-dom tailwindcss
```

```tsx
// once, in your app entry
import '@helixds/tokens/helix.css';
import '@helixds/react/globals.css';

import { Button } from '@helixds/react';

export const Save = () => <Button variant="primary" onClick={save}>Save</Button>;
```

MIT © Marta Conde
