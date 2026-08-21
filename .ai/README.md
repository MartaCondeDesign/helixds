# .ai/ — Tool-agnostic AI context for Helix DS

This directory is the **single source of truth** for all AI agent context.

`.claude/` and `.cursor/` are symlinks back to this directory so that
editing one file propagates to all tools simultaneously.

```
.ai/
├── README.md            ← this file
├── config.json          ← structured validation data (not narrative)
├── maps/
│   └── prop-map.md      ← canonical prop vocabulary + anti-synonyms
├── memory/
│   ├── agnostic-lessons.md     ← lessons learned from real sessions
│   └── css-styling-lessons.md  ← CSS + token-specific lessons
├── skills/
│   ├── ds-component-creator.md  ← SPORT: create a new Helix component
│   ├── ds-a11y-checker.md       ← SPORT: accessibility audit
│   ├── ds-token-auditor.md      ← SPORT: token policy audit
│   └── session-handoff.md       ← SPORT: hand off session to next agent
└── agents/
    └── component-builder.agent.md  ← specialized agent definition
```

## Rules vs Skills distinction

| Type   | When loaded        | What it is                                 |
|--------|--------------------|--------------------------------------------|
| Rule   | Always (in CLAUDE.md) | Invariants the agent must never violate |
| Skill  | On demand          | Step-by-step procedure for a concrete task |
| Memory | On demand          | Learned lessons from past sessions         |

## Setting up symlinks (one-time, after cloning)

```bash
ln -sf ../.ai .claude
ln -sf ../.ai .cursor
```

Or run `pnpm setup:ai` which does this automatically.

## For multiple AI tools (multi-LLM)

`pnpm setup:ai` also installs skills to:
- `.claude/skills/`  → for Claude Code
- `.gemini/skills/`  → for Gemini CLI
- `.github/copilot-instructions.md` → for GitHub Copilot

All from the same source in `.ai/skills/`.
