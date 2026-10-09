# ADR-003 — AI context structure: .ai/ as canonical source

**Date:** 2026-08-18
**Status:** Accepted

## Context

Multiple AI tools need context about Helix DS (Claude Code, Gemini CLI, GitHub Copilot, Cursor).
Without a single source of truth, each tool gets its own context file and they drift.

## Decision

**`.ai/` is the canonical source** for shared, tool-agnostic AI context (skills, agents, memory, maps,
config). Whole-directory symlinks are used only where the target tool has no local, machine-specific
state to protect:

- `.cursor/` → symlink to `.ai/` (Cursor has no other local state in that path).
- `.claude/` stays a **real directory**, not a symlink — Claude Code keeps its own local files there
  (`settings.local.json`, `launch.json`) that are per-machine and must not be overwritten by shared
  content. Only `.claude/skills/` is populated from `.ai/skills/`.

```bash
ln -sf ../.ai .cursor
```

Content types in `.ai/`:
- **Rules** (in `CLAUDE.md` / `AGENTS.md`) — always loaded, invariants the agent must respect
- **Skills** (`.ai/skills/*.md`) — on-demand procedures in SPORT format
- **Agents** (`.ai/agents/*.agent.md`) — specialized agent definitions with frontmatter
- **Memory** (`.ai/memory/*.md`) — lessons accumulated from real sessions
- **Maps** (`.ai/maps/`) — canonical vocabularies (prop-map.md)
- **Config** (`.ai/config.json`) — structured validation data, not narrative

Multi-LLM installation: a `setup:ai` script was originally intended to copy/link skills into:
- `.claude/skills/` (Claude Code)
- `.gemini/skills/` (Gemini CLI)
- `.github/copilot-instructions.md` (GitHub Copilot)

**Status (updated 2026-09-24): partially implemented, with a different scope.** `pnpm setup:ai`
(`scripts/setup-ai.mjs`) now exists, but it serves the **consumer** audience: it copies `AGENTS.md` into a
target project and writes pointer files for Cursor (`.cursor/rules/helix.mdc`) and Copilot
(`.github/copilot-instructions.md`) when those tools are detected there. It does **not** sync this repo's
own `.ai/skills/` into `.claude/skills/` or `.gemini/skills/`.

**Update 2026-10-09: contributor-side sync built.** `scripts/sync-skills.mjs` (`pnpm sync:skills`, also run by
`.husky/pre-commit`) publishes each `.ai/skills/<name>.md` as `.agents/skills/<name>/SKILL.md` — the
folder-per-skill Agent Skills layout — via symlinks, and links `.claude/skills`, `.gemini/skills` and
`.github/skills` to `.agents/skills`. `.ai/skills/*.md` stays the only file anyone edits.

CI validation: `pnpm lint:ai` validates the .ai/ directory structure (SPORT sections present,
agent frontmatter complete, memory files non-empty, config.json valid).

## Consequences

- **Positive:** Editing `.ai/skills/ds-component-creator.md` propagates to Cursor, Claude Code, Gemini CLI,
  Copilot and any tool reading `.agents/skills/` automatically (symlinks, see the 2026-10-09 update).
- **Positive:** `pnpm lint:ai` catches drift in `.ai/` structure in CI.
- **Negative:** On Windows, the `.cursor` and skills symlinks require developer mode or Admin rights.

## Two-audience principle

`.ai/` and `contributor-ai/` serve contributors (people building Helix itself).
`AGENTS.md` at root serves consumers (teams using `@helixds/*` in their own apps).
`contributor-ai/CONTRIBUTOR.md` is the entry point for the contributor audience — see that file.
