# Helix DS — Component Token Exceptions

Every `component.*` token should alias `semantic.*` where a semantic role exists for it (per
`packages/tokens/CLAUDE.md` → "Token layers"). The table below lists every token that does **not** — it
aliases `primitive.*` directly, or has no alias at all (a raw literal) — grouped by token type, with the
proposed token and value that should replace the current one.

**This is not automatically a violation** — but a ✅ only stands if it's backed by an actual ADR, not a
structural gap or a comment in the audit script. Exactly one thing currently qualifies: a **documented
[ADR-004](../../docs/ADR/ADR-004-size-standard.md) exception** — Badge/Chip `height` use ADR-004's
"Compact/status components" density model instead of the shared control ladder, and (added 2026-08-23)
Chip's `gap` (`6px`, every size) stays an unreferenced literal because it doesn't land on the
`primitive.spacing.*`/`primitive.size.*` 4px grid and a one-off rung to name it would cost more than it
buys — see ADR-004's "One exception to that exception". The ADR names both explicitly.

**Typography (`fontSize`/`fontWeight`) is not a ✅** (2026-08-23 review). It used to be, on the reasoning that
no flat `semantic.fontSize.*`/`semantic.fontWeight.*` role layer exists — but that reasoning missed
Helix's actual semantic layer for typography: the named **Text Styles** at `semantic.textStyle.*` in
`tokens.json` (`display-6xl-bold`, `body-s-medium`, `caption-semibold`, ... — DTCG composite
`$type: "typography"` tokens, each `$value` an object of `fontFamily`/`fontSize`/`fontWeight`/`lineHeight`
aliases), mirrored 1:1 in the Figma file (`.ai/skills/tokens-to-figma.md` → Phase 6) and in Storybook
(`Foundation/Text Styles`). [`scripts/text-styles.ts`](../../scripts/text-styles.ts) loads and reshapes that
JSON for both this audit script and the Storybook story — it holds no data of its own. Each style combines
`primitive.fontSize` + `primitive.fontWeight` (+ the paired `semantic.lineHeight` rung) under one role name —
proposing a standalone `semantic.fontSize.xs` next to a standalone `semantic.fontWeight.semibold` would just
reinvent that combination badly, one property at a time, and miss that a matching combined style might
already exist.

The typography rows below are matched **per usage** (a component's fontSize+fontWeight pair, not each
property separately) against the full `semantic.textStyle.*` list, AND checked for whether they're already
fully wired: a row only disappears from the table when its `fontSize` *and* `fontWeight` both alias
straight into the **same named** `semantic.textStyle.{key}` (not just two values that happen to resolve to
a matching style — the actual reference has to name it). As of 2026-08-23, every `component.*`
fontSize/fontWeight token aliases a Text Style's own sub-property directly — `component.badge.fontSize` →
`{semantic.textStyle.caption-semibold.fontSize}`, not a step short at `{primitive.fontSize.s}` — the full
`primitive → semantic.textStyle → component` chain the rest of the token layers already use. Getting there
took a few kinds of fixes, worth remembering as the pattern for the next gap:
- **Filling in the untokenized half** — Button (`fontWeight`), Avatar (`fontSize`), and
  StatCard.delta/Table.cell/PageHeader.description (`fontWeight`) never got a `component.*` token for one
  side of the pair; the real value existed only hardcoded in `globals.css`. Added the missing token, then
  updated `globals.css` to reference it instead of the hardcoded value.
- **Snapping an off-scale literal onto the scale** — Chip's `fontSize` was a raw literal (`13px`, no
  `{...}` alias at all) that didn't land on any `primitive.fontSize.*` rung. Re-aliased it to
  `{primitive.fontSize.s}` (12px) — a real, deliberate value change, not just a tokenization — to actually
  match `Body / s / Medium` instead of only approximating it.
- **Adding the missing style** — 5 new `semantic.textStyle.*` entries where no existing style matched a
  real size+weight combo: `body-m-semibold`, `body-l-semibold`, `heading-2xl-bold`, `heading-xl-bold`,
  `heading-3xl-bold`.
- **Pointing straight at the Text Style, not just a matching primitive** — every `component.*` token above
  was re-aliased from `{primitive.fontSize/fontWeight.*}` to `{semantic.textStyle.{style}.fontSize/
  fontWeight}`. Required extending the alias resolver in `build.ts` (`resolveRef`) and
  `scripts/audit-token-exceptions.ts` (`getNode`) to walk *into* a composite token's `$value` object when a
  reference path continues past it — until 2026-08-23 the resolver only handled a path ending exactly on a
  token, never one that kept going into a sub-property.
