---
name: ds-preview-before-ship
description: Preview a new visual/interaction effect and get sign-off before it touches a shipped component
applyTo: ["packages/core/src/components/**/*.tsx", "packages/core/src/globals.css", ".ai/maps/patterns/**/*.md"]
---

# Skill: Preview before you ship

## Scope

**Broadened 2026-09-11, by explicit direction: this applies whenever asked to change an existing
component (any visual/behavioral change, not only ones that overturn a written rule — a color swap, a
reordered anatomy, a new effect, all of it), and whenever asked to create a new component.** Two cases:

1. **Changing an existing component** — build the preview, get sign-off, then implement. No carve-out for
   "small" changes; the point is a human looks at it before it's real, and small changes are the cheapest
   ones to preview.
2. **Creating a new component** — this sits *alongside* `ds-component-creator.md`'s contract-first flow,
   not instead of it. The contract is still step 1 (it decides what the component IS — anatomy, props,
   tokens, a11y). This skill adds the missing half: after the contract is filled in but *before* writing
   the real `.tsx`, build a live visual preview of what it'll actually look/feel like, using the contract's
   real anatomy/tokens, and get sign-off — then implement for real. A contract review checks the spec is
   right; a visual preview checks the *result* is right, and they catch different mistakes.

Covers the process, not any one effect's or component's implementation details.

**Origin:** Input's error-state shake (2026-09-11). The pattern doc had an explicit, deliberate "never use
a motion effect on Input" rule. Rather than either silently complying (dropping a reasonable request) or
silently overriding a written rule, the effect was built once as a throwaway Artifact — the exact CSS
against a Helix-token-accurate mock of the real `Input` anatomy, both themes, `prefers-reduced-motion`
toggle included — and only wired into `Input.tsx` + `globals.css` for real after explicit approval, in the
same change that updated `motion-effects.md`'s rule. See that file's `Input (invalid)` row for the shipped
result.

## Why this exists

A pattern-doc rule someone will read later ("never do X") is worth more than it costs to write — but only
if a change that contradicts it can't land silently. Point changes will keep happening (that's normal
design-system iteration); each one either respects the existing rule or needs to update it explicitly, in
the same change, with a reason on record. A preview step is what makes "explicit" real: it's the moment a
human actually looks at the thing before it's load-bearing, instead of an agent inferring "the user will
probably like this" and shipping straight to the contract.

## Process

### Step 1 — Build the preview, not the feature

- [ ] Reuse the real tokens (`--helix-*` hex/var values pulled from `packages/tokens/dist/helix.css` or
      `tokens.json`) and the real anatomy (`data-helix-part` names, actual markup structure) for the
      component being changed — the point is fidelity, so approval on the preview transfers cleanly to the
      real thing, not a stylized mockup that looks different once implemented.
- [ ] Make it interactive wherever the real behavior is interactive (a working input the user can actually
      type into and submit, not a static screenshot of "the error state").
- [ ] Cover both themes (light/dark) and, for anything motion-related, a `prefers-reduced-motion` toggle —
      don't make the reviewer imagine the other half.
- [ ] Build it as a published **Artifact** (fastest to share, no repo state touched) or an **experimental
      Storybook story not exported from the component's real barrel** — either is fine; Artifact is usually
      less setup for a one-off effect check.
- [ ] State plainly, on the preview itself, that it's a preview: what's already decided vs. what's pending
      approval, and — if the effect conflicts with an existing rule — name that rule and what changes if
      approved.

### Step 2 — Get explicit sign-off

- [ ] Don't implement into the real component from an assumed "they'll probably like it." Wait for an
      actual yes.
- [ ] If the answer is "change it," iterate on the preview — not on the real component's code.

### Step 3 — Ship it for real, and update every doc the rule lived in, same change

- [ ] Implement into the real `.tsx`/`globals.css`/contract.
- [ ] If a `.ai/maps/patterns/*.md` rule is what got overturned, edit that file in the same change — move
      the component from its "never use" list into the approved table (or wherever the rule lived), with a
      one-line reason distinguishing this case from the general rule (see `motion-effects.md`'s `Input`
      row for the shape of that note). A rule that now contradicts shipped code is worse than no rule.
- [ ] Update the component's contract if the new behavior is part of what the component IS (a new
      authored state, a new prop) — not needed if it's purely an implementation detail of an existing
      state (Input's shake didn't need a new prop; it's a visual consequence of the existing `invalid`
      state transition).
- [ ] Run the component's normal verification (`verify:contract`, `verify:types`, `typecheck`) — a preview
      approval doesn't skip these, it just happens before them instead of instead of them.

## Output

- A published Artifact (or an experimental, unexported Storybook story) that reuses the real component's
  tokens and anatomy, is interactive where the real thing is interactive, covers both themes, and states
  plainly what's pending approval.
- Explicit sign-off from the person who asked for the change, recorded in the conversation that requests
  the real implementation.
- The real change, landed only after sign-off: component code, contract (if the surface area changed),
  and — in the same commit — the pattern-doc rule it overturns, updated to say so and why.

## Reference

- `.ai/maps/patterns/motion-effects.md` — the pattern doc this skill's origin case lives in; its checklist
  item 0 points back here.
- `.ai/skills/ds-component-creator.md` — the equivalent checkpoint for a component that doesn't exist yet.
- `.ai/skills/ds-a11y-checker.md` — run after shipping, if the change touches interaction or focus.

## Regression checklist

- [ ] The preview was built from real Helix tokens/anatomy, not invented colors or markup.
- [ ] Both themes (light/dark) were shown in the preview.
- [ ] For a motion/animation effect, `prefers-reduced-motion` was demonstrated in the preview, not just
      mentioned.
- [ ] Explicit approval was given before any real component file was touched.
- [ ] Any pattern-doc rule the change overturns was updated in the same change, with a stated reason.
- [ ] The component's normal verification (`verify:contract`, `verify:types`, `typecheck`) passes after
      the real implementation lands.
