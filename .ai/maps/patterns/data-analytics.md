# Data Analytics

Use `Chart` from `@helix-ds/core`; it is the only approved renderer and applies the Helix ECharts theme.

- `line`: trend across ordered dates or sequence.
- `bar`: discrete-category comparison.
- `stacked-bar`: total and composition across categories.
- `donut`: a small part-to-whole distribution; no more than six meaningful slices.
- `timeline`: dated events or status periods.

Put a dashboard chart in `Card`. Pair it with its key takeaway in a card header or `PageHeader`, and use
`Table` for exact values. Use `Badge` for status, never custom legend pills.

Never import `echarts` in a product or pass raw ECharts options. Never invent chart colours, fonts,
margins, tooltip styles, shadows, or legends: `Chart` resolves Helix tokens.
