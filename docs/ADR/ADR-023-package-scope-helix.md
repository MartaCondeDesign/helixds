# ADR-023 — Helix's components are `@helix/react`

**Date:** 2026-10-07
**Status:** Accepted — renames the `@helix-ds` npm scope

## Context

In the eval context ladder's `bare` level, an agent builds with Helix knowing only its name. Its most
common error was the import: it wrote `@helix/react` (and sometimes `@helix/design-system`) for a package
that was called `@helix-ds/core`. Every one of those answers failed to build, whatever else it got right.

On npm, `helix` (unscoped) is taken; `@helix/react`, `@helix/core` and the other `@helix/*` names are not
published (the `@helix` scope itself can only be confirmed free when an account claims it).

## Decision

- The component package is **`@helix/react`** — the name agents reach for. The other packages move to the
  same scope: `@helix/tokens`, `@helix/eslint-plugin`, `@helix/mcp`, `@helix/proof`, `@helix/wc`,
  `@helix/storybook`, `@helix/storybook-addon-tokens`.
- Token prefix (`--helix-`) and data-attribute prefix (`data-helix-`) are unchanged.
- `@helix-ds/core` is now one of the look-alike paths `helix/import-source` reports, and it auto-fixes to
  `@helix/react`.

Same principle as ADR-022: where Helix has no strong reason to differ, use the name agents already expect.

## Consequences

- Every import, workspace package name, alias (Storybook, Proof), guide (AGENTS.md, llms.txt, CLAUDE.md
  files), eval prompt and lint rule moved together.
- Saved eval answers are rescored: `bare` answers that imported `@helix/react` now build; answers from the
  guided levels, written when the guides taught `@helix-ds/core`, now fail their import until those levels
  are run again.
- A `bare` answer importing a component Helix doesn't have (`HxTopBar`) is now a build failure of its own
  ("has no export"), recorded by both eval galleries instead of breaking the page.
- Before publishing, claim the `@helix` scope on npm.
