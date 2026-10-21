# Helix DS — Canonical Prop Vocabulary

The `verify:props` script rejects any prop name in the "Never" column found in `packages/**/*.tsx`.

## Core variants + sizes

| ✅ Canonical | ❌ Anti-synonyms         | Notes                                           |
|-------------|------------------------|-------------------------------------------------|
| `variant`   | `type`, `kind`, `mode` | Visual style selector (primary/secondary/etc.)  |
| `size`      | `scale`, `sz`          | Size selector: `xs` `s` `m` `l` `xl`           |
| `weight`    | `fontWeight`           | Typography weight                               |

## Boolean states

| ✅ Canonical | ❌ Anti-synonyms                   | Notes                                              |
|-------------|----------------------------------|---------------------------------------------------|
| `isLoading` | `loading`, `pending`, `isPending`, `busy` | Authored loading state — `is`-prefixed, the name agents reach for (ADR-022) |
| `disabled`  | `isDisabled`, `readonly`         | Native + authored disabled state                  |
| `current`   | `active`, `isActive`, `selected` | Navigation/tab current item                       |
| `expanded`  | `isExpanded`, `open`, `isOpen`   | Disclosure open state                             |
| `checked`   | `isChecked`, `selected`          | Checkbox/radio selected state                     |
| `invalid`   | `hasError`, `isError`, `error`   | Form field validation failure state               |
| `required`  | `isRequired`                     | Form field required state                         |

## Naming variants

| ✅ Canonical | ❌ Anti-synonyms                   | Notes                                              |
|-------------|----------------------------------|---------------------------------------------------|
| `danger`    | `error`, `destructive`, `delete` | Red variant for destructive actions               |
| `success`   | `positive`, `ok`, `valid`        | Green variant for confirmation                    |
| `warning`   | `caution`, `alert`               | Amber variant for warnings                        |
| `info`      | `information`, `tip`, `note`     | Blue variant for informational                    |
| `neutral`   | `default`, `muted`, `subtle`     | Gray/neutral variant                              |

## Event handlers

| ✅ Canonical | ❌ Anti-synonyms                   | Notes                                              |
|-------------|----------------------------------|---------------------------------------------------|
| `onClick`   | `onPress`, `onTap`, `onAction`   | Primary action — React's own handler, the name agents reach for (ADR-022) |
| `onChange`  | `onValueChange`, `onUpdate`      | Value change handler                              |
| `onFocus`   | `onFocused`                      | Focus event                                       |
| `onBlur`    | `onBlurred`                      | Blur event                                        |
| `onDismiss` | `onClose`, `onCancel`            | Dismissal/close action                            |

## Content + layout

| ✅ Canonical | ❌ Anti-synonyms                   | Notes                                              |
|-------------|----------------------------------|---------------------------------------------------|
| `label`     | `title`, `name`, `text`          | Visible or accessible label                       |
| `description`| `subtitle`, `hint`, `helper`   | Supporting text under label                       |
| `placeholder`| `hintText`, `ghostText`        | Empty-state hint text                             |
| `icon`      | `leftIcon`, `startIcon`, `leadingIcon`  | Leading icon — a Tabler icon component passed by reference (e.g. `IconPlus`), not a pre-instantiated element or string |
| `iconEnd`   | `rightIcon`, `endIcon`, `trailingIcon`  | Trailing icon — same reference convention as `icon`  |
| `labelEnd`  | `meta`, `suffix`, `trailingText`, `rightText`, `secondaryText` | Short secondary text aligned to the end of an option (a value, a count, a percentage) — same `End` convention as `iconEnd` |
| `children`  | `content`, `body`, `slot`        | React children slot                               |
| `options`   | `items`, `choices`, `list`       | The items a group, select or menu draws — an array of `{ value, label }`. In Figma: a VARIANT `options` = how many (1…7), `list-count` rule in contracts/figma-conversion.json |

## Width + alignment

| ✅ Canonical | ❌ Anti-synonyms                   | Notes                                              |
|-------------|----------------------------------|---------------------------------------------------|
| `fullWidth`  | `block`, `fluid`, `stretch`     | 100% width behavior                               |
| `align`      | `textAlign`, `justifyContent`   | Content alignment within component                |

## Anatomy size values

Always use the short single-letter scale:

| ✅ Use | ❌ Never   |
|--------|-----------|
| `xs`   | `xsmall`, `extra-small`, `tiny` |
| `s`    | `sm`, `small` |
| `m`    | `md`, `medium`, `base`, `default` |
| `l`    | `lg`, `large` |
| `xl`   | `xlarge`, `extra-large` |
| `2xl`  | `xxl`, `2xl` (ok in tokens, not in props) |

Prop *type* classification (boolean, variant/enum, text, icon reference, event handler, nested content)
and how each converts into a Figma component property live in `.ai/skills/components-to-figma.md` →
"Prop taxonomy" — that's process/build documentation, not naming vocabulary, so it stays out of this file.