- **Splitting a shared `fontWeight` into size variants** — Avatar, Button, and PageHeader.title each had
  ONE non-size-varying `fontWeight` token shared across size variants that resolve to **different** named
  styles (same resolved weight number either way, e.g. `600`/semibold for every Button size — but `xs`/`s`/
  `m` name `Caption / Semibold` while `l` names `Body / m / Semibold`). A single shared token can only point
  at one style's name at a time, so 4 rows (Avatar.l, Button.l, Button.xl, PageHeader.title.2) stayed 🚩
  after every other fix — value matched, but not wired to *that* size's actual style. Fixed by turning each
  into a `fontWeight.{size}` object (mirroring the `fontSize.{size}` shape it already had), one entry per
  size pointing at its own correct style — `component.button.fontWeight.xs/s/m` →
  `{semantic.textStyle.caption-semibold.fontWeight}`, `.l` → `{...body-m-semibold...}`, `.xl` →
  `{...body-l-semibold...}`. `globals.css` updated to match (the shared `font-weight` declaration moved out
  of each component's base rule into its per-size rule, alongside `font-size`). Every value is identical to
  before — this only makes explicit, per size, which named style it belongs to.

If a future component change reopens a 🆕 here, don't add a token or a new Text Style without confirming
first — figure out which of the three fixes above it needs, and which one changes rendered output (the
snap-to-scale kind) versus which is a pure tokenization (the other two).

Anything else that used to sit here as a ✅ with no ADR or structural reason behind it — just a hand-written
"reviewed one-off" note in the script — has also been reclassified to 🆕 (2026-08-23 review): a comment in
`KNOWN_EXCEPTIONS` recorded someone's judgment call, but judgment calls without an ADR are exactly the kind
of undocumented exception this table exists to surface, not suppress. `TopBar.height` (past `semantic.size`'s
top rung) and `Dialog.overlay` (a one-off backdrop color) now show as 🆕 pending an actual decision — see the
table below for each.

**Modal.overlay (formerly Dialog.overlay) — resolved 2026-09-24:** it used to be a raw
`rgba(15,23,42,0.6)` literal. It now aliases `semantic.color.fill.overlay` (the token that existed for exactly
this role, previously unused) and the 60% is `component.modal.overlay-opacity`, applied with `color-mix()`
in `globals.css` — same rendered color, now token-driven. Only the opacity remains a Modal-local ✅ ADR-010
exception (see ADR-010's "Backdrop" note).

**The 5 columns:**

- **Component** — which component owns the token.
- **Type** — the token's property, e.g. `height`, `padding-x`. A sub-part name like `title.fontWeight` stays
  dotted here rather than being split further. Typography rows show `textStyle` (or `{subpart}.textStyle`,
  e.g. `title.textStyle`) instead of `fontSize`/`fontWeight` — one row already represents the matched
  fontSize+fontWeight **pair**, not a single property (see the typography section above).
- **Size** — the t-shirt size variant (`xs`/`s`/`m`/`l`/`xl`...) split out into its own column instead of
  staying glued to the property name in **Type** — `Type: height`, `Size: s` instead of `height.s` or
  `height-s` in one string. This also normalizes Button's `padding.x-l` (axis and size fused into one key,
  an inconsistency with the rest of the system) into the same shape as everywhere else: `Type: padding-x`,
  `Size: l` — same display Chip's `padding-x.m` already had. A row with `--` here has no size variant at all
  (a single value, or the trailing segment is a sub-part name like `title`/`label`/`description`, not a
  size).
- **Proposed Token** — the flag, then the token name that should replace the current alias/literal — or,
  for a ✅ row, the reason it needs no replacement.
- **Proposed Value** — that proposed token's value (hex, px, etc.). For a ✅ row this is the token's own
  *current* value, not a change to make — nothing is being proposed, this column just states what the
  reviewed-and-kept exception actually resolves to.

**The flag prefixed onto "Proposed Token"** tells you the outcome at a glance:

| Flag | Meaning |
|------|---------|
| ✅ | Reviewed and correct as-is — no token needed. The only qualifying reason is a documented [ADR-004](../../docs/ADR/ADR-004-size-standard.md) density exception (Badge, Chip) |
| 🚩 | An existing token already has this exact value — should be reused instead of the current alias |
| 🆕 | No existing token matches — a new one is proposed, named mechanically from where it currently lives |

**What "Proposed Token" holds**, matching the flag:

- ✅ rows: "Proposed Token" holds the reason instead of a name (`ADR-004 exception`); "Proposed Value" holds
  the token's current, kept value (e.g. `6px` for Chip's `gap`) — not a change, just what it already is.
- 🚩 rows: a real, existing token name (e.g. `spacing-component-l`) — this token already has the exact same
  resolved value ("Proposed Value"), so re-aliasing to it is low-risk, same visual result, cleaner alias
  chain.
