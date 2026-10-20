# ADR-004 - Size standard for Helix components

**Date:** 2026-08-19
**Status:** Accepted

## Context

Component sizes drift if every new component invents its own `s`, `m`, and `l` meaning.
We want `m` to mean the same physical size wherever a component exposes that size.

## Decision

Helix uses a shared size standard by default. The standard is expressed as **tokens**, not as a table of
raw px tied to prop names — the tokens exist independently of any single component's `size` prop and can be
reused by future components without redefining a ladder each time:

- `primitive.size.{50,75,100,125,150,175,200,225,250,300,350}` — a generic scale, agnostic of any component
  (same role as `primitive.spacing`, kept as its own scale because "a control's own dimension" and "the gap
  around it" are different concerns even where the numbers happen to coincide). Keys are percentages of the
  `100` rung, which anchors to `16px` (`1rem`) — the same anchor `primitive.spacing` uses.
- `semantic.size.{xs,s,m,l,xl}` — aliases `primitive.size.{100,150,200,250,300}` respectively. This
  is what the tables below actually mean by "Control scale".

### Control scale

| Size | Token | Primitive | Height |
|------|-------|-----------|--------|
| `xs` | `semantic.size.xs` | `primitive.size.100` | `16px` |
| `s`  | `semantic.size.s`  | `primitive.size.150` | `24px` |
| `m`  | `semantic.size.m`  | `primitive.size.200` | `32px` |
| `l`  | `semantic.size.l`  | `primitive.size.250` | `40px` |
| `xl` | `semantic.size.xl` | `primitive.size.300` | `48px` |

A clean `+8px` progression — `m` lands exactly on `primitive.size.200`, the scale's own anchor point (see
"Choosing `m`" below).

Use this scale for button-like components: `Button`.

### Field scale

| Size | Token | Primitive | Height |
|------|-------|-----------|--------|
| `s` | `semantic.size.s` | `primitive.size.150` | `24px` |
| `m` | `semantic.size.m` | `primitive.size.200` | `32px` |
| `l` | `semantic.size.l` | `primitive.size.250` | `40px` |

Use this scale for form fields such as `Input`, `Select`, and `Textarea`. **Textarea, Select and MultiSelect ship a single size, `m`** (owner's decision 2026-10-20 — Textarea's s and l were removed; its height is rows-driven anyway); only `Input` exposes the full s / m / l ladder. Same tokens as the Control
scale's `s`/`m`/`l` — one shared source, two components' worth of exposed rungs.

### Compact/status components

`Badge` and `Chip` are documented exceptions — interactive pills are **not** on the Control scale (the old
wording contradicted the exceptions table below by listing `Chip` under Control scale too).

Default rule:
- components use the global scale unless their contract explicitly defines a local exception
- `m` is the reference size for the majority of components
- exceptions must state their local mapping in the contract and component docs

`Badge` and `Chip` use a local density model instead of the control ladder — but their values still come
from the shared `primitive.size.*` scale, just not through `semantic.size`:

| Component | `size` meaning | Local height mapping |
|-----------|----------------|----------------------|
| `Badge`   | padding density | `xs = primitive.size.125` (20px), `s = primitive.size.150` (24px) |
| `Chip`    | padding density | `s = semantic.size.s` (24px — was `primitive.size.175` (28px) until 2026-10-01: 28px chips inside a 32px field read cramped, see ADR-019), `m = primitive.size.200` (32px) |

`size` changes horizontal density; some exceptions also map size to local height steps.
This is a component-level exception, not a new global scale — but it's still a real token, never a raw
px value with nothing behind it.

**Chip now aliases the Control scale directly** (`chip.height.s` → `semantic.size.s`, `.m` →
`semantic.size.m`, as of 2026-10-01), so both its rungs track a Control-scale change. **`Badge.s` (24px)
still lands on the same px as `semantic.size.s` by coincidence** — it aliases `primitive.size.150`, and
`.ai/maps/component-token-exceptions.md` flags it 🚩 (an existing token already has this exact value).
Re-pointing it is a live option (one less primitive-direct alias) weighed against `Badge.xs` (20px, no
`semantic.size` match) staying primitive — an open 🚩 to revisit, not a closed decision; don't add it to
`KNOWN_EXCEPTIONS` to make it go away.

