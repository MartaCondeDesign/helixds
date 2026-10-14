---
name: use-helix
description: Build a screen, form, dialog or any UI with Helix DS (@helixds/react). Use BEFORE writing JSX that imports @helixds/react — it says where each component's real props are and the mistakes agents make when they guess.
applyTo: ["**/*.tsx"]
---

# Skill: Use Helix

## Scope

Writing product UI that consumes Helix: pages, forms, dialogs, settings, empty states — any `.tsx` that
imports `@helixds/react`. Does not cover: building or changing a Helix component itself
(`ds-component-creator`), or Figma work (`*-to-figma`).

## Process

### Step 1 — Never guess a prop: read the component's real API first

Helix props are deliberately not the names other libraries use, so a guessed prop is usually wrong.
Before using a component, read its API from the first source available:

1. **MCP** (if the `helix` server is connected): `helix_get_contracts` with EVERY component you'll use, layout
   ones included (PageHeader, Card…) — the components you skip are where guessed props come from. Its `import`
   field is the exact line to copy; the package is always `@helixds/react`, never `@helix/…` or `@helix-ds/…`.
2. **Type file**: find where `@helixds/react` resolves (`tsconfig.json` `paths`, `vite.config.ts`
   `alias`, or `node_modules/@helixds/react/`), then read
   `components/<Name>/<Name>.types.ts` (source) or `dist/components/<Name>/<Name>.types.d.ts` (npm).
3. **Contract**: `node_modules/@helixds/react/dist/contracts/<Name>.json` (shipped in the npm package),
   or `contracts/components/<Name>.json` inside the Helix repo — props, required flags, `neverUseFor`.
   The prop vocabulary (canonical names and the wrong ones to avoid) is next to it:
   `node_modules/@helixds/react/dist/prop-map.md`.

Props marked required (`label` on most form controls) are required; leaving one out fails `tsc`.

### Step 2 — Check these before writing (the mistakes agents make most)

| Component | ✅ Helix | ❌ What agents guess |
|---|---|---|
| `Button` | text as **children**: `<Button variant="danger">Delete</Button>` | `label="Delete"` |
| `Input`, `Select`, `Textarea`, `Checkbox`… | `label` is **required** (`hideLabel` hides it visually on Input/Select/Textarea) | omitting `label`, a separate `<label>` |
| `Select` | `options={[{ value, label }]}`; `onChange` receives the **value** | `<option>` children; `e.target.value` |
| `PageHeader` | `label` (+ `description`, `actions`) | `title` |
| `Modal` | `label`, `expanded`, `onDismiss`, children | `open`/`isOpen`, `onClose`, `title` |
| Any action | `onClick` | `onPress`, `onTap` |
| Loading | `isLoading` | `loading` |
| Errors on a field | `invalid` + `errorMessage` on the field itself | a hand-built error `<p>` |
| Any Helix component | no `style` prop — space it from a wrapping `<div style={{ … token … }}>` | `style={{ marginTop }}` on `Card`, `Button`… |

### Step 3 — Layout and spacing only through tokens

No raw `px`/`rem`/hex anywhere — not in `style={{}}`, not in CSS:

- Spacing: `var(--helix-spacing-{3xs|2xs|xs|s|m|l|xl})`, or the intent-named
  `--helix-spacing-component-*` (inside a component) / `--helix-spacing-layout-*` (between sections).
- Colors: semantic tokens only, e.g. `var(--helix-color-text-neutral-light)`,
  `var(--helix-color-fill-surface)`. Find one with `helix_search_tokens` or in `@helixds/tokens/helix.css`.
- Prefer a Helix layout component (`Card`, `AppShell`, `PageHeader`) over a styled `<div>`.

### Step 4 — Validate before finishing

Run `helix_validate_snippet` via MCP — it lints the code and type-checks it against Helix's real source
(`compileErrors`: invented props, a missing required prop, a wrong handler signature), so `valid: true`
means both passed. Without the MCP, run the project's typecheck (`tsc --noEmit`). If you can do neither,
re-read every Helix element you wrote against its type file from Step 1.

## Output

A `.tsx` that imports only from `@helixds/react` (plus React and local files), uses only props that
exist in each component's type file, and has no raw spacing/color values.

## Regression checklist

- [ ] Every Helix component used had its type file or contract read in this session
- [ ] No `label` prop on `Button`; every form control has `label`
- [ ] `Select` gets `options`, not `<option>` children
- [ ] No raw `px`/`rem`/hex in `style={{}}` or CSS — only `--helix-*` tokens
- [ ] Typecheck passes (or every element was re-checked by hand)
