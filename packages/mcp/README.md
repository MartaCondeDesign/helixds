# @helixds/mcp

Helix as native tools for AI agents, over the Model Context Protocol — instead of shelling out to
`pnpm helix …` or reading Markdown.

## Tools

| Tool | What it answers |
|------|-----------------|
| `helix_list_components` | Every component with its status and purpose — "does Helix already have this?" |
| `helix_get_contract` | One component's props (exact names, types, defaults), accessibility, rationale, `neverUseFor` and governance boundaries |
| `helix_search_tokens` | The right token for a concept — "danger background", "subtle text", "focus border" — with its `var(--helix-…)`, light and dark values |
| `helix_validate_snippet` | Checks JSX/TSX before it's written: lint problems, a `fixedCode` with the safe fixes applied, `compileErrors` from type-checking it against Helix's real source (`src/compile.ts`, the same compiler the evals grade with), what's left, and layout/icon/inline-style advisories |
| `helix_get_pattern` | A documented composition pattern (`group-spacing`, `show-hide-parts`…) |

All tools are read-only. They read the same sources as the CLI (`scripts/helix-query-lib.ts`) and the linter
(`@helixds/eslint-plugin`), so there is no second copy of the documentation to drift.

## Use it

**Claude Code** picks it up from the repo's `.mcp.json` (approve the `helix` server when asked).

**Cursor / other clients** — add a stdio server that runs from the repo root:

```json
{
  "mcpServers": {
    "helix": { "command": "pnpm", "args": ["-s", "helix:mcp"], "cwd": "/path/to/helixds" }
  }
}
```

## Token search

Agents describe a token by what it's for; Helix names it by role, surface and state. The search maps the
everyday words to the token grammar — `background`/`bg` → `fill`, `error`/`destructive` → `danger`,
`subtle` → `light`, `pressed` → `press`… — and ranks tokens whose path carries every concept. Words that
name no part of any token ("button", "card") are returned as `ignored`. When no token has every concept
(Helix has no hover border, for instance) the result says so with a `note` and shows the closest matches,
instead of inventing one.

## Test

```bash
pnpm --filter @helixds/mcp test
```

Starts the real server over stdio and calls every tool with the official MCP client.
