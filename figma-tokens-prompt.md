# Prompt para Claude: crear Variables y Text Styles en Figma (color, tipografía, espaciado)

Pegá esto tal cual en una conversación de Claude Code dentro de este repo (con el MCP de Figma conectado y el archivo de Figma ya abierto/creado).

---

Necesito que crees en Figma las Variables y Text Styles de Helix DS para **color, tipografía y espaciado**, siguiendo exactamente el proceso ya documentado en `.ai/skills/tokens-to-figma.md`.

Antes de tocar Figma:
1. Cargá el skill `figma-use` (es prerequisito obligatorio antes de cualquier llamada a `use_figma`).
2. Leé completo `.ai/skills/tokens-to-figma.md` — no te saltes secciones, define el layout de colecciones, las reglas de nombres y el orden de fases.
3. Leé `packages/tokens/src/tokens.json` para confirmar los valores actuales (no uses los del ejemplo del skill si ya cambiaron en el repo).
4. Confirmá conmigo el archivo de Figma destino (URL) si no está claro por el contexto.

Alcance de esta pasada — ejecutá, en este orden, **solo** las fases que tocan color/tipografía/espaciado:

- **Fase 1** — variables de color primitivo → colección `Primitives` (`color/{familia}/{paso}`).
- **Fase 2** — variables de color semántico → colección `Theme`, modos `light`/`dark` (`fill/*`, `text/*`, `icon/*`, `border/*`), con la gramática `{role}[-interactive][-modifier][-state]` traducida a segmentos `/`.
- **Fase 3** — variables de espaciado primitivo → colección `Primitives` (`spacing/{pct}`, escala porcentual, `spacing/100` = 16px).
- **Fase 3b** — variables de espaciado semántico → colección `Semantic` (`spacing/{xs,s,m,l,xl}`, alias de las primitivas de la Fase 3).
- **Fase 5** — variables de tipografía primitiva → colección `Primitives` (`fontSize/*`, `fontWeight/*`, `fontFamily/*`, y `lineHeight/{key}` como px resuelto = fontSize × ratio, nunca como variables de ratio con nombre).
- **Fase 6** — Text Styles, nombrados `{rol} / {peso}`, con las 4 propiedades (`fontSize`, `fontFamily`, `fontWeight`, `lineHeight`) enlazadas a variables reales — nunca dejar ninguna como literal suelto. Respetá el umbral de 18px: `Responsive.fontSize/lineHeight` para `l` en adelante, `Primitives` directo para `s`/`m`.

Reglas no negociables (ya están en el skill, pero remarco las que más se rompen):
- Exactamente 4 colecciones en todo el archivo: `Primitives`, `Theme`, `Semantic`, `Responsive`. Nunca crear una quinta.
- Ningún prefijo de sistema en el nombre de colección, variable o Text Style (nada de `Helix / Primitives`).
- `.description` se completa en variables de `Theme`/`Semantic` (copiado literal del `$description` de `tokens.json`), nunca en `Primitives`.
- Antes de crear una variable/estilo, comprobá si ya existe por nombre y actualizala en vez de duplicarla.

Al terminar cada fase, decime cuántas variables/estilos creaste o actualizaste, y flageá cualquier valor de `tokens.json` que no coincida con el ejemplo del skill (puede estar desactualizado).

No ejecutes las fases de `radius`, `size` semántico, `shadow` (Effect Styles) ni componentes — quedan fuera de esta pasada.

---

`<Si el archivo de Figma es nuevo, decime la URL o pedime que lo cree primero con figma-create-new-file antes de correr esto.>`
