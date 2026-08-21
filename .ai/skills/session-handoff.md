---
name: session-handoff
description: Hand off context to the next agent session cleanly
applyTo: []
---

# Skill: Session Handoff

## Scope

Handing off context to the next agent session — at the end of a long session, or when switching
to a different agent. Does not cover: writing the actual code changes, running CI (only reporting
its state).

## Process

### Step 1 — Summarize what was done

Write a short summary (max 200 words) covering:
- Which files were created or modified
- Which contracts are now in `contracts/components/`
- Which CI checks are passing / failing

### Step 2 — Update memory if needed

If this session revealed a non-obvious constraint, a tool behavior, or a correction
that a future agent should know: add a bullet to `.ai/memory/agnostic-lessons.md`.

Format:
```markdown
## {Short title}
**Lesson:** {What was learned and why it matters.}
```

Do NOT add to memory:
- Things already in CLAUDE.md or contracts
- Temporary state (file X exists — the filesystem shows that)
- In-progress work

### Step 3 — List open tasks

```markdown
## Open at handoff

- [ ] Task 1 (file: packages/core/src/...) — reason it's incomplete
- [ ] Task 2 — blocked by {what}
```

### Step 4 — Verify CI

Before handing off, run:
```bash
pnpm verify:contract
pnpm verify:props
pnpm typecheck
```

If any fail, either fix them or note them explicitly in the handoff document.

## Output

A handoff note pasted into the next session's first message, containing:
1. Summary of work done
2. Open tasks with file paths
3. Any new memory entries added
4. CI state (pass/fail per check)

## Regression checklist

- [ ] Memory entries added are novel — not duplicates of existing lessons
- [ ] Open tasks have enough context to be actionable without this session
- [ ] CI state is accurate (run, don't guess)
