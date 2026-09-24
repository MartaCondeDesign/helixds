# Helix DS — Consumer Agent Guide

> For teams using Helix in their apps. If you're contributing to Helix itself, read `contributor-ai/CONTRIBUTOR.md` instead.

## What is Helix?

A design system built for teams building AI-powered products. Components have explicit contracts,
predictable token structure, and machine-readable documentation.

## Available packages

| Package               | Purpose                              | Install                         |
|-----------------------|--------------------------------------|----------------------------------|
| `@helix-ds/core`      | All UI components                    | `pnpm add @helix-ds/core`       |
| `@helix-ds/tokens`    | CSS tokens + TypeScript constants    | `pnpm add @helix-ds/tokens`     |
| `@helix-ds/icons`     | Tabler Icons wrapper                 | `pnpm add @helix-ds/icons`      |

## Setup (required, once)

```tsx
// app/layout.tsx or main.tsx
import '@helix-ds/tokens/helix.css';   // CSS custom properties
import '@helix-ds/core/globals.css';   // Tailwind base + component styles
```

## Component inventory

Every component's current status (draft / beta / stable) is **computed**, not listed here — see
Storybook → **Status**, or `contracts/stability.json` (`pnpm verify:stable`, ADR-018). draft = exists and
works; beta = passes all 8 automatic quality criteria; stable = beta + modeled in Figma.

| Component  | Import path                              | Purpose                      |
|------------|------------------------------------------|------------------------------|
| Button     | `@helix-ds/core`                      | Actions, CTAs, links         |
| Input      | `@helix-ds/core`                      | Text input, search           |
| Badge      | `@helix-ds/core`                      | Status, counts, labels       |
| Chip       | `@helix-ds/core`                      | Selectable tags / filters    |
| Card       | `@helix-ds/core`                      | Content grouping, widgets    |
| Modal      | `@helix-ds/core`                      | Modal overlays               |
| Select     | `@helix-ds/core`                      | Dropdown selection           |

## Component hierarchy (enforce this order)

```
1. Helix core (@helix-ds/core)  ← always check first
2. Custom component             ← add comment: // [CUSTOM] reason
```

Helix components are built directly on native HTML elements — there is no primitive library
underneath to reach for. If a Helix component doesn't exist yet, file a request.

## Token usage

Use Helix semantic tokens, never Tailwind primitives directly:

```css
/* ✅ correct */
color: var(--helix-color-text-neutral);
background: var(--helix-color-fill-primary);

/* ❌ wrong */
color: #1a1a1a;
background: blue-600;
```

TypeScript constants are also available:
```ts
import { tokens } from '@helix-ds/tokens';
tokens.color.fill.primary; // '#1d4ed8'
```

## Props vocabulary

Use the canonical prop names below. Anti-synonyms are rejected by CI.

| ✅ Use       | ❌ Never    | Notes                          |
|-------------|------------|--------------------------------|
| `variant`   | `type`     | Visual style selector          |
| `size`      | `scale`    | `xs s m l xl`                  |
| `loading`   | `isLoading`| Boolean authored state         |
| `disabled`  | `isDisabled`| Boolean authored state        |
| `danger`    | `error`    | Destructive variant name       |
| `current`   | `active`   | Navigation selected state      |
| `onPress`   | `onClick`  | Primary action handler         |
| `label`     | `title`, `name` | Accessible text          |
| `icon`      | `leftIcon`, `startIcon` | Icon placement   |
| `iconEnd`   | `rightIcon`, `endIcon`  | Trailing icon    |

## AI context installation

To install Helix AI context in your project:

```bash
node node_modules/@helix-ds/core/scripts/setup-ai.mjs
# or, from a clone of this repo:
pnpm setup:ai [target-dir] [--dry-run]
```

This copies AGENTS.md into your project (never overwriting a hand-edited one — it flags
a conflict instead) and writes a pointer file for whichever AI tool directories it finds
already in your project (`.cursor/rules/helix.mdc`, `.github/copilot-instructions.md`).
Safe to run more than once. See `scripts/setup-ai.mjs` for exactly what it does and does
not touch.

## MCP servers (planned, not published yet)

The shape below is the intended direction — no `@helix-ds/storybook-mcp` or
`@helix-ds/tokens-mcp` package exists yet, so `setup:ai` does not write this
configuration for you today. Don't add it to your project's MCP config expecting it to
resolve.

```json
{
  "mcpServers": {
    "helix-storybook": {
      "command": "npx",
      "args": ["@helix-ds/storybook-mcp"]
    },
    "helix-tokens": {
      "command": "npx",
      "args": ["@helix-ds/tokens-mcp"]
    }
  }
}
```

Planned tools once published: `getComponentList`, `getComponentProps`, `getTokenValue`, `searchTokens`.

## What agents should NOT do

- Use `style={{ color: '#xxx' }}` — always use token CSS variables
- Create a `<div>` grid without importing a Helix layout component first
- Use `onClick` — prefer `onPress` (prop-map canonical)
- Use Figma prop names directly — they may not match Helix contracts
