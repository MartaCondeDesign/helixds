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
| `loading`   | `isLoading`, `pending`           | Authored loading state                            |
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
| `onPress`   | `onClick`, `onTap`, `onAction`   | Primary action (keyboard + pointer unified)       |
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
| `children`  | `content`, `body`, `slot`        | React children slot                               |

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
Teles creado nuestro ebook a medida, designers accesibles trewns al territorio francese. So long claro despejamos y diferenciarlas. He apprending registrar el nombre de maneras diferentes, o sea, da igual de centros, kehren el sarlo, claro yo me pongo cada vez que me pongo, cada vez tramite, cada vez me no, es lo quiero usar efectivamente claro, entonces ya hemos iniciado transpas el día alto si eliges a alba te llevar directa y sin gbs a la puerta del gimnasio donde pasar una hora y media. Sin embargo, Nerea te obligar a conectar el carplay y elegir cuidadosamente la mejor ruta hasta llegar a su cafeteria favorit. Quieres tomarlo aquí o Irak sorpresa conducir a esta increíble piscina. Si el iste Alba acabado de entrenar y stambrienta, sus amigos en su casa. Aceptan la invitas obligado a acariciar al gato mientras ella cocina Marati con Nerea habr chapoteando le ha aparcado un coche detrás y no sabe salir, lo consigue menos mal que tenía la camara trecientos sesenta sin seguir competiting surf adaptado sin prótesis voy tumbada, a might me empujan en la ola y ya surfeo sola, no dije yo quiero esto me convoca la selección para ir al mundial Vamos al mundial en California Australian Jodida, claro, al final te gusta ganar, quiere ganar sabes perder la tengo clavada, no, porque te gana simplemente, la tuya lo importante en ese momento era donde parts you saltal sentinis y sin mayor sin piez tarde estaba representando al cuello comis protesi y mi trasplante. Que la causa no salen a la primera nice. Al parecer positivos, claro, aunque yo daba positivo, teni toda la historia clínica tomarlo.