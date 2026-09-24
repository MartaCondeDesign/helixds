# @helix-ds/core — Agent Context

## What this package contains

All Helix UI components, built directly on native HTML elements + Tailwind CSS v4.
See [ADR-001](../../docs/ADR/ADR-001-primitive-foundation.md) for why there is no shadcn/ui or Radix primitive layer.

**Before building a new component, check `contracts/manifest.json`** — the generated index of every existing
component (status, contract/implementation/story paths, real exports). It's the fast way to confirm
something doesn't already exist under a different name, and to see which components are still `draft`/`beta`
(patterns worth copying with more caution than a `stable` one). After adding a component — contract,
`index.ts` export, doc export, type export, and Storybook story all in place — run `pnpm docs:manifest` to
regenerate it; a non-empty `drift` array in the output means one of those five pieces is still missing.

```
src/
  components/
    Button/   ← reference implementation — read before creating any new component
    Input/    ← form element pattern
    Badge/    ← stateless display pattern
  lib/
    utils.ts  ← cn() = clsx + tailwind-merge
  globals.css ← all component CSS (@layer components)
  index.ts    ← public API
```

## Component anatomy pattern

Every component uses `data-helix-part` attributes to expose its internal structure:

```tsx
<button data-helix-part="button" data-variant="primary" data-size="m">
  <span data-helix-part="button-icon" aria-hidden="true">{icon}</span>
  <span data-helix-part="button-label">Save</span>
</button>
```

CSS targets these attributes — never class selectors:

```css
[data-helix-part="button"][data-variant="primary"] { background: var(--helix-color-fill-primary); }
```

## Icons — always through the `Icon` wrapper

`src/components/Icon/` wraps every Tabler icon usage. **Never render a Tabler icon component directly**
(`<IconPlus size={16} stroke={1.5} />`) — sizing, stroke, color, and aria all live in one place instead of
being re-implemented (and drifting) at every call site. `pnpm verify:icons` enforces this by scanning
`packages/**/*.tsx` for a raw `<IconXxx>` tag outside `src/components/Icon/`.

```tsx
import { Icon } from '../Icon';

<span data-helix-part="button-icon">
  <Icon icon={icon} size={16} />
</span>
```

**Never pass `stroke` to adjust how heavy an icon looks.** `Icon` derives it from `size` via the
stroke rule in `Icon/iconStroke.ts` (ADR-017): a real on-screen line of 1.3px at 12 → 2.8px at 40.
To make icons heavier or lighter, change `ICON_STROKE_PX_BY_SIZE` there (and keep ADR-017 +
`Icon.json`'s `iconStyle.helixStrokeRule` in sync) — every icon in the system follows. A per-call
`stroke` is only for a deliberate, commented one-off at least as thick as the rule (Checkbox's
checkmark).

A component's `icon`/`iconEnd` prop takes the icon **component reference**, typed `TablerIcon` (from
`@tabler/icons-react`) — not a pre-instantiated `React.ReactElement`. Consumers pass `icon={IconPlus}`,
never `icon={<IconPlus size={16} />}`. See `Button`, `Badge`, `Chip`, `Input` for the pattern, and
`contracts/components/Icon.json` for the full contract (allowed sizes, color rules, a11y).

## State pattern

| State     | How to apply                             |
|-----------|------------------------------------------|
| loading   | `data-loading="true"` + `aria-busy="true"` + `disabled` |
| disabled  | native `disabled` attribute only         |
| invalid   | `data-invalid="true"` + `aria-invalid="true"` |
| expanded  | `aria-expanded={expanded ? 'true' : 'false'}` |

Never use `data-state="hover"` — intrinsic states are CSS-only.

## No primitive layer

Components wrap a native HTML element directly (`<button>`, `<select>`, `<input type="checkbox">`, ...) —
there is no `ui/` folder and no shadcn/Radix dependency to install. Add WAI-ARIA attributes by hand only
where the native element doesn't already cover the interaction (see `Select`, `Checkbox` for examples).

No component depends on Radix or any other primitive library — `Button` always renders a real `<button>`.

Components with no native HTML equivalent (Dialog, Popover, Menu, Combobox, Tooltip, ...) are **out of
scope** for this pattern — hand-rolling their keyboard/focus/ARIA behavior is high-risk. Each one needs
its own ADR and an explicit primitive choice (Radix or otherwise) before implementation.

## Tailwind v4

No `tailwind.config.js`. All config is in `src/globals.css` using `@import "tailwindcss"` and `@theme {}`.
No `@apply` — it was removed in v4. Use explicit CSS with token variables.

## The canonical reference

`src/components/Button/` is the canonical reference implementation.
Read all 4 files before creating a new component: `Button.tsx`, `Button.types.ts`, `Button.doc.ts`, `index.ts`.
