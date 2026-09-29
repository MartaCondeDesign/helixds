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

## MCP server

`packages/mcp` is a working MCP server (`helix`, stdio) that answers questions about Helix
directly — no need to read the repo's files yourself. It reads the repo live on every call
(contracts, manifest, tokens.json + the built CSS, prop-map, patterns, this file), so it can't
drift from the source.

| Tool | What it answers |
|---|---|
| `helix_list_components` | Which components exist, their category, status and purpose |
| `helix_get_component` | One component's full contract (props, states, keyboard, sizing), import line, status |
| `helix_search_tokens` | Tokens matching words/values, with real light **and** dark values |
| `helix_get_token` | One token by CSS variable or path, with its alias chain |
| `helix_check_props` | Whether prop names are canonical (flags `onClick`, `isOpen`…) and exist on a component |
| `helix_list_patterns` / `helix_get_pattern` | Documented compositions and their code |
| `helix_get_rules` | This guide + the full prop vocabulary |

**Inside this repo** it's already registered in `.mcp.json` — Claude Code picks it up (approve it
once when asked, or check with `/mcp`).

**From another project**, point it at a Helix checkout with `HELIX_ROOT` (it isn't published to npm
yet, so it runs from the repo):

```json
{
  "mcpServers": {
    "helix": {
      "command": "/path/to/helix-ds/packages/mcp/node_modules/.bin/tsx",
      "args": ["/path/to/helix-ds/packages/mcp/src/index.ts"],
      "env": { "HELIX_ROOT": "/path/to/helix-ds" }
    }
  }
}
```

## What agents should NOT do

- Use `style={{ color: '#xxx' }}` — always use token CSS variables
- Create a `<div>` grid without importing a Helix layout component first
- Use `onClick` — prefer `onPress` (prop-map canonical)
- Use Figma prop names directly — they may not match Helix contracts
