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

Icons are [Tabler Icons](https://tabler.io/icons) (`@tabler/icons-react`, a peer dependency of core),
always rendered through core's `Icon` component or a component's `icon` prop — never as a raw
`<IconXxx />` tag.

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

All components import from `@helix-ds/core`. Generated from `contracts/manifest.json` on every commit
(`pnpm docs:readme`) — do not edit the table by hand.

<!-- helix:component-inventory:start -->
| Component | Category | Purpose |
|---|---|---|
| `Accordion` | core | A single collapsible disclosure — a header that expands/collapses a panel of content, with no JS height measurement needed. |
| `AppShell` | layout | The top-level page shell — composes a SideNav, a TopBar, and the scrollable main content into one consistent full-height layout. |
| `Avatar` | core | Represents a person or entity as a small circular image or initials indicator — a table row, a nav footer, a comment author. |
| `AvatarGroup` | core | Shows several people or entities associated with the same record as a compact overlapping stack of Avatars, collapsing whatever doesn't fit into a '+N' count. |
| `Badge` | core | Communicates status, category labels, or counts in a compact, high-contrast capsule. |
| `Button` | core | Triggers an action or navigates to a destination when pressed by the user. |
| `Card` | core | Groups related content in a visually distinct, flat surface — a dashboard widget, a settings group, a gallery tile. |
| `Checkbox` | core | Lets users select one or more independent options from a set, or confirm a single binary choice. |
| `CheckboxGroup` | core | Lets users choose zero or more options from a small, visible set of independent choices. |
| `Chip` | core | Represents a compact selectable label for filters, categories, or short choices. |
| `ChipGroup` | core | Shows a small set of related chips side by side — categories, tags or applied filters — as one labelled group. |
| `FAB` | core | A single, prominent floating action reachable from anywhere in the current view — optionally expanding into 1-3 closely related actions via a speed-dial. |
| `Icon` | core | Communicates meaning, action, or status through a recognizable visual symbol. |
| `IconButton` | core | Triggers an action via a single icon, with no visible text label — a toolbar action, a row action, a close/dismiss control. |
| `Input` | core | Allows users to enter a single line of free-form text. |
| `Menu` | core | A Helix-styled, portaled popup listbox anchored to a trigger element — the internal primitive Select uses instead of a native <select> dropdown, and the foundation for any future popup list (Combobox, a context menu, a DatePicker's own internals). |
| `Modal` | core | A centered overlay that interrupts the page for a focused task or decision — blocks interaction with the rest of the page until dismissed. |
| `MultiSelect` | core | Lets users choose several values from a predefined list, shown as removable chips inside the field. |
| `NavItem` | core | A single entry in a persistent navigation list (a SideNav, a tab rail) that links to another view. |
| `PageHeader` | layout | Introduces a page or major section: title, optional supporting description, and trailing actions in one consistent row. |
| `RadioButton` | core | A single radio input — the individual option unit RadioGroup renders per choice, exposed on its own for cases that need one radio outside a full group (e.g. |
| `RadioGroup` | core | Lets users choose exactly one option from a small, visible set of mutually exclusive choices. |
| `SegmentedControl` | core | Lets users switch between a small, fixed set of mutually exclusive modes or views, with no associated content panel. |
| `Select` | core | Lets users choose a single value from a predefined list. |
| `SideNav` | layout | The persistent vertical navigation rail of an app shell — brand mark, primary nav entries, and a footer slot for the current user. |
| `SidePanel` | core | A modal panel anchored to the right edge of the viewport, for a persistent secondary task alongside — but still blocking — the main page (details, a form, a filter builder). |
| `Switch` | core | Lets users toggle a single setting on or off, with the change taking effect immediately. |
| `Table` | core | Displays tabular data edge-to-edge — rows and columns of related records, e.g. |
| `Textarea` | core | Lets users enter multi-line free-form text. |
| `Toast` | core | A Sonner-style stacking notification, fixed to the top-right corner, triggered imperatively (toast.success('Saved')) from anywhere — not tied to a piece of UI state the consumer renders conditionally, unlike Modal/SidePanel. |
| `Tooltip` | core | Reveals a short, non-interactive text label for whatever it wraps, on hover or keyboard focus — identifies an ambiguous control (an icon-only button, an avatar) without adding permanent visible text. |
| `TopBar` | layout | The fixed-height chrome bar at the top of a page — search, quick actions, and the current user, always in the same place. |
<!-- helix:component-inventory:end -->

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

From a clone of the Helix repo:

```bash
pnpm setup:ai [target-dir] [--dry-run]
```

This copies AGENTS.md into your project (never overwriting a hand-edited one — it flags
a conflict instead) and writes a pointer file for whichever AI tool directories it finds
already in your project (`.cursor/rules/helix.mdc`, `.github/copilot-instructions.md`).
Safe to run more than once. See `scripts/setup-ai.mjs` for exactly what it does and does
not touch.

## Common mistakes (seen in real eval runs)

These came up when an agent was asked to build with Helix without reading the contracts first
(`pnpm eval:generate`). Check them before writing the code:

- **Toast needs `<Toast />` mounted once** (near the app root). `toast.success(...)` only queues the
  notification; with no `<Toast />` nothing appears (Helix logs a console warning). Signature:
  `toast.success(label, description?)` — the description can also be `{ description }`.
- **TopBar's slots are `start` and `end`** — not `search`/`actions`, not `left`/`right`.
- **Canonical prop names only** — `onPress` (not `onClick`), `expanded` (not `open`/`isOpen`),
  `label` (not `title`/`name`), `checked` (not `active`/`selected`), `current` (not `active`). Full list:
  `.ai/maps/prop-map.md`.
- **Icons by reference** — `icon={IconPlus}`, never `icon={<IconPlus />}`, never a raw `<IconPlus />`.

## What agents should NOT do

- Use `style={{ color: '#xxx' }}` — always use token CSS variables
- Create a `<div>` grid without importing a Helix layout component first
- Use `onClick` — prefer `onPress` (prop-map canonical)
- Use Figma prop names directly — they may not match Helix contracts
