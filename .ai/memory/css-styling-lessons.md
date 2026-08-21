# CSS + Styling Lessons — Helix DS

---

## Layer ordering in globals.css

**Lesson:** The CSS cascade in `packages/core/src/globals.css` follows this order:
```css
@layer base, tokens, components, utilities;
```
Component styles must go in `@layer components`. Any style outside a named layer
wins over layered styles, causing invisible specificity fights.

---

## Focus-visible, not focus

**Lesson:** Always use `:focus-visible` for keyboard focus rings, never `:focus`.
The `:focus` selector fires on mouse clicks too, creating a jarring ring on click.
Our token is `--helix-color-border-focus`.

---

## Dark mode via data-theme, not media query alone

**Lesson:** Helix tokens define their dark values under both `[data-theme="dark"]`
AND `@media (prefers-color-scheme: dark)`. Always define tokens in both places.
A token only under `[data-theme="dark"]` doesn't apply when the user's OS is dark
but no explicit toggle has been set.

---

## @theme and var() don't mix

**Lesson:** Inside a Tailwind v4 `@theme {}` block, you can't use `var(--helix-*)`.
The `@theme` block maps Tailwind utility names to raw values. Use the resolved hex/oklch
value or a reference to the Helix token value (not the CSS variable):
```css
/* ✅ */
@theme { --color-primary: oklch(45% 0.18 264); }
/* ❌ — doesn't resolve at build time */
@theme { --color-primary: var(--helix-color-fill-primary); }
```

---

## Padding on interactive elements

**Lesson:** Never set padding directly on `<button>` or `<a>` — set it on the inner
`<span data-helix-part="button-label">`. This preserves the hit area and prevents
padding from affecting the background-clip in complex styling.

---

## Tailwind v4 @apply is gone

**Lesson:** Tailwind v4 removed `@apply`. If you see `@apply` in component CSS, it's a v3
remnant. Replace with explicit utility classes in JSX or raw CSS custom property references.
