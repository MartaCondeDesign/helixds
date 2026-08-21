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

| Component  | Status | Import path                              | Purpose                      |
|------------|--------|------------------------------------------|------------------------------|
| Button     | ✅ stable | `@helix-ds/core`                      | Actions, CTAs, links         |
| Input      | ✅ stable | `@helix-ds/core`                      | Text input, search           |
| Badge      | ✅ stable | `@helix-ds/core`                      | Status, counts, labels       |
| Chip       | 🚧 beta   | `@helix-ds/core`                      | Selectable tags / filters    |
| Card       | 🚧 beta  | `@helix-ds/core`                      | Content grouping, widgets    |
| Dialog     | 🚧 beta  | `@helix-ds/core`                      | Modal overlays               |
| Select     | 🚧 beta  | `@helix-ds/core`                      | Dropdown selection           |

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
color: var(--helix-color-text-default);
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

To install Helix AI context in your project (Claude, Gemini, Copilot):

```bash
npx @helix-ds/cli setup-ai
```

This copies AGENTS.md to the correct location for each detected AI tool and
configures MCP servers if available.

## MCP servers (when available)

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

Tools exposed: `getComponentList`, `getComponentProps`, `getTokenValue`, `searchTokens`.

## What agents should NOT do

- Use `style={{ color: '#xxx' }}` — always use token CSS variables
- Create a `<div>` grid without importing a Helix layout component first
- Use `onClick` — prefer `onPress` (prop-map canonical)
- Use Figma prop names directly — they may not match Helix contracts
