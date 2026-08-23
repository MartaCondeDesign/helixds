# Helix DS — Agent Contract

Helix is an AI-ready design system built on native HTML elements, Tailwind CSS v4, and Tabler Icons.
Scope: `@helix-ds`. Token prefix: `--helix-`. Data prefix: `data-helix-`.

## Stack

| Layer     | Choice                              |
|-----------|-------------------------------------|
| Base      | Native HTML elements + hand-written WAI-ARIA (see [ADR-001](docs/ADR/ADR-001-primitive-foundation.md)) |
| Styling   | Tailwind CSS v4 — config in CSS     |
| Icons     | @tabler/icons-react                 |
| Tokens    | DTCG JSON → CSS vars + Tailwind @theme |
| Runtime   | React 19, TypeScript strict         |
| Monorepo  | pnpm workspaces                     |

## Critical rules

1. **Never add `<div>` for layout** — use the layout components in `packages/core/src/layout/`.
2. **Never render a Tabler icon directly — always go through the `Icon` component**
   (`packages/core/src/components/Icon/`, contract: `contracts/components/Icon.json`).
   `<IconPlus size={16} stroke={1.5} />` re-implements sizing/stroke/color/aria at every call site and
   drifts (that's exactly what happened before this rule existed — several components silently
   diverged from the contract's own "always 16px" wording). Every component that renders an icon —
   new or existing — must go through it instead: `<Icon icon={IconPlus} size={16} />`.
   - Component `icon`/`iconEnd` props take the Tabler icon **component reference**, not a
     pre-instantiated element: `icon?: TablerIcon`, not `icon?: React.ReactElement`. Consumers pass
     `icon={IconPlus}`, never `icon={<IconPlus size={16} />}`.
   - `pnpm verify:icons` scans `packages/**/*.tsx` for a raw `<IconXxx>` JSX tag outside
     `packages/core/src/components/Icon/` (the one legitimate place it renders one) and reports any
     violation — run it after adding or touching a component with an icon.
3. **Token policy — not a blanket rule, has real exceptions:**
   - **Color:** always a `--helix-*` token. No exceptions.
   - **Border-radius:** always a `--helix-*` token. No exceptions.
   - **Spacing/padding:** always a token, **except** values above `128px` (`primitive.spacing.32`,
     the top of the scale) — those have no token and are legitimately hardcoded px.
   - **Component height:** driven by the shared size scale (see ADR-004) — but documented
     per-component exceptions exist (`Badge`, `Chip` use a local density model, not the control ladder).
   - **min-width / max-width:** variable, not tokenized — decided by the consumer, the component, or
     the pattern in use. There is no system token for this — a hardcoded px value here is correct,
     not a violation (see `Button.json`'s `sizing.width` note).

   Token names live in `.ai/maps/prop-map.md`.
4. **Component hierarchy** — Helix core wraps a native HTML element directly (`<button>`, `<select>`, `<input>`, ...) and adds ARIA by hand where the native element doesn't already cover it. Components with **no native equivalent** (Dialog, Popover, Menu, Combobox, Tooltip, ...) need their own ADR and an explicit primitive choice before implementation — see [ADR-001](docs/ADR/ADR-001-primitive-foundation.md).
5. **Prop vocabulary** — canonical names in `.ai/maps/prop-map.md`. Anti-synonyms are invalid.
6. **New component requires a contract** — create `contracts/components/{Name}.json` first, then the implementation.
7. **Read the contract before touching a component** — the contract defines what the component IS.
8. **Figma is reference only** — Helix contracts always win over Figma output.

## Workflow commands

```
pnpm contract <Name>        scaffold a new component contract
pnpm verify:contract        validate contracts vs implementations
pnpm verify:props           check prop names against prop-map
pnpm verify:icons           check every Tabler icon renders through the Icon component
pnpm report:paints          CSS paint audit report
pnpm lint:ai                validate .ai/ directory structure
```

## Per-package context (load when working in that territory)

- `packages/tokens/CLAUDE.md`  — token pipeline, DTCG format, build steps
- `packages/core/CLAUDE.md`    — component anatomy, variant system, data-attributes, the `Icon` wrapper pattern
- `apps/storybook/CLAUDE.md`   — every story's title+description header rule, token-driven story pattern, Foundation structure

## Context files (read when task requires it)

- `.ai/maps/prop-map.md`               — canonical prop vocabulary + anti-synonyms
- `.ai/maps/patterns/`                 — design patterns (read the relevant .md before building that UI)
- `.ai/maps/component-token-exceptions.md` — every `component.*` token that skips `semantic.*` (primitive-direct
  or raw literal) + why. Update it whenever you add or edit a component token — see the file's own
  "Maintenance rule".
- `contracts/component.schema.json`    — JSON schema for component contracts
- `docs/ADR/`                          — architecture decisions (read the ADR governing what you're touching)
- `docs/ADR/ADR-004-size-standard.md`   — canonical size scale for interactive controls and fields
- `.ai/memory/agnostic-lessons.md`     — lessons from previous sessions

## Storybook

Stories live co-located with components in `packages/core/src/components/`. Pattern stories in `apps/storybook/stories/`.
Dev server: `pnpm --filter @helix-ds/storybook dev` (http://localhost:6006).

## What NOT to do

- Don't define colors in `:root` — tokens are defined in `packages/tokens/src/tokens.json`
- Don't import from `@helix-ds/tokens` using `..` relative paths from inside packages/core
- Don't write hover styles as JS props — use `data-*` attributes and CSS
- Don't list yourself as co-author on commits (no Co-Authored-By trailers)
