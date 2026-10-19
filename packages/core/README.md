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

Requires React 19 and Tailwind CSS v4 set up in your app.

```bash
npm install @helixds/react @helixds/tokens @tabler/icons-react
```

In the CSS file Tailwind processes, replace `@import "tailwindcss";` with:

```css
@import "@helixds/react/globals.css"; /* Tailwind + every --helix-* token + component styles */
```

```tsx
import { Button } from '@helixds/react';

export const Save = ({ onSave }: { onSave: () => void }) => (
  <Button variant="primary" onClick={onSave}>Save</Button>
);
```

Dark mode follows the operating system; set `data-theme="dark"` or `"light"` on `<html>` to force one.

**Docs:** [Storybook](https://martacondedesign.github.io/helixds/) ·
[Getting started](https://github.com/MartaCondeDesign/helixds/blob/main/docs/getting-started.md) ·
[GitHub](https://github.com/MartaCondeDesign/helixds)

**Agents:** connect the Helix MCP server (`npx -y @helixds/mcp`) — see [`AGENTS.md`](./AGENTS.md).

MIT © Marta Conde
