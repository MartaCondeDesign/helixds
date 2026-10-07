"""Worked example: the 6 images for the post "How to make your Design System agent-ready".

Run:  python3 ~/.claude/skills/blog-images/examples/ai-ready-ds-post.py <out_dir>
Content is excerpted from real files in the Helix DS repo — copy this file as a starting point.
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts"))
from blogimg import *

OUT = sys.argv[1] if len(sys.argv) > 1 else "."
HERE = os.path.dirname(os.path.abspath(__file__))

# 1 · Cover — a themeable SVG template (@token@ placeholders → THEME values)
svg = open(os.path.join(HERE, "cover-diagram.svg.tpl")).read()
for k, v in THEME.items():
    svg = svg.replace(f"@{k}@", v)
render("imagen-1-portada", f'<style>svg text{{font-family:-apple-system,"Inter",sans-serif}} .mono,.mono text{{font-family:"SF Mono",Menlo,monospace}}</style>{svg}', OUT, 900)

# 2 · Contract — one code window
contract = '''{
  "name": "Button",

  "purpose": "Triggers an action or navigates to a destination when pressed by the user.",

  "neverUseFor": [
    "Pure navigation between pages — use a plain <a>, styled separately",
    "Toggle state that persists — use a Toggle or Checkbox instead",
    "Submitting a form implicitly — always set type='submit' explicitly"
  ],

  "rationale": "The loading state retains button dimensions to prevent layout shift.
                Icons are fixed size to maintain touch target alignment and visual weight.",

  "governance": {
    "mayExtendLocally": [
      "Compose with custom tooltips or popover wrappers in product apps",
      "Pass custom aria-label or data-testid attributes"
    ],
    "mustEscalateToDS": [
      "Adding new global variants (e.g. 'compact', 'outline-primary')",
      "Overriding internal padding tokens or height tokens directly",
      "Introducing new size rungs (e.g. 'xs' or 'xl')"
    ]
  },

  "anatomy": [
    { "part": "button",          "element": "button" },
    { "part": "button-icon",     "element": "slot", "optional": true },
    { "part": "button-label",    "element": "span" },
    { "part": "button-icon-end", "element": "slot", "optional": true },
    { "part": "button-spinner",  "element": "svg",  "optional": true }
  ]
}'''
render("imagen-2-contrato", page(window("contracts/components/Button.json",
       json_hl(contract))), OUT, 1400)

# 3 · Vocabulary — do/don't table
rows = [
    ("variant", "type, kind, mode", "Visual style selector"),
    ("size", "scale, sz", "Size selector: xs s m l xl"),
    ("invalid", "hasError, isError, error", "Form field validation failure"),
    ("disabled", "isDisabled, readonly", "Disabled state"),
    ("onPress", "onClick, onTap, onAction", "Primary action"),
    ("label", "title, name, text", "Visible or accessible label"),
    ("icon", "leftIcon, startIcon, leadingIcon", "Leading icon"),
    ("iconEnd", "rightIcon, endIcon, trailingIcon", "Trailing icon"),
]
render("imagen-3-diccionario", page(window(".ai/maps/prop-map.md", dict_table(rows))), OUT, 1000)

# 4 · Three columns with arrows (primitive → semantic → component)
prim = '"primitive": {\n  "color": {\n    "red": {\n      "700": "#b91c1c"\n    }\n  }\n}'
sem  = '"semantic": {\n  "color": {\n    "text": {\n      "danger":\n        "{primitive.color.red.700}"\n    }\n  }\n}'
comp = '"component": {\n  "badge": {\n    "text": {\n      "danger":\n        "{semantic.color.text.danger}"\n    }\n  }\n}'
arrow = '<div class="arrow" style="margin-top:170px;padding:0 14px">→</div>'
badge = ('<div style="margin-top:22px"><span style="display:inline-flex;align-items:center;height:30px;padding:0 12px;'
         'border-radius:999px;background:#FEF2F2;border:1.5px solid #FECACA;color:#B91C1C;font:600 16px -apple-system,sans-serif">'
         'Payment failed</span></div>')
body = ('<div style="display:flex;align-items:flex-start">'
        + column("1 · Primitive", window("tokens.json", json_hl(prim, 16), 440), "<b>What it looks like.</b> A red. It says nothing about when to use it.", width=440)
        + arrow
        + column("2 · Semantic", window("tokens.json", json_hl(sem, 16), 440), "<b>What it means.</b> Text that signals danger. This is the name the agent searches for.", width=440)
        + arrow
        + '<div>' + column("3 · Component", window("tokens.json", json_hl(comp, 16), 440), "<b>Where it lives.</b> The Badge&#39;s danger label.", width=440) + badge + '</div>'
        + '</div>')
render("imagen-4-tokens", page(body, "padding:40px"), OUT, 900)

# 6 · Staircase of three levels
agents = '''# Helix DS — Consumer Agent Guide

## Setup (required, once)
import '@helix-ds/tokens/helix.css';
import '@helix-ds/core/globals.css';

## Component inventory
| `Badge`  | Communicates status...
| `Button` | Triggers an action...'''
tree = '''.ai/
├── maps/
│   ├── prop-map.md
│   ├── component-token-exceptions.md
│   └── patterns/
│       ├── empty-state.md
│       ├── form-field-group.md
│       └── group-spacing.md
├── memory/
│   └── agnostic-lessons.md
└── skills/'''
mcp = '''helix_list_components
  → "does Helix already have this?"

helix_get_contract
  → props, rationale, neverUseFor

helix_search_tokens
  → "danger background" → the token

helix_validate_snippet
  → checks code before it's written'''
body = ('<div style="display:flex;gap:28px;align-items:flex-start">'
        + column("Level 1 · an afternoon", window("AGENTS.md", md_hl(agents, 15), 450), title="Welcome note", top=260)
        + column("Level 2 · a few days", window(".ai/", plain(tree, 15), 450), title="Team handbook", top=130)
        + column("Level 3 · needs a developer", window("MCP server · tools", plain(mcp, 15), 450), title="A colleague you can ask")
        + '</div>')
render("imagen-6-puertas", page(body, "padding:40px"), OUT, 1000)

# 7 · Markdown file window
ev = '''# Prompt

Create a country picker using Helix DS with options for Spain,
France, and Germany, that shows an error message if the user
tries to submit without picking one.

# Success criteria

- [ ] Imports `Select` from `@helix-ds/core`
- [ ] Passes `options` as the list of choices (not `items`)
- [ ] Uses `invalid` prop for the error state (not `hasError`)
- [ ] Uses `errorMessage` prop for the error text
- [ ] Provides a `label` prop (required for a11y)

# Invalid patterns (auto-fail)

- `hasError=` or `isError=` — anti-synonyms for invalid
- `<div className="error">` — use the errorMessage prop instead'''
render("imagen-7-eval", page(window("evals/prompts/select-basic.md", md_hl(ev))), OUT, 1000)
print("done →", OUT)
