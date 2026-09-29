# .ai/ — Tool-agnostic AI context for Helix DS

Everything an AI agent needs to work on Helix *besides* the always-loaded rules (`CLAUDE.md` in the repo
root and in each package). Plain Markdown/JSON, so any tool can read it. `.cursor/` is a symlink to this
directory, so Cursor sees the same files; `.claude/` is a real directory of its own (Claude Code settings
and `launch.json`), not a link.

```
.ai/
├── README.md            ← this file
├── config.json          ← structured validation data for scripts/CI (not narrative)
├── maps/                ← reference data — read when the task needs it
│   ├── prop-map.md                     canonical prop vocabulary + anti-synonyms (enforced by verify:props)
│   ├── patterns/*.md                   documented compositions (stat-card, same-row-sizing, search-filter…)
│   ├── component-token-exceptions.md   GENERATED — component tokens that skip the semantic layer, and why
│   ├── figma-map.md                    GENERATED — every prop → Figma property, plus anatomy layer names
│   └── changelog.json                  GENERATED — every commit, shown in Storybook's Changelog page
├── skills/              ← step-by-step procedures, loaded on demand
│   ├── ds-component-creator.md         create a new component end-to-end
│   ├── ds-a11y-checker.md              accessibility audit of a component
│   ├── ds-preview-before-ship.md       preview a new visual/interaction effect and get sign-off first
│   ├── tokens-to-figma.md              tokens → Figma variables, text styles, effect styles
│   ├── icons-to-figma.md               Tabler icons → native Figma components
│   ├── components-to-figma.md          a component → a Figma component set (read figma-map.md first)
│   └── session-handoff.md              hand off context to the next agent session
├── agents/
│   └── component-builder.agent.md      specialized agent: contract → implementation
└── memory/              ← lessons learned in past sessions
    ├── agnostic-lessons.md
    └── css-styling-lessons.md
```

Generated files are never hand-edited — each one names the command that regenerates it
(`docs:token-exceptions`, `docs:figma-map` and `docs:changelog` run automatically on commit).

## Rules vs skills vs memory

| Type   | Where                  | When loaded   | What it is                                  |
|--------|------------------------|---------------|---------------------------------------------|
| Rule   | `CLAUDE.md` files      | Always        | Invariants the agent must never violate     |
| Skill  | `.ai/skills/`          | On demand     | Step-by-step procedure for a concrete task  |
| Memory | `.ai/memory/`          | On demand     | Lessons learned from past sessions          |

`pnpm lint:ai` checks the structure: every skill has `## Scope`, `## Process`, `## Output` and
`## Regression checklist`; every agent has YAML frontmatter; no memory file is empty.

## Apps that consume Helix

This directory is for working **on** Helix. An app that **uses** Helix gets its guidance from
`AGENTS.md` instead: `pnpm setup:ai <path-to-app>` copies `AGENTS.md` into that project (never
overwriting a hand-edited one — it reports the conflict) and, only if the project already has `.cursor/`
or `.github/`, adds a pointer file for Cursor or Copilot. It does not install skills anywhere.
