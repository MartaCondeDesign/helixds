# Helix DS — Component Token Exceptions

Every `component.*` token should alias `semantic.*` where a semantic role exists for it (per
`packages/tokens/CLAUDE.md` → "Token layers"). The table below lists every token that does **not** — it
aliases `primitive.*` directly, or has no alias at all (a raw literal) — grouped by token type, with the
current value and the closest existing token that could apply.

**This is not automatically a violation.** Some of these are legitimate: the category has no semantic layer
at all (typography), the component is a documented ADR-004 density exception (Badge, Chip), or the value is
past the shared scale's top rung (TopBar). Others are real gaps — a matching token exists and simply isn't
wired up yet.

**"Token" / "Variant Size" columns:** the t-shirt size variant (`xs`/`s`/`m`/`l`/`xl`...) is split out into
its own column instead of staying glued to the property name — `Token: height`, `Variant Size: s` instead of
`height.s` or `height-s` in one string. This also normalizes Button's `padding.x-l` (axis and size fused
into one key, an inconsistency with the rest of the system) into the same shape as everywhere else:
`Token: padding-x`, `Variant Size: l` — same display Chip's `padding-x.m` already had. A row with `--` in
this column has no size variant at all (it's a single value, or the trailing segment is a sub-part name
like `title`/`label`/`description`, not a size).

**The flag prefixed onto "Current Value"** tells you the outcome at a glance:

