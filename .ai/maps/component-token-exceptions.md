# Helix DS — Component Token Exceptions

Every `component.*` token should alias `semantic.*` where a semantic role exists for it (per
`packages/tokens/CLAUDE.md` → "Token layers"). The table below lists every token that does **not** — it
aliases `primitive.*` directly, or has no alias at all (a raw literal) — grouped by token type, with the
current value and the closest existing token that could apply.

**This is not automatically a violation.** Some of these are legitimate: the category has no semantic layer
at all (typography), the component is a documented ADR-004 density exception (Badge, Chip), or the value is
past the shared scale's top rung (TopBar). Others are real gaps — a matching token exists and simply isn't
wired up yet.

**Codes used in the "Proposed Token" column:**

| Code | Meaning |
|------|---------|
| `SS`  | No semantic layer exists at all for this category — correct as-is, not a gap |
| `ADR` | Documented ADR-004 density exception (Badge/Chip height) — correct as-is |
| `FE`  | Past the shared scale's top rung — already resolved one step further up `primitive.*` |
| `NM`  | No match — no primitive or semantic token shares this exact value |

Rows with a real token name in that column (not a code) are the actionable ones: the same resolved value
already exists as a token, so re-aliasing is low-risk — same visual result, cleaner alias chain.

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
- When the auto-classifier tags a token in a way you disagree with (e.g. it lands as `NM` but you've decided
  it's actually a deliberate exception like Badge/Chip height), add one line to `KNOWN_EXCEPTIONS` in
  `scripts/audit-token-exceptions.ts` and rerun — the doc follows.

---

<!-- AUTO:ASCII_TABLE -->
```
+------------+----------------------+--------------------+-----------------------------+
| Component  | Token                | Current Value      | Proposed Token              |
+============+======================+====================+=============================+
+------------------------------------- TYPOGRAPHY -------------------------------------+
| Avatar     | fontWeight           | 600                | -- SS                       |
| Badge      | fontSize             | 11px               | -- SS                       |
| Badge      | fontWeight           | 600                | -- SS                       |
| Button     | fontSize.l           | 14px               | -- SS                       |
| Button     | fontSize.m           | 12px               | -- SS                       |
| Button     | fontSize.s           | 12px               | -- SS                       |
| Button     | fontSize.xl          | 18px               | -- SS                       |
| Button     | fontSize.xs          | 11px               | -- SS                       |
| Chip       | fontSize.m           | 13px               | -- NM                       |
| Chip       | fontSize.s           | 13px               | -- NM                       |
| Chip       | fontWeight           | 500                | -- SS                       |
| NavItem    | fontSize             | 12px               | -- SS                       |
| NavItem    | fontWeight           | 500                | -- SS                       |
| PageHeader | description.fontSize | 12px               | -- SS                       |
| PageHeader | title.fontSize.1     | 32px               | -- SS                       |
| PageHeader | title.fontSize.2     | 24px               | -- SS                       |
| PageHeader | title.fontWeight     | 700                | -- SS                       |
| StatCard   | delta.fontSize       | 11px               | -- SS                       |
| StatCard   | label.fontSize       | 11px               | -- SS                       |
| StatCard   | label.fontWeight     | 500                | -- SS                       |
| StatCard   | value.fontSize       | 40px               | -- SS                       |
| StatCard   | value.fontWeight     | 700                | -- SS                       |
| Table      | cell.fontSize        | 12px               | -- SS                       |
| Table      | header.fontSize      | 11px               | -- SS                       |
| Table      | header.fontWeight    | 600                | -- SS                       |
+------------+----------------------+--------------------+-----------------------------+
+--------------------------------------- COLOR ----------------------------------------+
| Dialog     | overlay              | rgba(15,23,42,0.6) | -- NM                       |
+------------+----------------------+--------------------+-----------------------------+
+--------------------------------------- BORDER ---------------------------------------+
| Chip       | border-width         | 1px                | -- NM                       |
+------------+----------------------+--------------------+-----------------------------+
+--------------------------------------- MOTION ---------------------------------------+
| Button     | transition           | 120ms              | duration-base (120ms)       |
+------------+----------------------+--------------------+-----------------------------+
+-------------------------------------- SPACING ---------------------------------------+
| Button     | padding.x-l          | 20px               | -- NM                       |
| Button     | padding.x-m          | 16px               | spacing-component-l (16px)  |
| Button     | padding.x-s          | 12px               | spacing-component-m (12px)  |
| Button     | padding.x-xl         | 24px               | spacing-component-xl (24px) |
| Button     | padding.x-xs         | 8px                | spacing-component-s (8px)   |
| Card       | padding              | 24px               | spacing-component-xl (24px) |
| Chip       | gap.m                | 6px                | -- NM                       |
| Chip       | gap.s                | 6px                | -- NM                       |
| Chip       | padding-x.m          | 16px               | spacing-100 (16px)          |
| Chip       | padding-x.s          | 12px               | spacing-75 (12px)           |
| Dialog     | padding              | 24px               | spacing-component-xl (24px) |
| Input      | gap.description      | 4px                | spacing-component-xs (4px)  |
| Input      | gap.label            | 4px                | spacing-component-xs (4px)  |
+------------+----------------------+--------------------+-----------------------------+
+---------------------------------------- SIZE ----------------------------------------+
| Badge      | height.s             | 24px               | -- ADR                      |
| Badge      | height.xs            | 20px               | -- ADR                      |
| Checkbox   | size                 | 16px               | size-100 (16px)             |
| Chip       | height.m             | 32px               | -- ADR                      |
| Chip       | height.s             | 28px               | -- ADR                      |
| Radio      | size                 | 16px               | size-100 (16px)             |
| Switch     | height.m             | 20px               | size-125 (20px)             |
| Switch     | height.s             | 16px               | size-100 (16px)             |
| Switch     | thumb-size.m         | 16px               | size-100 (16px)             |
| Switch     | thumb-size.s         | 12px               | size-75 (12px)              |
| TopBar     | height               | 56px               | size-350 (56px) FE          |
+------------+----------------------+--------------------+-----------------------------+
```
<!-- /AUTO -->
