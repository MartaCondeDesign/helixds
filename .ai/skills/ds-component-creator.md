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
pnpm verify:stable --details   # status from the 8 criteria (ADR-018) — needs Storybook running
```

#### Accessibility (mandatory — the component isn't done until all of this passes)

1. **Contract `a11y` section** — `role`, the `wcag` criteria it targets, and `keyboardNav`: every key it
   responds to, one entry each (`"Escape — closes"`, `"Arrow Up/Down — moves the highlight"`). An
   interactive component (it takes `onClick`, `onChange`, `onSelect`, `onDismiss`, `expanded`…) with no keys
   is rejected. If the keys live on another component (Menu ← Select), say so in the entry.
2. **A `play` test per key** in its stories — `userEvent.keyboard('{Escape}')`, `userEvent.tab()` — asserting
   the effect, and that focus lands where it should: when Escape closes something, assert
   `expect(trigger).toHaveFocus()` right after — it's required (WCAG 2.4.3).
   If it opens (dialog, panel, menu, toast), add an `Opened` story tagged `['!autodocs']` whose play leaves it
   open — otherwise no browser check ever sees the open state.
   Steps 1–2 are checked on every commit by `pnpm verify:a11y-contracts` (no browser needed).
3. **Browser checks** (need Storybook running — `pnpm sb`), for just this component:
   ```bash
   pnpm --dir apps/storybook test-storybook --url http://localhost:6006 stories/Components/{Name}.stories.tsx
   pnpm verify:stable --skip-browser --details
   ```
   Criteria 4, 5 and 6 must be ✓: axe (WCAG 2.2 AA) clean in light AND dark, visible focus on every tab stop
   in both themes (2.4.7), every target ≥ 24×24 px or well spaced (2.5.8), and — for Layout/ and Pages/
   stories — no horizontal scroll at 320 px (1.4.10), and a screen reader hears the role the contract promises
   (ariaSnapshot; set `a11y.announces` when `role` is conditional). Each failure names the element, theme and
   story. What's announced per story is written to `.ai/aria/{Name}.yml` — read it.
4. **AI visual review** (advisory, ~3 cents): `pnpm a11y:visual {Name}` — color-only meaning, non-text contrast,
   label in name, clipped text, focus clarity. Findings land in `.ai/a11y-visual/{Name}.json` to confirm.
5. **A person, once**: go through it with a real screen reader (VoiceOver: Cmd+F5), check the AI findings,
   and record it — `pnpm a11y:review {Name} --by "<who>" --with "VoiceOver + Safari" --result pass|issues`.
   Never record a review on someone's behalf.

Before calling the component done, create what `verify:stable` checks (ADR-018): a story per variant,
size and authored state; a keyboard `play` test per key in `a11y.keyboardNav` (`userEvent.keyboard('{Enter}')`,
`userEvent.tab()`… from `@storybook/test`); `<MotionConfig reducedMotion="user">` around any Motion
animation; a filled eval prompt. Never set `status` by hand — the script does.

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
- [ ] `pnpm verify:a11y-contracts` passes (role, WCAG, keys for an interactive component, a play test per key)
- [ ] `verify:stable --details` shows criteria 4–6 ✓ for it: axe light + dark, visible focus, target size, reflow
- [ ] Accessible names read sensibly, and it was tried once with a real screen reader
- [ ] Dark mode renders correctly (check in Storybook with theme toggle)
- [ ] No hardcoded hex/px/rem in component CSS
