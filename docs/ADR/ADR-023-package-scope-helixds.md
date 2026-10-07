# ADR-023 — Helix's packages live in the `@helixds` npm scope

**Date:** 2026-10-07
**Status:** Accepted — renames the `@helix-ds` npm scope

## Context

In the eval context ladder's `bare` level, an agent builds with Helix knowing only its name. Its most
common error was the import: across 35 `bare` answers it wrote `@helix/react` 13 times, `@helix/components`
7, `@helix/design-system` 4 and `@helix-ds/react` 4 — for a package then called `@helix-ds/core`. Every one
of those answers failed to build, whatever else it got right.

The scope agents reach for, `@helix`, is taken on npm, as is the unscoped `helix`, so neither can be
published. `helixds` was free and is now claimed by Helix's npm account.

## Decision

- Every Helix package is published under **`@helixds`**: the components are **`@helixds/react`** — keeping
  `react`, the part agents get right most often — then `@helixds/tokens`, `@helixds/eslint-plugin`,
  `@helixds/mcp`, `@helixds/proof`, `@helixds/wc`, `@helixds/storybook`, `@helixds/storybook-addon-tokens`.
  The workspace root is `helixds`.
- Token prefix (`--helix-`) and data-attribute prefix (`data-helix-`) are unchanged: they're part of the
  design, not of the package name, and Helix stays the brand.
- Helix's former names (`@helix-ds/core`, `@helix/react`) are look-alike paths `helix/import-source`
  reports and auto-fixes to `@helixds/react`.

Same principle as ADR-022: use the name agents expect where it's available; here the closest available one.

## Consequences

- Every import, workspace package name, alias (Storybook, Proof), guide (AGENTS.md, llms.txt, CLAUDE.md
  files), eval prompt and lint rule moved together.
- `bare` answers rarely guess `@helixds`, so `bare` keeps failing its import until Helix is published and
  models learn the name — the rename trades that for a name that can actually ship.
- Saved eval answers are rescored against the current prompts; the guided levels need a new round to show
  their real score with `@helixds/react`.
- A `bare` answer importing a component Helix doesn't have (`HxTopBar`) is a build failure of its own
  ("has no export"), recorded by both eval galleries instead of breaking the page.
