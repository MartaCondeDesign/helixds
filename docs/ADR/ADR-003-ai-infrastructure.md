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

Multi-LLM installation: a `setup:ai` script is intended to copy/link skills into:
- `.claude/skills/` (Claude Code)
- `.gemini/skills/` (Gemini CLI)
- `.github/copilot-instructions.md` (GitHub Copilot)

**Status: not yet implemented.** There is no `setup:ai` entry in `package.json` today — only
`pnpm lint:ai` exists. Until `setup:ai` ships, keep `.claude/skills/` in sync with `.ai/skills/` by hand.

CI validation: `pnpm lint:ai` validates the .ai/ directory structure (SPORT sections present,
agent frontmatter complete, memory files non-empty, config.json valid).

## Consequences

- **Positive:** Editing `.ai/skills/ds-component-creator.md` propagates to Cursor automatically (symlink)
  and to Claude Code once `setup:ai` exists or the copy is done by hand.
- **Positive:** `pnpm lint:ai` catches drift in `.ai/` structure in CI.
- **Negative:** `.claude/skills/` can silently drift from `.ai/skills/` until `setup:ai` is built.
- **Negative:** On Windows, the `.cursor` symlink requires developer mode or Admin rights.
- **Open item:** build the `setup:ai` script this ADR assumes exists.

## Two-audience principle

`.ai/` and `contributor-ai/` serve contributors (people building Helix itself).
`AGENTS.md` at root serves consumers (teams using `@helix-ds/*` in their own apps).
`contributor-ai/CONTRIBUTOR.md` is the entry point for the contributor audience — see that file.
