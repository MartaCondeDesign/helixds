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
  date it was approved (and re-checked if the prop's type changes later), or
- a **Storybook story has no Figma representation** yet (§ 2b) → the owner says how Figma draws it, recorded in
  the contract's `figma.stories`.

## 1. Rules by type

The goal: **same name, shown the same way in the properties panel.** A code boolean is a Figma toggle, a code
string is a Figma text field, a code union is a Figma dropdown with the same values.

| Code prop | Figma property | Panel | Rule |
|---|---|---|---|
| List of drawn items (`options`, `actions`, `avatars`, `items` — an array) | `VARIANT` same name = how many items: `2` / `3` / … / `7` | dropdown | `list-count` |
| A list the component hands to another Helix component (`<Menu options={options}>` — Select, MultiSelect) | — on this component: an exposed nested instance of that component, whose own count VARIANT is picked | the nested component's properties, inside this one's panel | `list-delegated` |
| Union `'a' \| 'b'`, `1 \| 2` | `VARIANT`, same name, same values | dropdown | `union` |
| Boolean that changes the look (`disabled`, `invalid`, `checked`, `isLoading`, `fullWidth`, `hideLabel`…) | `VARIANT` `false` / `true` | toggle — Figma shows a false/true variant as one | `look-boolean` |
| Boolean that only shows/hides a part (`required`, `showCount`, `showCloseButton`, `dismissible`) | `BOOLEAN`, same name | toggle | `show-hide-boolean` |
| Required string a part renders (`label` → `{prefix}-label` / `-legend`), `placeholder`, the text `children` of Button/Accordion/Modal/SidePanel/Card | `TEXT`, same name | text field | `text` |
| Optional string with its own part (`description`, `errorMessage`, `primaryActionLabel`…) | `BOOLEAN` `name.` + `TEXT` `name` | toggle + text field | `optional-text` |
| Icon (`icon`, `iconEnd`) | `BOOLEAN` `name.` + `INSTANCE_SWAP` `name` (a required icon: only the swap, named `name`) | toggle + icon picker | `icon` |
| Optional slot (`header`, `actions`, `footer`, `sidenav`, `topbar`…) | `BOOLEAN`, same name | toggle | `slot` |
| Handlers (`on*`), `default*` twins (`defaultChecked`), ids, refs, data arrays, aria-only text, an overlay's `expanded` | — | not a design property | `skip`, `nested`, `aria-text`, `overlay-expanded` |
| A string no part renders — the `aria-label` `label` of IconButton, FAB, ChipGroup, SegmentedControl; Chart's `description` | — | not a design property: nothing to draw | `aria-text` |

**Lists become a count** (owner's rule 2026-10-21, `listCount` in the JSON): Figma can't loop over data, so a
list the component draws item by item — CheckboxGroup's and RadioGroup's `options`, AvatarGroup's `avatars`,
FAB's `actions`… — is a VARIANT named like the prop whose values are how many items show (`options` = 2 … 7, named exactly like the component's code prop;
each item an instance of the item component with its own example text). The range is 2–7 unless the contract's
`figma.listCount` sets another (`{ "avatars": { "min": 1, "max": 7 } }` — AvatarGroup, built before the rule). A list
that only shows inside an overlay is drawn open. Selected values (`value`, `values`,
`defaultValue`) and chart data (`categories`, `series`) aren't items on screen: code only.

**The count belongs to the component that draws the items** (owner's rule 2026-10-21, `listCount.owner`), never to a
component that contains it. AvatarGroup draws its avatars, Menu its options, FAB its actions — each has the count
VARIANT. Select and MultiSelect hand their `options` to Menu (`<Menu options={options}>` in the TSX), so they have **no
`options` property**: their `state=open` variants hold an exposed nested Menu instance (`isExposedInstance`) and the
designer picks how many options on that Menu, from the Select's own panel. It applies to any component the same way:
`scripts/figma/prop-rule.ts` finds the delegation in the code (rule `list-delegated` — no per-contract exception), and
the Figma audit's check 12 fails a delegating set with a count property or without the exposed instance.

**Items inside a list rest at default** (`listCount.itemsAtRest`): in a list component's own set (Menu, CheckboxGroup…)
no nested item is hovered, pressed or selected — those are the item component's own states (MenuItem `state=selected`),
drawn on the item, never inside the list. Audit check 12.

**Why a look-changing boolean is a VARIANT, not a BOOLEAN:** a Figma BOOLEAN can only show or hide a layer. It
can't change a color or a size, and `true` always means "visible" — so `hideLabel=true` could never hide the
label. A two-value `false`/`true` VARIANT can, and the panel still shows it as a toggle.

**Props that never get a Figma property, and why** (owner's decisions 2026-10-21 — `skip.why` in the JSON, so
nobody adds them again):

- **`src` (an image URL, Avatar):** Figma can't load an image from a URL, so there is never a `src` property. The
  look it decides — photo or initials — is a `withImage` `false`/`true` VARIANT (Avatar, AvatarGroup): a variant,
  not two booleans, because code shows one or the other, never both.
- **`aria-*` (`aria-describedby`, `aria-label`…):** read by screen readers only and set by code — Tooltip sets
  `aria-describedby` on its trigger. Nothing to draw. Components built on a native element accept them without
  declaring them; only Avatar (a `<span>`) and Tooltip declare `aria-describedby`, so Avatar can be a Tooltip trigger.

**A Figma property with no code prop is a failure, not a note:** figma-map lists it as `**Only in Figma:** ✗` and
the component isn't ✓ synced until it's renamed to the code prop, removed, or approved in the contract's
`figma.figmaOnly` (`{ approved, reason }`). Avatar's old `initials` (code: `label`) and AvatarGroup's `overflow`
(code: `max`) slipped through when this was only a note.

**`state` is the only Figma-only property:** `default` / `hover` / `press` / `focus` (+ `open`, `selected`) — CSS
pseudo-classes, not props. `disabled`, `invalid`, `checked`, `isLoading`… are never values of `state`.

**Helper properties end in a dot** (owner's rule 2026-10-21): the property that *is* the code prop keeps the code prop's
name exactly — TEXT `errorMessage` for `errorMessage: string`, INSTANCE_SWAP `icon` for `icon: TablerIcon`, TEXT
`value` for Select's `value: string`. The extra property only Figma needs — the toggle that shows it, or Select's
empty/selected look — is the same name with a `.` at the end (`errorMessage.`, `icon.`, `value.`), listed
right before it. Figma refuses two properties with one name, so the helper is the one whose name changes.

**Naming:** every Figma property name is camelCase, like code — never a space (owner's decision 2026-10-21). The Figma property is the code prop name, unchanged (`isLoading`, not `loading`); VARIANT values are
the code values, unchanged; an optional string's text property is `{name}`; layer names are the
`data-helix-part` values in the TSX. An optional icon's picker is named like the code prop (`icon`), and its toggle is the helper `icon.` — Figma refuses two
properties with the same name, so it can't share `icon` with the toggle.

## 2. Property order

**Variants first, on both sides** (owner's rule 2026-10-21): Figma's panel always lists VARIANT properties first
and can't interleave them with the rest, so Storybook does the same — the props that are Figma variants first, then
everything else, each group in the same order. Storybook takes its table order from the keys of each story file's
`meta.args`, so that's where the order is set. figma-map's **Storybook order** line fails (and the component drifts)
when a variant prop comes after a non-variant one.

**The reference is what Storybook shows**, read from its props table by `pnpm figma:story-order`
(`.ai/storybook-prop-order.json`) — never the contract's prop order, which Storybook doesn't follow (Chip: `label`
first in Storybook, fourth in the contract; that gap left 9 components out of order while the check said ✓).

Figma's properties come in **the code's order** — the order of the contract's props, which is the order Storybook's
Controls list them in (owner's decision 2026-10-21). One Figma limitation: the properties panel always shows the
VARIANT properties first. So each group follows the code order on its own:

1. the variants, in code order, with `state` last;
2. every other property, in code order — a BOOLEAN's `{name}` / `{name}` right after it, approved exceptions
   for native attributes (`value` on Input/Textarea) last.

`figma-map.md` shows a **Property order** line per component and `figma-drift` fails a component that breaks it.
Reordering existing properties means re-creating them: `scripts/figma/reorder-props.js` does it and puts back the
values instances already had.

## 2b. Every story has a Figma representation

Owner's rule 2026-10-21: every Storybook story of a component that shows a distinct look must say how Figma
represents it — or carry the owner's decision that it doesn't. (What slipped: Avatar's "With image" and "Initials"
stories had no Figma counterpart until the `withImage` variant was added.) The contract's `figma.stories` maps each
story export of `apps/storybook/stories/{Components,Layout}/{Name}.stories.tsx`:

| Value | Means | Example |
|---|---|---|
| `"prop=value, prop=value"` | the Figma properties/values that draw it — each name must be a Figma property of the set (or `state`) | `"WithImage": "withImage=true"` |
| `"default"` | the set's default variant — every property at its default value | `"Default": "default"` |
| `"layout"` | a showcase that only arranges existing variants (all sizes, all variants side by side, a group) | `"Sizes": "layout"` |
| `{ "figma": null, "reason": "…", "approved": "date" }` | the owner decided Figma doesn't draw it — behaviour only (keyboard `play` tests, controlled demos) or on purpose | `"KeyboardToggle": { "figma": null, "reason": "keyboard play test", "approved": "2026-10-21" }` |

**Keyboard stories are focus states, and focus is drawn** (owner's decision 2026-10-21): a keyboard `play` story maps to
`state=focus` — or, when the ring belongs to a child (a group's Checkbox, a Modal's close IconButton), `layout` with
that child at `state=focus`. A set with no `state=focus` stays ✗ until Figma draws it.

`figma-map.md` prints a **Stories → Figma** block per component (✓ / ✗ per story; a mapping for a story that no
longer exists is ✗ stale) and `figma-map.json` the same under `stories`. A ✗ makes `figma-drift` fail the
component, so it can't be ✓ synced. Filling `figma.stories` is the owner's decision — an agent shows the ✗ stories
and proposes a value for each, never fills it alone.

## 3. How variants are drawn

- **Disabled:** `disabled=true` only with `state=default` and `invalid=false` — a disabled control doesn't hover,
  take focus or validate. All its text (label, description, required `*`, legend) binds `text/disabled`
  ([disabled-state.md](patterns/disabled-state.md)).
- **Secondary toggles** (`fullWidth`, `hideLabel`, `isLoading`, `resize`) are drawn like every other variant: at
  every `size` and in every state the code can reach — `fullWidth` with default / hover / press / focus and
  disabled (owner's decision 2026-10-21; until then each was drawn once, at the default size and state, which left
  `fullWidth` and `isLoading` with no hover, focus or other sizes). The one limit is what code can't show: a loading
  Button, IconButton or Input is disabled (`disabled={disabled || isLoading}`), so `isLoading=true` is drawn at
  `state=default`, enabled and valid, only (`variants.loadingDisables`).
- **Impossible combinations aren't drawn** (Checkbox `checked` + `indeterminate`: code shows indeterminate). The
  contract's `figma.variantCombinations` lists what's left.
- **Focus ring never clipped:** in a variant that draws the focus ring (`state=focus`, and `state=open` where it
  shares the ring) **every frame around the ring layer has Clip Content off** — the ring is a 3px spread shadow
  outside the control, and a clipping parent cuts it. The **ring layer itself keeps Clip Content on**: Figma only
  draws a shadow's spread on a clipping frame (with it off the ring disappears). The audit fails otherwise
  (owner's decision 2026-10-20).
- **Booleans are toggled in the panel**, never expanded into extra variants or table columns.
- **Propstar table:** rows = the main look axis (`checked`, `variant`…), columns = the other axes grouped
  (`invalid: false` × state · `invalid: true` × state · `disabled: true`).

## Code-only components

**Icon** has no Figma component (owner's decision 2026-10-21). In code it exists to keep every icon right: it sets the
size, derives the stroke weight from that size (ADR-017 — a 12px and a 32px icon read the same weight) and handles
the color and the accessible label. In Figma that work is already done where icons are used: every component variant
places its icon instance at the right size with its stroke set for that size (a Button `s` and `l` each carry their
own). Designers take icons from the **Icons** page; the consuming component's `icon` property changes which one.
A loose icon scaled by hand doesn't re-derive its stroke the way code does — pick the icon at its size instead of
scaling it. The contract records it (`figma.codeOnly`, `figma.propertyMap` with no properties).

## 4. Common patterns

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

## 5. Where it shows

- **A prop that lives on a child component** (a list handed to a nested Helix component — Select's and MultiSelect's
  `options` go to their Menu) isn't "code only": figma-map writes `— on the child Menu › options` and the Storybook
  table shows `🎨 On the child Menu · VARIANT options = 2 / … / 7` (owner's rule 2026-10-21). Generated from the
  `list-delegated` rule for every component that hands a list to a child — nothing per component.

- **Every prop says how it reaches Figma — generated, never hand-written** (owner's rule 2026-10-21):
  `pnpm docs:figma-map` writes `.ai/maps/figma-map.json` — per component, per code prop, the Figma property it
  becomes, or `codeOnly: true` with the rule and why (`defaultChecked`: the uncontrolled twin of `checked`; `id`,
  `name`, `value`: form wiring; `on*`: behaviour). Storybook shows it on every component's docs page as a
  **Code → Figma** table right under the props (Prop · Figma · Why: `🎨 VARIANT checked = false / true` or
  `👾 Code only` — `.storybook/FigmaDocsPage.tsx`; Storybook's own props table has fixed columns).
  A contract never lists this per prop — it holds only the approved exceptions (`figma.propertyMap`, `figmaOnly`),
  so the listing can't drift from the standard.

- [`.ai/maps/figma-map.md`](figma-map.md) — generated: every component's props, the Figma property each must be,
  the rule (or exception) that says so, and what the Figma file has today (`.ai/figma-props.json`).
- `pnpm figma:props` — fails when a prop isn't covered or an exception is stale; `--prune` removes exceptions
  that only repeat the standard.
- `.ai/skills/components-to-figma.md` — how to build it in Figma.