- 🆕 rows: a mechanically-generated new name — a starting point for a human to review, not a vetted
  proposal, before actually adding it. Two shapes, depending on the category: a **component**-scoped flat
  kebab name (e.g. `chip-font-size-s`) for everything outside typography; a **Text Style** name (e.g.
  `Heading / 3xl / Bold`) for every typography row — see the section above for how those are matched.

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
- When the auto-classifier flags a token 🚩/🆕 and it's actually a documented ADR exception (like Badge/Chip
  height under ADR-004), add one line to `KNOWN_EXCEPTIONS` in `scripts/audit-token-exceptions.ts` and rerun
  — it becomes ✅ and the doc follows. **Don't add an entry for a one-off judgment call with no ADR behind
  it** — that's exactly the undocumented-exception pattern this table exists to surface (see 2026-08-23
  review above). Write the ADR first, then add the entry.

---

<!-- AUTO:ASCII_TABLE -->
```
+-----------+-------------------+------+----------------------+-------------------------------------------------------------+
| Component | Type              | Size | Proposed Token       | Proposed Value                                              |
+===========+===================+======+======================+=============================================================+
+---------------------------------------------------------- COLOR ----------------------------------------------------------+
| Modal     | overlay-opacity   | --   | ✅ ADR-010 exception | 0.6                                                         |
+-----------+-------------------+------+----------------------+-------------------------------------------------------------+
+--------------------------------------------------------- MOTION ----------------------------------------------------------+
| Accordion | duration-chevron  | --   | ✅ ADR-016 exception | 250ms                                                       |
| Accordion | duration-collapse | --   | ✅ ADR-016 exception | 250ms                                                       |
| Accordion | duration-expand   | --   | ✅ ADR-016 exception | 250ms                                                       |
| Modal     | duration-close    | --   | ✅ ADR-010 exception | 150ms                                                       |
| Modal     | duration-open     | --   | ✅ ADR-010 exception | 250ms                                                       |
| SidePanel | duration-close    | --   | ✅ ADR-010 exception | 350ms                                                       |
| SidePanel | duration-open     | --   | ✅ ADR-010 exception | 400ms                                                       |
| Toast     | durationClose     | --   | ✅ ADR-011 exception | 250ms                                                       |
| Toast     | durationOpen      | --   | ✅ ADR-011 exception | 350ms                                                       |
| Tooltip   | duration-in       | --   | ✅ ADR-008 exception | 150ms                                                       |
| Tooltip   | duration-out      | --   | ✅ ADR-008 exception | 50ms                                                        |
+-----------+-------------------+------+----------------------+-------------------------------------------------------------+
+--------------------------------------------------------- SPACING ---------------------------------------------------------+
| Chip      | gap               | s    | ✅ ADR-004 exception | 6px                                                         |
| Chip      | gap               | m    | ✅ ADR-004 exception | 6px                                                         |
| Menu      | gap               | --   | ✅ ADR-013 exception | 2px                                                         |
+-----------+-------------------+------+----------------------+-------------------------------------------------------------+
+---------------------------------------------------------- SIZE -----------------------------------------------------------+
| Badge     | height            | xs   | ✅ ADR-004 exception | 20px                                                        |
| Fab       | action.height     | --   | ✅ ADR-004 exception | 36px                                                        |
| Switch    | height            | m    | ✅ ADR-004 exception | 20px                                                        |
+-----------+-------------------+------+----------------------+-------------------------------------------------------------+
+--------------------------------------------------------- SHADOW ----------------------------------------------------------+
| SidePanel | shadowBottom      | --   | ✅ ADR-005 exception | 0 -20px 25px rgba(0,0,0,0.1), 0 -10px 10px rgba(0,0,0,0.04) |
+-----------+-------------------+------+----------------------+-------------------------------------------------------------+
+---------------------------------------------------------- OTHER ----------------------------------------------------------+
| Input     | shake.distance    | --   | ✅ ADR-007 exception | 6px                                                         |
| Input     | shake.dur-b       | --   | ✅ ADR-007 exception | 60ms                                                        |
| Modal     | scale-enter       | --   | ✅ ADR-010 exception | 0.96                                                        |
| Toast     | autoDismissMs     | --   | ✅ ADR-011 exception | 4000ms                                                      |
| Toast     | depthFade         | --   | ✅ ADR-011 exception | 0.4                                                         |
| Toast     | depthScale        | --   | ✅ ADR-011 exception | 0.06                                                        |
| Toast     | rise              | --   | ✅ ADR-011 exception | 80px                                                        |
| Toast     | scaleEnter        | --   | ✅ ADR-011 exception | 0.97                                                        |
| Tooltip   | delay             | --   | ✅ ADR-008 exception | 500ms                                                       |
| Tooltip   | scale-enter       | --   | ✅ ADR-008 exception | 0.98                                                        |
+-----------+-------------------+------+----------------------+-------------------------------------------------------------+
```
<!-- /AUTO -->
