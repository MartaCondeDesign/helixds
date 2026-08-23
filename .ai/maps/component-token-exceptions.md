# Helix DS — Component Token Exceptions

Every `component.*` token should alias `semantic.*` where a semantic role exists for it (per
`packages/tokens/CLAUDE.md` → "Token layers"). The table below lists every token that does **not** — it
aliases `primitive.*` directly, or has no alias at all (a raw literal) — grouped by token type, with the
current value and the closest existing token that could apply.

**This is not automatically a violation.** Some of these are legitimate: the category has no semantic layer
at all (typography), the component is a documented ADR-004 density exception (Badge, Chip), or the value is
past the shared scale's top rung (TopBar). Others are real gaps — a matching token exists and simply isn't
wired up yet.

**Codes used in the "Token propuesto" column:**

| Code | Meaning |
|------|---------|
| `SC`  | No semantic layer exists at all for this category — correct as-is, not a gap |
| `ADR` | Documented ADR-004 density exception (Badge/Chip height) — correct as-is |
| `FE`  | Past the shared scale's top rung — already resolved one step further up `primitive.*` |
| `SM`  | No match — no primitive or semantic token shares this exact value |

Rows with a real token name in that column (not a code) are the actionable ones: the same resolved value
already exists as a token, so re-aliasing is low-risk — same visual result, cleaner alias chain.

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
- When the auto-classifier tags a token in a way you disagree with (e.g. it lands as `SM` but you've decided
  it's actually a deliberate exception like Badge/Chip height), add one line to `KNOWN_EXCEPTIONS` in
  `scripts/audit-token-exceptions.ts` and rerun — the doc follows.

---

<!-- AUTO:ASCII_TABLE -->
```
+------------+----------------------+--------------------+--------------------------------------+
| Componente | Token                | Valor actual       | Token propuesto                      |
+============+======================+====================+======================================+
+----------------------------------------- TIPOGRAFIA ------------------------------------------+
| Avatar     | fontWeight           | 600                | -- SC                                |
| Badge      | fontSize             | 11px               | -- SC                                |
| Badge      | fontWeight           | 600                | -- SC                                |
| Button     | fontSize.l           | 14px               | -- SC                                |
| Button     | fontSize.m           | 12px               | -- SC                                |
| Button     | fontSize.s           | 12px               | -- SC                                |
| Button     | fontSize.xl          | 18px               | -- SC                                |
| Button     | fontSize.xs          | 11px               | -- SC                                |
| Chip       | fontSize.m           | 13px               | -- SM                                |
| Chip       | fontSize.s           | 13px               | -- SM                                |
| Chip       | fontWeight           | 500                | -- SC                                |
| NavItem    | fontSize             | 12px               | -- SC                                |
| NavItem    | fontWeight           | 500                | -- SC                                |
| PageHeader | description.fontSize | 12px               | -- SC                                |
| PageHeader | title.fontSize.1     | 32px               | -- SC                                |
| PageHeader | title.fontSize.2     | 24px               | -- SC                                |
| PageHeader | title.fontWeight     | 700                | -- SC                                |
| StatCard   | delta.fontSize       | 11px               | -- SC                                |
| StatCard   | label.fontSize       | 11px               | -- SC                                |
| StatCard   | label.fontWeight     | 500                | -- SC                                |
| StatCard   | value.fontSize       | 40px               | -- SC                                |
| StatCard   | value.fontWeight     | 700                | -- SC                                |
| Table      | cell.fontSize        | 12px               | -- SC                                |
| Table      | header.fontSize      | 11px               | -- SC                                |
| Table      | header.fontWeight    | 600                | -- SC                                |
+------------+----------------------+--------------------+--------------------------------------+
+------------------------------------------- TAMANO --------------------------------------------+
| Badge      | height-s             | 24px               | -- ADR                               |
| Badge      | height-xs            | 20px               | -- ADR                               |
| Checkbox   | size                 | 16px               | primitive.size.100 (16px)            |
| Chip       | height-m             | 32px               | -- ADR                               |
| Chip       | height-s             | 28px               | -- ADR                               |
| Radio      | size                 | 16px               | primitive.size.100 (16px)            |
| SideNav    | width                | 224px              | -- SM                                |
| Switch     | height.m             | 20px               | primitive.size.125 (20px)            |
| Switch     | height.s             | 16px               | primitive.size.100 (16px)            |
| Switch     | thumb-size.m         | 16px               | primitive.size.100 (16px)            |
| Switch     | thumb-size.s         | 12px               | primitive.size.75 (12px)             |
| Switch     | width.m              | 36px               | primitive.size.225 (36px)            |
| Switch     | width.s              | 28px               | primitive.size.175 (28px)            |
| TopBar     | height               | 56px               | primitive.size.350 (56px) FE         |
+------------+----------------------+--------------------+--------------------------------------+
+------------------------------------------ ESPACIADO ------------------------------------------+
| Button     | padding.x-l          | 20px               | -- SM                                |
| Button     | padding.x-m          | 16px               | semantic.spacing.component-l (16px)  |
| Button     | padding.x-s          | 12px               | semantic.spacing.component-m (12px)  |
| Button     | padding.x-xl         | 24px               | semantic.spacing.component-xl (24px) |
| Button     | padding.x-xs         | 8px                | semantic.spacing.component-s (8px)   |
| Card       | padding              | 24px               | semantic.spacing.component-xl (24px) |
| Chip       | gap.m                | 6px                | -- SM                                |
| Chip       | gap.s                | 6px                | -- SM                                |
| Chip       | padding-x.m          | 16px               | primitive.spacing.100 (16px)         |
| Chip       | padding-x.s          | 12px               | primitive.spacing.75 (12px)          |
| Dialog     | padding              | 24px               | semantic.spacing.component-xl (24px) |
| Input      | gap.description      | 4px                | semantic.spacing.component-xs (4px)  |
| Input      | gap.label            | 4px                | semantic.spacing.component-xs (4px)  |
+------------+----------------------+--------------------+--------------------------------------+
+----------------------------------------- MOVIMIENTO ------------------------------------------+
| Button     | transition           | 120ms              | semantic.duration.base (120ms)       |
+------------+----------------------+--------------------+--------------------------------------+
+-------------------------------------------- BORDE --------------------------------------------+
| Chip       | border-width         | 1px                | -- SM                                |
+------------+----------------------+--------------------+--------------------------------------+
+-------------------------------------------- COLOR --------------------------------------------+
| Dialog     | overlay              | rgba(15,23,42,0.6) | -- SM                                |
+------------+----------------------+--------------------+--------------------------------------+
```
<!-- /AUTO -->
