# @helixds/tokens

Helix DS design tokens: the DTCG 2025.10 source (`src/tokens.json`, dark theme in `src/tokens.dark.json`)
built into CSS custom properties and TypeScript constants.

```bash
npm install @helixds/tokens
```

```css
@import "@helixds/tokens/helix.css"; /* every --helix-* variable, light and dark */
```

```ts
import { tokens } from '@helixds/tokens';
```

You don't need to install it yourself if you use `@helixds/react`: its `globals.css` already imports it.