**One exception to that exception, added 2026-08-23:** `Chip`'s internal icon/label `gap` is `6px` at every
size, and stays an unreferenced literal — `component.chip.gap.{s,m}`, no `primitive.*` alias. `6px` doesn't
land on the `primitive.spacing.*`/`primitive.size.*` grid (both step in 4px multiples: `4`, `8`, `12`...) and
isn't meant to — it's a deliberately tighter density than either neighboring rung (`4px` reads too cramped
next to Chip's `12`/`16px` horizontal padding, `8px` reads too loose for a compact pill), not an
approximation of one. Adding a one-off `primitive.spacing.37`/`primitive.size.87` rung just to give this a
name would break the grid's own 4px rhythm for every other consumer, for a value only Chip uses — worse than
the literal it would replace. Reviewed and kept as-is; `.ai/maps/component-token-exceptions.md`'s audit
records this in `KNOWN_EXCEPTIONS` (tag `ADR`, pointing here) rather than flagging it as a gap.

**FAB, added 2026-09-09:** ships a single size (48px, `semantic.size.xl` — the Control scale's own `xl`
rung, previously defined but unwired to any component). `FAB`'s revealed speed-dial actions
(`component.fab.action.height`) are their own documented local exception at `36px`
(`primitive.size.225`) — a size between Control's `m` (32px) and `l` (40px) that exists specifically
because a speed-dial action reads as "smaller than the trigger" without needing a whole second control
scale for one component's secondary elements. Same category as Badge/Chip's density model above: a real,
traceable primitive alias, not a magic number.

**Switch and Button l, added 2026-09-24:**
- `Switch` `m` is **20px** (`primitive.size.125`) — the Switch uses its own track proportions, not the
  control ladder (which jumps from 16px to 24px), same category as Badge/Chip above.
- `Button` `l` keeps **20px** of horizontal space per side, built from two real scale steps instead of an
  off-scale 20px: the button pads `16px` (`semantic.spacing.component-l`, same as size `m`) and its
  `button-label` box — a box inside the box — adds `4px` per side (`semantic.spacing.component-xs`, via
  `component.button.label.padding.x-l`). No literal, no exception: both values are on the scale.

## Rules

- Use the global scale by default.
- Exceptions must be explicit in the contract and docs, and must still alias `primitive.size.*` — a
  component-local value is allowed, an unreferenced px literal is not, **except** `Chip.gap` above, the one
  documented case where forcing a primitive alias would cost more (a grid-breaking rung) than it buys.
- `m` remains the reference size for standard components.
- Prefer the Button size ladder as the reference for new interactive components.

### Choosing `m` for a new component

Every component that exposes 2+ sizes MUST map one of them to `m` — a size ladder without an `m` rung
isn't valid. `m` is the default size whenever the component doesn't specify otherwise.

When scaffolding a new component, ask the user which of its sizes is the default before writing the
contract — don't assume. Whatever they answer, label that rung `m`.

If it isn't obvious from that answer which of the component's own literal size values should be `m`: pick
whichever is numerically closest to `32px` (`primitive.size.200`, the scale's own anchor rung — the Control
scale's `m` sits exactly on it, by design). Example: a component with two sizes measuring `40px` and `48px`
— `40` is closer to `32` than `48` is, so `40` becomes `m`.

## Consequences

- `Button` stays visually aligned to its own scale; `Input`/`Select`/`Textarea` stay aligned to each other
  and share Button's `s`/`m`/`l` tokens.
- Compact status components (`Badge`, `Chip`) can remain compact without polluting the shared control
  scale, while still being real, traceable tokens instead of magic numbers.
- New components always get an unambiguous `m` without re-litigating the scale from scratch.
