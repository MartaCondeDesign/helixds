# ADR-017 — Icon stroke rule: design the real on-screen line width, derive `stroke` from it

**Date:** 2026-09-24
**Status:** Accepted
**Deciders:** Helix DS team

## Context

Tabler icons draw on a fixed `viewBox="0 0 24 24"`. The `stroke` attribute is expressed in those
viewBox units, so the line a user actually sees is:

```
real px = stroke × size / 24
```

The previous scale (`STROKE_BY_SIZE` in `Icon.tsx`: 2 at 12px … 1.5 at 24/32px) was tuned in
`stroke` units. It compensated a little below 24px, but the real line still dropped to **1.0px at
12px** (Badge) and ~1.1px at 14px (Chip) — visibly weaker than the semibold text beside it. The
scale also lived in three places that had drifted (`Icon.tsx`, the Icons browser story's own copy,
and docs/contract/Figma skill still saying "always 1.5").

## Decision

1. **The rule is defined in real rendered px, per icon size**, not in `stroke` units:

   | Icon size | Line width on screen |
   |-----------|----------------------|
   | 12        | 1.3px                |
   | 14        | 1.4px                |
   | 16        | 1.5px                |
   | 18        | 1.5px ¹              |
   | 20        | 1.7px                |
   | 24        | 1.8px                |
   | 28        | 2.0px                |
   | 32        | 2.2px                |
   | 36        | 2.4px                |
   | 40        | 2.8px                |

   ¹ Amended 2026-09-29: was 1.6px. 18px is IconButton's default (`m`) icon size, and next to
   Button's 16px / 1.5px icons it read visibly heavier; 16 and 18 now share 1.5px.

   These are the only numbers anyone designs or edits. The SVG `stroke` attribute Tabler needs is
   an internal conversion done in code — never documented as a design value.

2. **One source of truth:** `ICON_STROKE_PX_BY_SIZE` in
   `packages/core/src/components/Icon/iconStroke.ts`. `iconStrokeForSize(size)` turns it into
   the SVG attribute automatically, interpolates px linearly for sizes between rungs, and keeps the
   edge rung's proportions outside 12–40. Both are exported from `@helix-ds/core`.

3. **Automatic, never per call site.** `Icon` applies `iconStrokeForSize(size)` whenever `stroke`
   isn't passed. Components never pass `stroke` to make an icon heavier or lighter — they pick a
   `size`, the rule does the rest.

4. **How to change icon weight in the future** — edit the px values in `ICON_STROKE_PX_BY_SIZE`, then
   update this table and `contracts/components/Icon.json` → `iconStyle.helixStrokeRule` to match.
   Nothing else. Constraints on any new table:
   - real px must never decrease as size grows (a bigger icon is never thinner);
   - the line grows faster as icons get larger: +0.1px per step up to 24px, +0.2px per 4px from
     24 to 36, +0.4px from 36 to 40 — a large icon with a thin line reads as a wireframe, not a
     symbol (28/36/40 were added to cover the sizes Storybook's icon browser offers);
   - check the smallest rung against the text it sits next to (Badge 12px, Chip 14px) — that's where
     the rule is felt first.

5. **Allowed one-off overrides** — only when the icon *is* the whole signal of a control, must be at
   least as thick as the rule at that size, and must carry a comment at the call site. Today:
   Checkbox's checkmark/minus (`stroke={3}` at 12px = 1.5px real).

## Consequences

- **Positive:** Badge/Chip icons gain ~30% real weight; the line now grows steadily from 1.3px to
  2.8px instead of flattening at 1.5px. One edit re-weights every icon in the system.
- **Positive:** The Icons browser story imports `iconStrokeForSize` instead of keeping its own copy.
- **Negative:** Figma icon masters (24×24) were built at `stroke-width = 1.5`; under this rule the 24px
  master is 1.8. They stay out of sync until the next `icons-to-figma` pass (the skill already uses
  the new value).
- **Neutral:** `<helix-icon>` (Web Components, ADR-015) can't import `@helix-ds/core`, so it keeps a
  copy of the px table — keep it in sync when the table changes.
