---
name: blog-images
description: Generate clean, on-brand images for Marta's blog posts and LinkedIn — code-window screenshots of real files (JSON, Markdown, folder trees), do/don't vocabulary tables, side-by-side "A → B → C" comparisons, staircase/level diagrams and simple SVG concept diagrams — rendered to 2x PNG with headless Chrome. Use whenever she asks to create, generate or redo images, illustrations, diagrams or screenshots for a post, article, newsletter or social media, or says "las imágenes del post".
---

# Blog images

Flat, quiet images that look like a tidy editor or a whiteboard sketch: real content, generous space,
one brand color. No stock art, no logos of tools, no shadows, no gradients.

## Brand rules (non-negotiable)

| Role | Value | Use |
|---|---|---|
| **Image width** | **always 3200px** | every PNG, no exceptions — `render()` locks it (1600 CSS px at 2x) and fails if a PNG comes out any other width. Only the height changes. |
| Page background | `#F5F5F5` | every image |
| Surface | `#FFFFFF` | windows, cards (1.5px `#E3E3E3` border, 20–24px radius) |
| Brand | `#017EE2` | fills, icons, toggles, buttons, large/bold text only — 4.1:1 on white, fails AA for small text |
| Brand text | `#0165B5` | any *small* text in brand color (JSON keys, headings in code, labels) — 5.9:1 on white |
| Brand tint / soft | `#E6F2FC` / `#B3D7F5` | highlighted panels / placeholder bars on a tint |
| Ink / muted / faint | `#1F2328` / `#6B6F76` / `#9AA0A6` | text / captions / punctuation and arrows |
| Success / danger | `#1A7F37` on `#E7F6EC`, `#CF222E` on `#FDEDEE` | ✅ / ❌ only — never decorative |

All of this lives in `THEME` in `scripts/blogimg.py`. To change the brand, change it **there**, never
per image. Any new text color must pass WCAG AA (4.5:1 normal, 3:1 large ≥18px or ≥14px bold) against
its background — compute it, don't eyeball it.

Text inside images is in the language of the post (her posts are usually English). Notes *to her*
about what to film or capture stay in Spanish.

## How to make images

1. **Use real content.** If the post is about a repo, read the actual files and excerpt them — never
   invent JSON, props or numbers. Trim to what reads at a glance (≈ 15–35 lines per window) and tell
   her what you trimmed.
2. Write a small script next to the output (or in the scratchpad) that imports the library:

   ```python
   import os, sys
   sys.path.insert(0, os.path.expanduser("~/.claude/skills/blog-images/scripts"))
   from blogimg import *
   render("imagen-2-contrato", page(window("contracts/components/Button.json", json_hl(src))), OUT, 1400)  # height only
   ```

   Building blocks: `page()`, `window(fname, body, width)`, `json_hl()`, `md_hl()`, `plain()`,
   `dict_table(rows)`, `column(label, inner, caption, title, top, width)`, `render(name, body, out_dir, h)`.
   `render` writes `<name>.png` (3200px wide) **and** `<name>.html` so she can tweak text herself.
   Content has to fit 1600 CSS px: for three columns use ~440–450px windows, 15–16px code font and
   `page(body, "padding:40px")`.
3. For a concept diagram, write inline SVG with `@token@` placeholders (e.g. `fill="@brand@"`) and
   substitute from `THEME` — SVG presentation attributes don't accept CSS `var()`. See
   `examples/cover-diagram.svg.tpl`.
4. **Captions are all alike:** muted gray `#6B6F76`, same size and weight (20px regular in SVG, 18px in HTML).
   Never highlight one caption in brand color or bold.
5. **Look at every PNG** with Read before handing it over. Check: nothing clipped, columns aligned at
   the top, content roughly centered, no text in `#017EE2` below 18px.
6. Name files `imagen-N-<slug>.png` matching the numbering in the post, save them where she asked
   (default: a `blog/` folder in the current project), and send them with SendUserFile.

## Layout recipes (all in `examples/ai-ready-ds-post.py`)

- **Code window** — one file, filename in the title bar: height 1000 (taller for long files).
- **Do/don't table** — `dict_table`, green pill for the right name, red struck-through pills for the wrong ones.
- **A → B → C** — three `column(..., width=440)` with `→` arrows, `align-items:flex-start`, 16px code, height 900.
- **Staircase / levels** — three columns with decreasing `top` offsets (260 / 130 / 0), label = "Level N · effort".
- **Cover diagram** — 1600×900 SVG (= 3200×1800 PNG): input card → thin brand-tinted layer → output card, short captions under each.

Run the worked example to see all five: `python3 ~/.claude/skills/blog-images/examples/ai-ready-ds-post.py <out_dir>`.

## Requirements

Google Chrome at `/Applications/Google Chrome.app` (used headless for rendering) and python3. No other installs.
