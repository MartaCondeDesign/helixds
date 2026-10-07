"""blogimg — render clean blog images (code windows, tables, diagrams) to PNG.

Usage from a script:
    import sys; sys.path.insert(0, "~/.claude/skills/blog-images/scripts")
    from blogimg import *
    render("my-image", page(window("file.json", json_hl(src))), out_dir, 1000)  # always 3200px wide

Everything visual comes from THEME so a new brand is a one-place change.
"""
import html, os, re, subprocess

# ---------------------------------------------------------------- theme
THEME = {
    "bg":          "#F5F5F5",   # page background (brand rule)
    "surface":     "#FFFFFF",   # cards / windows
    "surface-alt": "#F5F5F5",   # rows inside a white card
    "bar":         "#FAFAFA",   # window title bar
    "border":      "#E3E3E3",
    "divider":     "#EEEEEE",
    "ink":         "#1F2328",   # main text
    "muted":       "#6B6F76",   # secondary text
    "faint":       "#9AA0A6",   # punctuation, arrows
    "brand":       "#017EE2",   # fills, icons, large/bold text only (4.1:1 on white)
    "brand-text":  "#0165B5",   # small brand-colored text (5.9:1 on white)
    "brand-tint":  "#E6F2FC",   # brand-tinted surface
    "brand-soft":  "#B3D7F5",   # placeholder bars on a tint
    "success":     "#1A7F37", "success-tint": "#E7F6EC",
    "danger":      "#CF222E", "danger-tint":  "#FDEDEE",
    "string":      "#0A6E4F",   # JSON string values
}

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def css():
    t = THEME
    v = "".join(f"--{k}:{val};" for k, val in t.items())
    return f"""
:root{{{v}}}
html,body{{margin:0;padding:0;background:var(--bg)}}
body{{font-family:-apple-system,BlinkMacSystemFont,"Inter","Helvetica Neue",Arial,sans-serif;color:var(--ink)}}
.page{{box-sizing:border-box;width:100%;height:100vh;display:flex;align-items:center;justify-content:center;padding:60px}}
.win{{background:var(--surface);border:1.5px solid var(--border);border-radius:20px;overflow:hidden}}
.bar{{display:flex;align-items:center;gap:8px;padding:16px 20px;border-bottom:1.5px solid var(--divider);background:var(--bar)}}
.dot{{width:12px;height:12px;border-radius:50%;background:var(--border)}}
.fname{{margin-left:14px;font:500 17px "SF Mono",Menlo,monospace;color:var(--muted)}}
pre{{margin:0;padding:26px 34px 30px;font:19px/1.65 "SF Mono",Menlo,monospace;color:var(--ink);white-space:pre}}
.k{{color:var(--brand-text)}}.s{{color:var(--string)}}.p{{color:var(--faint)}}
.h{{color:var(--brand-text);font-weight:700}}.m{{color:var(--faint)}}.c{{color:var(--brand-text)}}
.label{{font:600 15px -apple-system,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:12px}}
.title{{font:700 26px -apple-system,sans-serif;margin-bottom:16px}}
.caption{{margin-top:16px;font-size:18px;color:var(--muted);line-height:1.45}}
.arrow{{font-size:40px;color:var(--faint);padding:0 22px}}
code.good{{font:18px "SF Mono",Menlo,monospace;border-radius:8px;padding:4px 10px;display:inline-block;background:var(--success-tint);color:var(--success);font-weight:600}}
code.bad{{font:18px "SF Mono",Menlo,monospace;border-radius:8px;padding:4px 10px;display:inline-block;background:var(--danger-tint);color:var(--danger);text-decoration:line-through;text-decoration-thickness:1.5px;margin-right:8px}}
table.dict{{border-collapse:collapse;margin:8px 34px 30px;font-size:19px}}
table.dict th{{text-align:left;font-weight:600;color:var(--muted);font-size:15px;letter-spacing:.06em;text-transform:uppercase;padding:18px 28px 14px 0}}
table.dict td{{padding:14px 28px 14px 0;border-top:1.5px solid var(--divider);vertical-align:middle}}
table.dict .note{{color:var(--muted);font-size:17px}}
"""

# ---------------------------------------------------------------- building blocks
def page(inner, style=""):
    return f'<div class="page" style="{style}">{inner}</div>'

def window(fname, body_html, width=None):
    w = f"width:{width}px" if width else ""
    return (f'<div class="win" style="{w}"><div class="bar"><span class="dot"></span><span class="dot"></span>'
            f'<span class="dot"></span><span class="fname">{html.escape(fname)}</span></div>{body_html}</div>')

