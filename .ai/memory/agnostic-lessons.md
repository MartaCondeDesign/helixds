# Agnostic Lessons — Helix DS

Learned from real sessions. Add entries here when something non-obvious corrects an agent's behavior.

---

## Token reference format

**Lesson:** When referencing tokens in component CSS, always use the full `--helix-*` prefix.
Shorthand or alias references (e.g., just `--color-primary`) resolve inconsistently across build
environments. Use `var(--helix-color-fill-primary)` every time.

---

## Contract-first discipline

**Lesson:** Starting a component from the implementation instead of the contract leads to
prop-name drift. The contract in `contracts/components/{Name}.json` must exist and be approved
before the first `.tsx` file is created. The `pnpm contract <Name>` command scaffolds both.

---

## data-* attributes are the correct styling surface

**Lesson:** Don't style variants with class selectors like `.button--primary`. Use `data-variant="primary"`
and target it in CSS with `[data-variant="primary"]`. This keeps the contract between
markup and styles explicit and queryable by external tooling.

---

## No primitive library — native HTML elements only

**Lesson:** Components wrap native HTML elements directly (`<button>`, `<select>`, `<input>`) with
hand-written ARIA — there is no shadcn/ui or Radix layer (see ADR-001). Don't run
`pnpm dlx shadcn@latest add <component>` or import from `@radix-ui/*`; there's no `ui/` folder to
add primitives to. Components with no native HTML equivalent (Dialog, Menu, Combobox, Tooltip)
need their own ADR before implementation.

---

## Tabler Icons: always use the named export pattern

**Lesson:** `import { IconArrowRight } from '@tabler/icons-react'` (named import). Never
use the default import or the inline SVG path. Pass `size` and `stroke` via token-derived values,
not hardcoded numbers.

---

## Tailwind v4: no tailwind.config.js

**Lesson:** Tailwind v4 reads configuration entirely from CSS using `@import "tailwindcss"` and `@theme {}`.
There is no `tailwind.config.js`. When troubleshooting missing utilities, check `packages/core/src/globals.css`
first — that's where the `@theme` block lives.

---

## Type narrowing for `data-*` props

**Lesson:** TypeScript's `data-*` attribute types accept `string | undefined` on HTML elements.
For authored state props (loading, disabled, invalid), pass them as the literal attribute
string `"true"` or `undefined` (not boolean `true`/`false`):
`data-loading={loading ? "true" : undefined}`.

---

## CI gate sequencing

**Lesson:** Run `verify:props` before `verify:contract`. Prop violations produce noisy errors
inside contracts. Fixing names first produces cleaner contract output.

---

## Figma: look up variables with a guard

**Lesson:** `node.setBoundVariable('paddingTop', undefined)` doesn't throw — it silently leaves the
padding at 0, and the audit still passes (an unbound 0 isn't "hardcoded"). Not every code token has a
Figma variable with the same name (`spacing/component-xl` doesn't exist in Figma; its value is
`spacing/l`). Look variables up with a helper that throws on a miss, and check a screenshot.

---

## Figma: images go through `upload_assets`, not the Plugin API

**Lesson:** `figma.createImageAsync` isn't available inside `use_figma`. Create the target layers
(rectangles) first, then call the Figma MCP `upload_assets` tool with their `nodeIds` and POST the image
bytes to each returned URL — the image lands as the layer's fill. Keep the source files in the repo
(e.g. `apps/storybook/public/avatars`) so code and Figma use the same pictures.
