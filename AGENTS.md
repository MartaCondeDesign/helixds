# Helix DS — Consumer Agent Guide

> For teams using Helix in their apps. If you're contributing to Helix itself, read `contributor-ai/CONTRIBUTOR.md` instead.

> **Before writing any JSX with `@helixds/react`: read each component's real props first** — the
> `use-helix` skill, `helix_get_contract` (MCP), or the component's `<Name>.types.ts`. Never guess a prop:
> Helix names differ from other libraries (`Button` takes its text as children, not `label`; form
> controls require `label`; `Select` takes `options`). Use only `--helix-*` tokens for spacing and color.

## What is Helix?

A design system built for teams building AI-powered products. Components have explicit contracts,
predictable token structure, and machine-readable documentation.

## Available packages

| Package               | Purpose                              | Install                         |
|-----------------------|--------------------------------------|----------------------------------|
| `@helixds/react`      | All UI components                    | `pnpm add @helixds/react`       |
| `@helixds/tokens`    | CSS tokens + TypeScript constants    | `pnpm add @helixds/tokens`     |

Icons are [Tabler Icons](https://tabler.io/icons) (`@tabler/icons-react`, a peer dependency of core),
always rendered through core's `Icon` component or a component's `icon` prop — never as a raw
`<IconXxx />` tag.

## Data Analytics

For metrics and data visualisation, use Helix's `Chart` component. It is the only supported chart renderer
and is branded through Apache ECharts using Helix semantic tokens. Never import ECharts directly, pass raw
ECharts options, or introduce another chart library. Choose `variant="line"`, `"bar"`, `"stacked-bar"`,
`"donut"`, or `"timeline"` based on the reader's question; compose charts with Helix `Card`, `Table`,
`Badge`, and `Tooltip` rather than recreating those UI pieces inside a chart.

## Setup (required, once)

```tsx
// app/layout.tsx or main.tsx
import '@helixds/tokens/helix.css';   // CSS custom properties
import '@helixds/react/globals.css';   // Tailwind base + component styles
```

## Component inventory

Every component's current status (draft / beta / stable) is **computed**, not listed here — see
Storybook → **Status**, or `contracts/stability.json` (`pnpm verify:stable`, ADR-018). draft = exists and
works; beta = passes all 8 automatic quality criteria; stable = beta + modeled in Figma.

All components import from `@helixds/react`. Generated from `contracts/manifest.json` on every commit
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
| `Chart` | core | Visualizes a metric with a token-branded, accessible chart so people can understand trends, comparisons, composition, or events. |
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
1. Helix core (@helixds/react)  ← always check first
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
import { tokens } from '@helixds/tokens';
tokens.color.fill.primary; // '#1d4ed8'
```

## Lint while you write

`@helixds/eslint-plugin` catches the mistakes agents make most — an invented import path
(`@helixds/react` → `@helixds/react`), anti-synonym props and values (`onPress` → `onClick`,
`size="md"` → `size="m"`), raw colors (`#1d4ed8` → the semantic token with that color) and native
controls (`<button>` → `Button`). Run `pnpm lint` (or `npx eslint --fix <file>`) after writing UI code;
the editor shows the same warnings live. See `packages/eslint-plugin/README.md`.

## Props vocabulary

Use the canonical prop names below. Anti-synonyms are rejected by CI.

| ✅ Use       | ❌ Never    | Notes                          |
|-------------|------------|--------------------------------|
| `variant`   | `type`     | Visual style selector          |
| `size`      | `scale`    | `xs s m l xl`                  |
| `isLoading`   | `loading`| Boolean authored state         |
| `disabled`  | `isDisabled`| Boolean authored state        |
| `danger`    | `error`    | Destructive variant name       |
| `current`   | `active`   | Navigation selected state      |
| `onClick`   | `onPress`  | Primary action handler         |
| `label`     | `title`, `name` | Accessible text          |
## Agent Readiness & Governance (Can it? Should it? May it?)

When an AI agent makes design or implementation decisions using Helix, it must validate three levels of readiness:

1. **Can it? (Mechanical Readiness)**:
   - Does the generated code compile and use valid tokens (`var(--helix-color-...)`)?
   - Are canonical props (`onClick`, `variant`, `expanded`) used according to component contracts?
   - Query Helix via CLI (`pnpm helix component <Name>`) or contracts to fetch machine-readable props and types.

2. **Should it? (Design Judgment Readiness)**:
   - Does the usage respect `neverUseFor` anti-patterns documented in the component contract?
   - Does it preserve accessibility contracts (WCAG AA, focus trapping, aria semantics)?
   - Are responsive constraints and layout components (`AppShell`, `TopBar`, `SideNav`) respected?

3. **May it? (Authority & Governance Readiness)**:
   - **Consuming apps**: Agents MAY use core Helix components and create local custom components flagged with `// [CUSTOM] reason`.
   - **Boundary Enforcement**: Agents MAY NOT alter shared token CSS variables directly (`style={{ color: '#xxx' }}`), override internal padding/height tokens, or redefine component prop contracts.
   - **Escalation**: If a requested UI pattern cannot be achieved with existing Helix components or local composition, the agent MUST flag it for human review or file a request for Helix DS.

## AI context installation

## Helix MCP tools (preferred when your client supports MCP)

The repo registers a `helix` MCP server (`.mcp.json`, `pnpm helix:mcp`). Use its tools instead of reading
files or shelling out:

1. `helix_list_components` — check Helix has the component before building anything.
2. `helix_get_contract` — exact props, accessibility and governance for the component you're using.
3. `helix_search_tokens` — the token for a concept ("danger background", "subtle text"); never hardcode.
4. `helix_validate_snippet` — run your JSX through it before writing the file; apply `fixedCode`, then
   fix what's left in `remainingAfterFix`.

## Querying Helix from a terminal

When an agent has shell access, use the read-only CLI to discover the exact Helix guidance needed
instead of searching source files broadly. It reads the same contracts, tokens, and patterns used by
the design system — it does not maintain a second copy of the documentation.

```bash
pnpm helix search "confirmation dialog" --json
pnpm helix component Modal --json
pnpm helix token color.fill.primary-interactive-default --json
pnpm helix pattern empty-state --json
```

Use `pnpm helix batch --command "component Button" --command "token color.fill.primary-interactive-default" --json`
when several lookups are needed. If no shell is available, consult `contracts/manifest.json`, the
specific component contract, and `.ai/maps/` directly.

When no Helix component covers what you need, scaffold the custom one instead of writing it from
scratch — it comes with the `// [CUSTOM] reason:` header, semantic tokens, an accessible base and a
Storybook story whose `play` function is its first test:

```bash
pnpm helix scaffold:custom UsageMeter --reason "Helix has no meter component" --dir src/custom/UsageMeter
```

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
- **Canonical prop names only** — `onClick` (not `onPress`), `expanded` (not `open`/`isOpen`),
  `label` (not `title`/`name`; but `Button` takes its text as children, never `label`), `checked` (not `active`/`selected`), `current` (not `active`). Full list:
  `.ai/maps/prop-map.md`.
- **Icons by reference** — `icon={IconPlus}`, never `icon={<IconPlus />}`, never a raw `<IconPlus />`.

## What agents should NOT do

- Use `style={{ color: '#xxx' }}` — always use token CSS variables
- Create a `<div>` grid without importing a Helix layout component first
- Use `onPress` — prefer `onClick` (prop-map canonical)
- Use Figma prop names directly — they may not match Helix contracts