def json_hl(src, font_size=None):
    """Keys in brand-text, string values green, punctuation faint.
    A string value may wrap onto the next line (split it by hand for a readable width)."""
    out, open_str = [], False
    for line in src.split("\n"):
        buf = ""
        if open_str:  # continuation of a string that wrapped
            m = re.match(r'((?:[^"\\]|\\.)*)("?)(.*)$', line)
            buf += f'<span class="s">{html.escape(m.group(1) + m.group(2))}</span>'
            open_str = not m.group(2)
            line = m.group(3)
        parts = re.split(r'("(?:[^"\\]|\\.)*(?:"|$))', line)
        for i, p in enumerate(parts):
            if i % 2 == 1:
                rest = "".join(parts[i + 1:]).lstrip()
                cls = "k" if rest.startswith(":") else "s"
                if len(p) == 1 or not p.endswith('"'):
                    open_str = True
                buf += f'<span class="{cls}">{html.escape(p)}</span>'
            else:
                buf += re.sub(r'([:,\[\]{}])', r'<span class="p">\1</span>', html.escape(p))
        out.append(buf)
    fs = f' style="font-size:{font_size}px"' if font_size else ""
    return f"<pre{fs}>" + "\n".join(out) + "</pre>"

def md_hl(src, font_size=None):
    """Markdown source: headings bold brand, `code` brand, list markers faint."""
    out = []
    for line in src.split("\n"):
        e = html.escape(line)
        if e.startswith("#"):
            e = f'<span class="h">{e}</span>'
        else:
            e = re.sub(r'^(- \[ \]|- )', r'<span class="m">\1</span>', e)
            e = re.sub(r'`([^`]+)`', r'<span class="c">`\1`</span>', e)
        out.append(e)
    fs = f' style="font-size:{font_size}px"' if font_size else ""
    return f"<pre{fs}>" + "\n".join(out) + "</pre>"

def plain(src, font_size=None):
    fs = f' style="font-size:{font_size}px"' if font_size else ""
    return f"<pre{fs}>{html.escape(src)}</pre>"

def dict_table(rows, headers=("✅ Canonical", "❌ Anti-synonyms", "Notes")):
    """rows: [(good, "bad1, bad2", note)] — a do/don't vocabulary table."""
    tr = "".join(
        f'<tr><td><span style="color:var(--success);font-weight:700;margin-right:10px">✓</span><code class="good">{html.escape(a)}</code></td>'
        f'<td>{"".join(f"<code class=bad>{html.escape(x.strip())}</code>" for x in b.split(","))}</td>'
        f'<td class="note">{html.escape(c)}</td></tr>' for a, b, c in rows)
    th = "".join(f"<th>{h}</th>" for h in headers)
    return f'<table class="dict"><tr>{th}</tr>{tr}</table>'

def column(label, inner, caption=None, title=None, top=0, width=None):
    """width: pin the column to its window width so a long caption wraps instead of widening it."""
    t = f'<div class="title">{title}</div>' if title else ""
    c = f'<div class="caption">{caption}</div>' if caption else ""
    w = f"width:{width}px;" if width else ""
    return f'<div style="display:flex;flex-direction:column;margin-top:{top}px;{w}"><div class="label">{label}</div>{t}{inner}{c}</div>'

# ---------------------------------------------------------------- render
# Brand rule: every exported PNG is exactly 3200px wide (1600 CSS px at 2x). Only the height varies.
WIDTH_CSS, SCALE = 1600, 2

def render(name, body, out_dir, h):
    """Write <out_dir>/<name>.html + .png — always 3200px wide, h*2 px tall."""
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, name + ".html")
    with open(path, "w") as f:
        f.write(f'<!doctype html><html><head><meta charset="utf-8"><style>{css()}</style></head><body>{body}</body></html>')
    png = os.path.join(out_dir, name + ".png")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    f"--force-device-scale-factor={SCALE}", f"--window-size={WIDTH_CSS},{h}",
                    f"--screenshot={png}", "file://" + os.path.abspath(path)],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    w = int(subprocess.run(["sips", "-g", "pixelWidth", png], capture_output=True, text=True).stdout.split()[-1])
    assert w == WIDTH_CSS * SCALE, f"{png} is {w}px wide, must be {WIDTH_CSS * SCALE}px"
    return png
