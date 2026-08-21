# ADR-004 - Size standard for Helix components

**Date:** 2026-08-19
**Status:** Accepted

## Context

Component sizes drift if every new component invents its own `s`, `m`, and `l` meaning.
We want `m` to mean the same physical size wherever a component exposes that size.

## Decision

Helix uses a shared size standard by default.

### Control scale

| Size | Height |
|------|--------|
| `xs` | `24px` |
| `s`  | `32px` |
| `m`  | `36px` |
| `l`  | `40px` |
| `xl` | `48px` |

Use this scale for button-like components and interactive pills such as `Button` and `Chip`.

### Field scale

| Size | Height |
|------|--------|
| `s` | `32px` |
| `m` | `36px` |
| `l` | `40px` |

Use this scale for form fields such as `Input`, `Select`, and `Textarea`.

### Compact/status components

`Badge` and `Chip` are documented exceptions.

Default rule:
- components use the global scale unless their contract explicitly defines a local exception
- `m` is the reference size for the majority of components
- exceptions must state their local mapping in the contract and component docs

`Badge` and `Chip` use a local density model instead of the control ladder.

| Component | `size` meaning | Local height mapping |
|-----------|----------------|----------------------|
| `Badge`   | padding density | `xs = 20px`, `s = 24px` |
| `Chip`    | padding density | `s = 28px`, `m = 32px` |

`size` changes horizontal density; some exceptions also map size to local height steps.
This is a component-level exception, not a new global scale.

## Rules

- Use the global scale by default.
- Exceptions must be explicit in the contract and docs.
- `m` remains the reference size for standard components.
- Prefer the Button size ladder as the reference for new interactive components.

## Consequences

- `Button`, `Chip`, and similar controls stay visually aligned.
- Form fields stay aligned with each other.
- Compact status components can remain compact without polluting the shared control scale.
