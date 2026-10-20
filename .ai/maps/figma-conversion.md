# Code → Figma conversion standard

**How a Helix code prop becomes a Figma property, and how a component's variants are drawn.** One standard for
every component (owner's decision, 2026-10-20 — root CLAUDE.md rule 16). The machine-readable source is
[`contracts/figma-conversion.json`](../../contracts/figma-conversion.json): `scripts/figma/prop-rule.ts` applies it
(`pnpm docs:figma-map`, `pnpm figma:props`) and `scripts/figma/expected-styles.ts` follows its variant rules. If
this page and the JSON ever disagree, the JSON wins and this page needs fixing.

**Approval.** The owner approves the standard once — changing `figma-conversion.json` is an owner-gated edit.
After that, a new component or a new prop converts on its own: it never needs an approval per component.
The owner is asked only when:

- a prop **no rule covers** (`pnpm figma:props` fails, pre-commit too) → the standard learns a new rule or
  pattern, or
- a component needs an **exception** → it's recorded in that component's contract, `figma.propertyMap`, with the
  date it was approved (and re-checked if the prop's type changes later).

## 1. Rules by type

The goal: **same name, shown the same way in the properties panel.** A code boolean is a Figma toggle, a code
string is a Figma text field, a code union is a Figma dropdown with the same values.

| Code prop | Figma property | Panel | Rule |
|---|---|---|---|
| Union `'a' \| 'b'`, `1 \| 2` | `VARIANT`, same name, same values | dropdown | `union` |
| Boolean that changes the look (`disabled`, `invalid`, `checked`, `isLoading`, `fullWidth`, `hideLabel`…) | `VARIANT` `false` / `true` | toggle — Figma shows a false/true variant as one | `look-boolean` |
| Boolean that only shows/hides a part (`required`, `showCount`, `showCloseButton`, `dismissible`) | `BOOLEAN`, same name | toggle | `show-hide-boolean` |
| Required string (`label`), `placeholder`, the text `children` of Button/Accordion/Modal/SidePanel/Card | `TEXT`, same name | text field | `text` |
| Optional string with its own part (`description`, `errorMessage`, `primaryActionLabel`…) | `BOOLEAN` `name` + `TEXT` `name text` | toggle + text field | `optional-text` |
| Icon (`icon`, `iconEnd`) | `BOOLEAN` `name` + `INSTANCE_SWAP` `name swap` (a required icon: only the swap, named `name`) | toggle + icon picker | `icon` |
| Optional slot (`header`, `actions`, `footer`, `sidenav`, `topbar`…) | `BOOLEAN`, same name | toggle | `slot` |
| Handlers (`on*`), `default*` twins (`defaultChecked`), ids, refs, data arrays, aria-only text, an overlay's `expanded` | — | not a design property | `skip`, `nested`, `aria-text`, `overlay-expanded` |

**Why a look-changing boolean is a VARIANT, not a BOOLEAN:** a Figma BOOLEAN can only show or hide a layer. It
can't change a color or a size, and `true` always means "visible" — so `hideLabel=true` could never hide the
label. A two-value `false`/`true` VARIANT can, and the panel still shows it as a toggle.

**`state` is the only Figma-only property:** `default` / `hover` / `press` / `focus` (+ `open`, `selected`) — CSS
pseudo-classes, not props. `disabled`, `invalid`, `checked`, `isLoading`… are never values of `state`.

**Naming:** the Figma property is the code prop name, unchanged (`isLoading`, not `loading`); VARIANT values are
the code values, unchanged; an optional string's text property is `{name} text`; layer names are the
`data-helix-part` values in the TSX. An optional icon's picker is `{name} swap` (`icon swap`) — Figma refuses two
properties with the same name, so it can't share `icon` with the toggle.

## 2. How variants are drawn

- **Disabled:** `disabled=true` only with `state=default` and `invalid=false` — a disabled control doesn't hover,
  take focus or validate. All its text (label, description, required `*`, legend) binds `text/disabled`
  ([disabled-state.md](patterns/disabled-state.md)).
- **Secondary toggles** (`fullWidth`, `hideLabel`, `isLoading`, `resize`): each is drawn **once** — on, with the
  other secondaries off, `state=default`, valid, enabled and the default `size`. The main axes (`checked`,
  `variant`, `value`…) keep all their values. They change the width, the label or one icon, which looks the same
  in every state, so crossing them with everything would only multiply copies.
- **Impossible combinations aren't drawn** (Checkbox `checked` + `indeterminate`: code shows indeterminate). The
  contract's `figma.variantCombinations` lists what's left.
- **Booleans are toggled in the panel**, never expanded into extra variants or table columns.
- **Propstar table:** rows = the main look axis (`checked`, `variant`…), columns = the other axes grouped
  (`invalid: false` × state · `invalid: true` × state · `disabled: true`).

## 3. Common patterns

A component follows one pattern; its row in [figma-map.md](figma-map.md) names it. A new component in a pattern
converts exactly like its siblings.

| Pattern | Components | Properties | `state` |
|---|---|---|---|
| **form-field** | Input, Textarea, Select, MultiSelect | `label` TEXT · `hideLabel`, `invalid`, `disabled`, `fullWidth` false/true · `required` BOOLEAN · `description`, `errorMessage` BOOLEAN + TEXT · `size` VARIANT · `icon`/`iconEnd` BOOLEAN + INSTANCE_SWAP | default / hover / focus |
| **checkable** | Checkbox, RadioButton, Switch | `label` TEXT · `checked` (+ `indeterminate`), `invalid`, `disabled` false/true · `required` BOOLEAN · `description`, `errorMessage` BOOLEAN + TEXT | default / hover / focus |
| **group** | CheckboxGroup, RadioGroup, ChipGroup | `label` TEXT (the legend) · `orientation` VARIANT · `invalid`, `disabled` false/true · `required` BOOLEAN · `description`, `errorMessage` BOOLEAN + TEXT — options are instances of the item component | none — hover/focus live in each item |
| **action** | Button, IconButton, FAB, Chip, SegmentedControl, NavItem | `children`/`label` TEXT · `variant`, `size` VARIANT · `icon`/`iconEnd` BOOLEAN + INSTANCE_SWAP · `isLoading`, `disabled`, `fullWidth` false/true | default / hover / press / focus |
| **overlay** | Modal, SidePanel, Menu, Tooltip | drawn open (`expanded` has no property) · `children` TEXT · `*ActionLabel` BOOLEAN + TEXT · `showCloseButton` BOOLEAN · `placement` VARIANT | default |
| **layout-slot** | AppShell, PageHeader, Card, TopBar, SideNav | slots (`header`, `actions`, `footer`, `sidenav`, `topbar`) BOOLEAN · `title`/`description` TEXT, or BOOLEAN + TEXT when optional | default |

**Shared anatomy in a pattern:** a label row is `{prefix}-label` holding the text plus `{prefix}-required` (the
`*`, text/danger, 2px = spacing/3xs after the text); then `{prefix}-description` and `{prefix}-error`. That is
what lets one rule convert `required`, `description` and `errorMessage` the same way in every component.

## 4. Where it shows

- [`.ai/maps/figma-map.md`](figma-map.md) — generated: every component's props, the Figma property each must be,
  the rule (or exception) that says so, and what the Figma file has today (`.ai/figma-props.json`).
- `pnpm figma:props` — fails when a prop isn't covered or an exception is stale; `--prune` removes exceptions
  that only repeat the standard.
- `.ai/skills/components-to-figma.md` — how to build it in Figma.
