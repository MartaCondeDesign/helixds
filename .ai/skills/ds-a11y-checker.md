---
name: ds-a11y-checker
description: Accessibility audit for a Helix component
applyTo: ["packages/core/src/components/**/*.tsx"]
---

# Skill: Accessibility Audit

## Scope

Auditing a single Helix component for WCAG 2.2 AA compliance.
Does not cover: full-page audits, screen reader testing on physical devices.

## Process

### Step 1 — Role + semantics

- [ ] Does the root element have the correct implicit or explicit ARIA role?
- [ ] Is `aria-label` or `aria-labelledby` present when there is no visible text?
- [ ] For icon-only variants, is `aria-label` on the button + `aria-hidden="true"` on the icon?

### Step 2 — Keyboard interaction

- [ ] Is the component reachable via Tab?
- [ ] Does it respond to Enter/Space (for buttons) or Arrow keys (for navigation)?
- [ ] Does focus stay inside modal dialogs? (check Dialog component)
- [ ] Is focus returned to trigger when modal closes?
- [ ] Is there a visible focus ring using `--helix-color-border-focus`?

### Step 3 — Color contrast

Run checks using the token values from `packages/tokens/src/tokens.json`:
- [ ] Text on fill: minimum 4.5:1 (AA), target 7:1 (AAA) for body text
- [ ] Text on fill: minimum 3:1 for large text (≥18pt or ≥14pt bold)
- [ ] UI components and states: minimum 3:1
- [ ] Danger state: check `--helix-color-text-danger` on white and dark backgrounds

### Step 4 — State communication

- [ ] `loading` state: `aria-busy="true"` + `aria-live` region for feedback
- [ ] `disabled` state: native `disabled` attribute (not just `aria-disabled`)
- [ ] `invalid` state: `aria-invalid="true"` + `aria-describedby` pointing to error message
- [ ] `required` state: `aria-required="true"` or native `required`

### Step 5 — Motion

- [ ] Are transitions wrapped with `@media (prefers-reduced-motion: reduce)`?
- [ ] No auto-playing animation without user control

## Output

A checklist with:
- ✅ Pass / ❌ Fail / ⚠️ Needs verification for each item
- Specific code snippets showing the issue + fix
- WCAG criterion reference for each failure (e.g. WCAG 1.4.3)

## References

- `contracts/components/{Name}.json` — check the `states.authored` list
- WCAG 2.2 AA: https://www.w3.org/TR/WCAG22/
- WAI-ARIA patterns: https://www.w3.org/WAI/ARIA/apg/patterns/

## Regression checklist

- [ ] No new `aria-*` attributes without corresponding contract state entry
- [ ] Focus ring uses `--helix-color-border-focus` (not hardcoded outline color)
- [ ] New states added to the component are listed in `contracts/components/{Name}.json`
