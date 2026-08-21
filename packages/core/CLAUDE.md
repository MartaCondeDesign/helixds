# @helix-ds/core — Agent Context

## What this package contains

All Helix UI components, built directly on native HTML elements + Tailwind CSS v4.
See [ADR-001](../../docs/ADR/ADR-001-primitive-foundation.md) for why there is no shadcn/ui or Radix primitive layer.

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
