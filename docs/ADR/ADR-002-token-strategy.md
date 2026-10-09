# ADR-002 — Token architecture: DTCG, semantic aliases, CSS custom properties

> Package names updated to the `@helixds` npm scope (ADR-023, 2026-10-07); this ADR was written when they were `@helix-ds/…`.

**Date:** 2026-08-18
**Status:** Accepted

## Context

We need a token system that:
1. Is machine-readable (consultable by AI agents and MCP servers)
2. Generates CSS custom properties for runtime use
3. Supports dark mode without JS
4. Prevents raw hex/px values in component code

## Decision

**Three-layer DTCG JSON → CSS → TypeScript:**

```
primitive.*   → raw scale (brand.600 = #2563eb)
semantic.*    → role aliases (color.fill.primary = {primitive.color.brand.600})
component.*   → component-specific aliases (button.fill.rest = {semantic.color.fill.primary})
```

Source: `packages/tokens/src/tokens.json` (DTCG format)
Output: `packages/tokens/dist/helix.css` + `packages/tokens/dist/index.ts`

CSS naming: `--helix-{path-with-dashes}` (semantic and primitive prefixes stripped)
- `semantic.color.fill.primary` → `--helix-color-fill-primary`

**Rule:** Component CSS references only semantic tokens. Never primitive tokens.

**Dark mode:** Token file defines semantic overrides under `[data-theme="dark"]`
AND `@media (prefers-color-scheme: dark)` to handle both explicit toggle and OS default.

## Consequences

- **Positive:** Adding a dark mode value is a one-line change in tokens.json.
- **Positive:** `--helix-color-fill-primary` can point to different primitives in different themes.
- **Positive:** AI agents can look up token values via the JSON file or a future MCP server.
- **Negative:** Adding a new token requires a build step (`pnpm build` in @helixds/tokens).
- **Negative:** The three layers add indirection — an agent reading component CSS won't see raw values.
- **Mitigation:** The tokens MCP server (Layer 8) exposes resolved values for agent lookup.

## Token policy enforcement

`scripts/verify-contract.ts` checks that component contracts only list allowed token categories.
`scripts/prop-map-check.ts` checks that component CSS doesn't use forbidden token paths.
Both run in CI and gate merges once the violation list is clean.
