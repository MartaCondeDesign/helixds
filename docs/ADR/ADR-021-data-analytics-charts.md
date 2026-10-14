# ADR-021 — Data Analytics charts use Apache ECharts through Helix

> Package names updated to the `@helixds` npm scope (ADR-023, 2026-10-07); this ADR was written when they were `@helix-ds/…`.

**Date:** 2026-10-03  
**Status:** Accepted

## Decision

`Chart` is a first-class `data-analytics` component in `@helixds/react`. It is the sole supported renderer
for data visualisations and is implemented with Apache ECharts under Apache License 2.0. Consumers select a
Helix `variant`; they do not import ECharts or pass raw ECharts options: `line`, `bar`, `stacked-bar`,
`donut`, or `timeline`.

The component resolves computed Helix CSS custom properties at runtime. Series palette, text, grid,
tooltip, legend, radii, spacing, and shadows come from Helix semantic tokens. Charts compose with Helix
`Card`, `PageHeader`, `Badge`, `Table`, and `Tooltip`; they never recreate those components or introduce a
second visual language.

Raw ECharts imports and unthemed chart libraries are forbidden in Helix product examples and consumer
guidance. ECharts is a renderer dependency, not a public design API. Chart exposes typed data and labels,
provides an accessible summary, and retains supplied data in the DOM as a visually hidden table.

## Consequences

- Adding a chart type requires a `Chart` variant, contract update, Storybook example, accessibility review,
  and an eval prompt.
- ECharts notices and the Apache 2.0 license must be retained in distributed third-party notices.

## Amendment — 2026-10-12: blue palette, draw-in motion, area fill

Decided by the design-system owner after a preview (`ds-preview-before-ship`):

- **Palette — the rule.** Series 1 is always the primary blue (blue-600, #2563eb, the primary Button's fill
  in both themes). Every next series is a blue **far from the one before it**, so two series never read as near
  tones — and every series meets 3:1 on the page (WCAG 1.4.11) with **no outline** (owner's call: accessible,
  but no borders). Dark mode alternates light blues: 600·200·400·100·500. Light mode has no light blue that
  meets 3:1 on white (blue-400 is 2.54:1), so the contrast comes from the darkest blue instead:
  600·900·500·800·700. `series-6` stays gray. Stacked segments and donut slices are split by a page-colored gap,
  since neighbouring series are under 3:1 apart from each other.
- **Motion.** Charts draw in on load: lines sweep over `semantic.duration.draw` (700ms) with each point
  appearing as the line reaches it; bars grow one category after another and series start one after another,
  `semantic.duration.stagger` (120ms) apart; all eased with `semantic.easing.gentle`. Under
  `prefers-reduced-motion` the chart renders finished. `draw` and `stagger` are shared with illustrations
  (ADR-024, amended the same day), which is why they are semantic rungs rather than chart-only values.
- **Area fill.** A gradient from the series color at `component.chart.area-opacity` (0.15 — opacity moves in 5% steps) to transparent —
  a chart-only value with no semantic equivalent, so a documented component literal.

## Amendment — 2026-10-13: donut update motion

When a donut keeps its categories but gets new values (switching period, filter or unit), it no longer
clears and draws in again: each slice eases to its new angle (the transitions.dev "donut chart" recipe,
previewed and approved first). The timing is `component.chart.duration-update` (400ms — the recipe's own
value; nothing on the `semantic.duration` scale matches, and shortening it to `slower` would rush a morph
the eye follows across the whole ring) with `component.chart.easing-update` → `semantic.easing.gentle`.
New categories, a different variant or new series still draw in from scratch. Under
`prefers-reduced-motion` Chart already renders with `animation: false`, so the values just change.
