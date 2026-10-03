# ADR-021 — Data Analytics charts use Apache ECharts through Helix

**Date:** 2026-10-03  
**Status:** Accepted

## Decision

`Chart` is a first-class `data-analytics` component in `@helix-ds/core`. It is the sole supported renderer
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
