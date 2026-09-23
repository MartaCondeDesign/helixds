---
name: ds-component-creator
description: Create a new Helix DS component end-to-end
applyTo: []
---

# Skill: Create a Helix Component

## Scope

Creating a new component in `packages/core/src/components/` from contract to implementation.
Does not cover: token changes, documentation site, Figma Code Connect.

## Process

### Step 1 — Pre-implementation checklist (mandatory)

Before writing any `.tsx` file:

- [ ] Check `AGENTS.md` component inventory — does the component exist already?
- [ ] Check `contracts/components/` — does the contract exist?
- [ ] Check `.ai/maps/prop-map.md` — identify the canonical prop names for this component's API
- [ ] Does this component need a liquid motion effect (a gooey merge, a trailing thumb, a bend-on-drag)?
      Check `.ai/maps/patterns/motion-effects.md` for the approved component↔effect table and the token/
      reduced-motion rules **before** inventing ad-hoc motion — don't reach for a new animation approach
      per component when one is already governed
- [ ] Run `pnpm contract <ComponentName>` — scaffolds the contract **and** a matching eval prompt
      (`evals/prompts/{name}-basic.md`) in one step, so the component gets vibe-test coverage from day one
- [ ] Read the generated contract stub and fill in: purpose, states, anatomy, props, tokenPolicy, sizing
- [ ] Get contract approved (run `pnpm verify:contract`) before writing implementation
- [ ] Fill in the generated eval prompt's Success criteria / Invalid patterns from the finished contract,
      then run `pnpm eval:run --prompt {name}-basic` — if the reference code you write doesn't score 100%,
      the criteria are ambiguous
- [ ] **Mandatory, per [`ds-preview-before-ship.md`](ds-preview-before-ship.md):** before writing the real
      `.tsx`, build a live visual preview (Artifact or unexported Storybook story) of the component using
      the contract's real anatomy/tokens, and get explicit sign-off. `verify:contract` checks the spec is
      internally consistent; it doesn't tell you the thing looks right — this step does.

### Step 2 — Scaffold the component

```
packages/core/src/components/{Name}/
  {Name}.tsx           ← component implementation
  {Name}.types.ts      ← TypeScript prop types
  {Name}.doc.ts        ← ComponentDoc object (machine-readable)
  {Name}.stories.tsx   ← Storybook stories
  index.ts             ← barrel export
```

Generate `{Name}.types.ts` from the now-filled contract instead of writing it by hand:
`pnpm generate:types {Name}` (add `--dry-run` to preview without writing). It derives the union type
aliases, the `extends React.{Tag}HTMLAttributes<...>` clause from the contract's root anatomy element,
and skips native-passthrough props (`disabled`, `className`, `onChange`, ...) that come from that extends
clause instead of needing an explicit field. **Still review the output** — JSDoc is copied verbatim from
the contract's (longer) prop descriptions and usually needs trimming to match the house style in
`packages/core/src/components/Button/Button.types.ts`; an `Omit<...>` beyond `'onClick'`, or a root
element the generator doesn't recognize, needs a manual fix too. Refuses to overwrite an existing file —
for an already-implemented component, run `pnpm verify:types` instead to check it's still in sync with
the contract.

### Step 3 — Implementation rules

1. Wrap the native HTML element directly (`<button>`, `<select>`, `<input>`, ...) and add WAI-ARIA by
   hand where the native element doesn't already cover it — no shadcn/Radix primitive layer (see
   [ADR-001](../../docs/ADR/ADR-001-primitive-foundation.md)). A component with **no native
   equivalent** (Dialog, Popover, Menu, Combobox, Tooltip, ...) needs its own ADR and an explicit
   primitive choice before implementation — don't reach for shadcn/Radix as a default.
2. Use `React.forwardRef` — all Helix components are forwardRef
3. Add `data-helix-part="{component-name}"` to the root element
4. Add `data-variant={variant}` and `data-size={size}` for styleable variants
5. Pass `loading` / `disabled` as `data-loading="true"` (string, not boolean)
6. Use `cn()` from `../../lib/utils` for class merging
7. Never hardcode hex, px, rem — use `--helix-*` tokens via CSS

### Step 4 — Token policy

For each anatomical part, check that every CSS property references a token:

```css
/* component CSS — in globals.css under @layer components */
[data-helix-part="button"] {
  background: var(--helix-color-fill-primary);
  color:      var(--helix-color-text-inverse);
  padding:    var(--helix-spacing-3) var(--helix-spacing-5);
  radius:     var(--helix-radius-m);
}
```

### Step 5 — Doc file

Fill in `{Name}.doc.ts` with:
```ts
export const doc: ComponentDoc = {
  name: '{Name}',
  purpose: '...',
  variants: [...],
  sizes: [...],
  examples: [...],
};
```

### Step 6 — Export

Add to `packages/core/src/index.ts`:
```ts
export { {Name} } from './components/{Name}';
export type { {Name}Props } from './components/{Name}/{Name}.types';
```

### Step 7 — Verify

```bash
pnpm verify:contract   # contract's own structure/naming against the schema (not the implementation)
pnpm verify:types      # contract props actually present in {Name}.types.ts — the real cross-check
pnpm verify:props      # no anti-synonym prop names
pnpm typecheck         # TypeScript strict mode
```

## Output

A complete, contract-backed component with:
- Typed props (no `any`, no `object`)
- `data-*` anatomy attributes on every meaningful part
- Token-only CSS (no hardcoded values)
- Storybook stories for all variants × states
- ComponentDoc object for machine-readable documentation

## References

- `contracts/component.schema.json` — JSON Schema for contracts
- `.ai/maps/prop-map.md` — canonical prop names
- `packages/core/src/components/Button/` — canonical reference implementation
- `docs/ADR/ADR-001-primitive-foundation.md` — why components wrap native HTML elements, not shadcn/Radix

## Regression checklist

- [ ] `pnpm verify:contract` passes with 0 errors
- [ ] `pnpm verify:types` passes with 0 errors
- [ ] `pnpm verify:props` passes with 0 warnings
- [ ] `pnpm typecheck` passes
- [ ] All variants render in Storybook without console errors
- [ ] Component is accessible: keyboard-navigable, has visible focus ring, correct ARIA role
- [ ] Dark mode renders correctly (check in Storybook with theme toggle)
- [ ] No hardcoded hex/px/rem in component CSS