| Flag | Meaning |
|------|---------|
| ✅ | Reviewed and correct as-is — no token needed (no semantic layer for this category, a documented ADR-004 density exception, past the shared scale's top rung, or a reviewed one-off value like `Dialog.overlay`) |
| 🚩 | An existing token already has this exact value — should be reused instead of the current alias |
| 🆕 | No existing token matches — a new one is proposed, named mechanically from where it currently lives |

**"Proposed Token" / "Proposed Value" columns**, matching the flag:

- ✅ rows: "Proposed Token" holds a short reason instead of a name (`no semantic layer`, `ADR-004 exception`,
  `past top rung`, `reviewed one-off`); "Proposed Value" is `--` — nothing to change.
- 🚩 rows: a real, existing token name (e.g. `spacing-component-l`) + its value — this token already has the
  exact same resolved value, so re-aliasing to it is low-risk, same visual result, cleaner alias chain.
- 🆕 rows: a mechanically-generated new name (e.g. `chip-font-size-s`) + the value it would carry — a
  starting point for a human to review, not a vetted proposal, before actually adding it as a new token.

**`width` tokens are excluded from this audit entirely** (they never appear as a row, in any category) — per
this file's own root `CLAUDE.md` token policy, min-/max-width is deliberately never tokenized; it's decided
by the consumer, the component, or the pattern in use. A hardcoded width value is correct, not a gap, so
listing it here would be misleading. The `SIZE` category below only tracks height-shaped dimensions
(control/chrome height, and square `size` props like Checkbox/Radio).

## This file is auto-generated — do not hand-edit the table

The table between the `<!-- AUTO:ASCII_TABLE -->` / `<!-- /AUTO -->` markers is regenerated from
`packages/tokens/src/tokens.json` by `scripts/audit-token-exceptions.ts`. Editing it by hand will be
silently overwritten the next time the script runs. Two things stay hand-maintained:

- the prose around the table (this file's narrative context, ADR references, the code legend above)
- the `KNOWN_EXCEPTIONS` allowlist inside the script itself — the one place a human judgment call
  ("this is an intentional ADR-004 density exception", "this is a one-off color, not a reusable role")
  gets recorded. Everything else is inferred purely from `tokens.json`.

**Workflow — this doc updates itself:**

- Run manually any time: `pnpm docs:token-exceptions`
- Runs automatically on every commit via `.husky/pre-commit` (after `verify:tokens`) — so the moment a new
  component's tokens land in `tokens.json`, this file reflects them in the same commit, no one has to
  remember to update it by hand.
- When the auto-classifier flags a token 🆕 and you've reviewed it and decided it's deliberately a one-off
  (like `Dialog.overlay`), or you've decided a 🚩/🆕 is actually a documented exception (like Badge/Chip
  height), add one line to `KNOWN_EXCEPTIONS` in `scripts/audit-token-exceptions.ts` and rerun — it becomes
  ✅ and the doc follows.

---

<!-- AUTO:ASCII_TABLE -->
```
+------------+----------------------+--------------+-----------------------+--------------------------+----------------+
| Component  | Token                | Variant Size | Current Value         | Proposed Token           | Proposed Value |
+============+======================+==============+=======================+==========================+================+
+----------------------------------------------------- TYPOGRAPHY -----------------------------------------------------+
| Avatar     | fontWeight           | --           | ✅ 600                | no semantic layer        | --             |
| Badge      | fontSize             | --           | ✅ 11px               | no semantic layer        | --             |
| Badge      | fontWeight           | --           | ✅ 600                | no semantic layer        | --             |
| Button     | fontSize             | xs           | ✅ 11px               | no semantic layer        | --             |
| Button     | fontSize             | s            | ✅ 12px               | no semantic layer        | --             |
| Button     | fontSize             | m            | ✅ 12px               | no semantic layer        | --             |
| Button     | fontSize             | l            | ✅ 14px               | no semantic layer        | --             |
| Button     | fontSize             | xl           | ✅ 18px               | no semantic layer        | --             |
| Chip       | fontSize             | s            | 🆕 13px               | chip-font-size-s         | 13px           |
| Chip       | fontSize             | m            | 🆕 13px               | chip-font-size-m         | 13px           |
| Chip       | fontWeight           | --           | ✅ 500                | no semantic layer        | --             |
| NavItem    | fontSize             | --           | ✅ 12px               | no semantic layer        | --             |
| NavItem    | fontWeight           | --           | ✅ 500                | no semantic layer        | --             |
| PageHeader | description.fontSize | --           | ✅ 12px               | no semantic layer        | --             |
| PageHeader | title.fontSize.1     | --           | ✅ 32px               | no semantic layer        | --             |
| PageHeader | title.fontSize.2     | --           | ✅ 24px               | no semantic layer        | --             |
| PageHeader | title.fontWeight     | --           | ✅ 700                | no semantic layer        | --             |
| StatCard   | delta.fontSize       | --           | ✅ 11px               | no semantic layer        | --             |
| StatCard   | label.fontSize       | --           | ✅ 11px               | no semantic layer        | --             |
| StatCard   | label.fontWeight     | --           | ✅ 500                | no semantic layer        | --             |
| StatCard   | value.fontSize       | --           | ✅ 40px               | no semantic layer        | --             |
| StatCard   | value.fontWeight     | --           | ✅ 700                | no semantic layer        | --             |
| Table      | cell.fontSize        | --           | ✅ 12px               | no semantic layer        | --             |
| Table      | header.fontSize      | --           | ✅ 11px               | no semantic layer        | --             |
| Table      | header.fontWeight    | --           | ✅ 600                | no semantic layer        | --             |
+------------+----------------------+--------------+-----------------------+--------------------------+----------------+
+------------------------------------------------------- COLOR --------------------------------------------------------+
| Dialog     | overlay              | --           | ✅ rgba(15,23,42,0.6) | reviewed one-off         | --             |
+------------+----------------------+--------------+-----------------------+--------------------------+----------------+
+------------------------------------------------------- BORDER -------------------------------------------------------+
| Chip       | border-width         | --           | 🆕 1px                | chip-border-width        | 1px            |
+------------+----------------------+--------------+-----------------------+--------------------------+----------------+
+------------------------------------------------------- MOTION -------------------------------------------------------+
| Button     | transition           | --           | 🚩 120ms              | duration-base            | 120ms          |
+------------+----------------------+--------------+-----------------------+--------------------------+----------------+
+------------------------------------------------------ SPACING -------------------------------------------------------+
| Button     | padding-x            | xs           | 🚩 8px                | spacing-component-s      | 8px            |
| Button     | padding-x            | s            | 🚩 12px               | spacing-component-m      | 12px           |
| Button     | padding-x            | m            | 🚩 16px               | spacing-component-l      | 16px           |
| Button     | padding-x            | l            | 🆕 20px               | button-padding-x-l       | 20px           |
| Button     | padding-x            | xl           | 🚩 24px               | spacing-component-xl     | 24px           |
| Card       | padding              | --           | 🚩 24px               | spacing-component-xl     | 24px           |
| Chip       | gap                  | s            | 🆕 6px                | chip-gap-s               | 6px            |
| Chip       | gap                  | m            | 🆕 6px                | chip-gap-m               | 6px            |
| Chip       | padding-x            | s            | 🚩 12px               | spacing-75               | 12px           |
| Chip       | padding-x            | m            | 🚩 16px               | spacing-100              | 16px           |
| Dialog     | padding              | --           | 🚩 24px               | spacing-component-xl     | 24px           |
| Input      | gap.description      | --           | 🚩 4px                | spacing-component-xs     | 4px            |
| Input      | gap.label            | --           | 🚩 4px                | spacing-component-xs     | 4px            |
+------------+----------------------+--------------+-----------------------+--------------------------+----------------+
+-------------------------------------------------------- SIZE --------------------------------------------------------+
| Badge      | height               | xs           | ✅ 20px               | ADR-004 exception        | --             |
| Badge      | height               | s            | ✅ 24px               | ADR-004 exception        | --             |
| Checkbox   | size                 | --           | 🚩 16px               | size-100                 | 16px           |
| Chip       | height               | s            | ✅ 28px               | ADR-004 exception        | --             |
| Chip       | height               | m            | ✅ 32px               | ADR-004 exception        | --             |
| Radio      | size                 | --           | 🚩 16px               | size-100                 | 16px           |
| Switch     | height               | s            | 🚩 16px               | size-100                 | 16px           |
| Switch     | height               | m            | 🚩 20px               | size-125                 | 20px           |
| Switch     | thumb-size           | s            | 🚩 12px               | size-75                  | 12px           |
| Switch     | thumb-size           | m            | 🚩 16px               | size-100                 | 16px           |
| TopBar     | height               | --           | ✅ 56px               | size-350 (past top rung) | 56px           |
+------------+----------------------+--------------+-----------------------+--------------------------+----------------+
```
<!-- /AUTO -->
