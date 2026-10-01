# ADR-019 — MultiSelect: Select's field with the selected values as Chips inside

**Status:** Accepted · 2026-10-01

## Context

Helix had no way to pick several values from a list except `CheckboxGroup`, which shows every option
at once and doesn't scale past a handful. `Select`'s own contract already pointed to a "MultiSelect"
that didn't exist. A multi-select dropdown was once hand-built inside the Team Dashboard story and
reverted (it wasn't a real component). There is no native HTML equivalent with acceptable UX
(`<select multiple>` is a scrolling list box), so per CLAUDE.md rule 4 the primitive choice is recorded
here.

## Decision

**MultiSelect = Select's interaction model (ADR-013) + the selected values rendered as `Chip`s inside
the field.**

1. **Same rules as Select.** Same label/description/error anatomy, same 32px field height, same
   tokens (`--helix-select-*` — it is the same field, so it shares Select's tokens deliberately instead
   of duplicating a parallel `multiSelect.*` set that would have to be kept in lockstep), same popup
   (`Menu`), same keyboard model, same form participation (invisible native input for `required`).
2. **Chips inside, at Chip's `s` size (24px).** Centered in the 32px field, a chip sits 4px from the
   field's outer edge on every side. When the chips don't fit on one line the field grows downward
   (rows 4px apart) — the 32px is a minimum, not a fixed height. Each chip is `dismissible`; its ×
   removes that value. *(First built with 28px chips 2px from the edge; that read cramped, so Chip `s`
   itself became 24px — see ADR-004.)*
3. **No nested interactive controls.** A `<button>` can't contain the chips' dismiss buttons, so the
   field is a plain container holding the chips plus a `role="combobox"` button that fills the
   remaining space and owns real DOM focus (same as Select's trigger). Clicking anywhere on the empty
   part of the field toggles the menu. The chips' own main button is taken out of the tab order and
   hidden from assistive tech — the combobox announces the selection itself (visually hidden
   "N selected: A, B") — so only each chip's × is an extra stop.
4. **Menu learns `multiple`.** Rather than a second listbox, `Menu` gains `multiple` + `values`:
   `aria-multiselectable="true"` on the listbox and `aria-selected` per selected option. Menu stays the
   one popup-list primitive ADR-013 set it up to be.
5. **Toggle, don't close.** Enter/Space (and click) toggle the highlighted option and keep the menu
   open, so several values can be picked in one go. Escape/Tab close it. Backspace on the combobox with
   the menu closed removes the last selected value.

## Consequences

- A visual change to Select's field tokens changes MultiSelect too — intended.
- The field can be taller than 32px once chips wrap; in a same-row toolbar (same-row-sizing pattern)
  keep it to values that fit on one line, or give it its own row.
- The chip-to-edge margin is derived, not hand-set: (field height − chip height) / 2. A change to
  Chip `s` or the field height moves it automatically.
