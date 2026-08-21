# Helix DS

Design system **AI-ready**: construido para que tanto personas como agentes de IA puedan generar UI consistente sin adivinar tokens, props o patrones de layout.

Base: elementos HTML nativos + WAI-ARIA escrito a mano, Tailwind CSS v4 y Tabler Icons. Ver el porqué en [ADR-001](docs/ADR/ADR-001-primitive-foundation.md).

## Qué hay aquí

- **`packages/tokens`** — tokens de diseño en formato DTCG (`tokens.json`) compilados a variables CSS (`--helix-*`) y constantes TS. Ver [ADR-002](docs/ADR/ADR-002-token-strategy.md).
- **`packages/core`** — componentes React (Button, Input, Select, Badge, Checkbox, Chip, RadioGroup, Switch, Textarea) que envuelven el elemento HTML nativo correspondiente.
- **`packages/storybook-addon-tokens`** — addon de Storybook para inspeccionar tokens.
- **`apps/storybook`** — Storybook con historias por componente y por patrón (`pnpm sb` → http://localhost:6006).
- **`contracts/`** — un `.json` por componente que define su contrato (props, variantes, reglas) antes de la implementación. Los contratos mandan sobre Figma.
- **`.ai/`** — mapas de props canónicas, patrones de diseño y skills para agentes de IA (Figma, tokens, iconos).
- **`docs/ADR/`** — decisiones de arquitectura: fundación de primitivos, estrategia de tokens, infraestructura para IA, escala de tamaños.
- **`evals/`** — prompts y outputs de evaluación automática (¿el código generado por un LLM usa los props/tokens correctos?).
- **`llms.txt`** — índice pensado para que un LLM cargue contexto del sistema rápidamente.

## Qué hemos hecho en este commit

- Refinado el pipeline de build de tokens (`packages/tokens/src/build.ts`, `tokens.json`) y su documentación (`packages/tokens/CLAUDE.md`).
- Añadidos scripts nuevos: `scripts/token-cli.ts` (alta de tokens), `scripts/token-naming-lib.ts` y `scripts/verify-token-naming.ts` (verificación de nomenclatura de tokens vía `pnpm verify:tokens`).
- Sincronizadas las historias de Storybook y los `.doc.ts` de componentes con los cambios de tokens.
- Actualizados los patrones (`.ai/maps/patterns/`) y skills de Figma (`.ai/skills/`).

## Comandos

```bash
pnpm install
pnpm sb                 # Storybook
pnpm contract <Name>     # scaffold de un contrato de componente nuevo
pnpm verify:contract     # valida contratos vs implementación
pnpm verify:props        # nombres de props vs .ai/maps/prop-map.md
pnpm verify:tokens       # nomenclatura de tokens
pnpm token:add           # alta de un token nuevo
pnpm eval:run            # evals de generación de código con LLM
```

## Reglas críticas (resumen)

1. Nunca `<div>` para layout — componentes de `packages/core/src/layout/`.
2. Color y border-radius: siempre token `--helix-*`, sin excepción.
3. Nueva pieza de UI sin equivalente HTML nativo → requiere ADR antes de implementarse.
4. Vocabulario de props canónico en `.ai/maps/prop-map.md`; los sinónimos no están permitidos.
5. Componente nuevo → primero el contrato en `contracts/components/{Name}.json`, luego el código.

Detalle completo en [CLAUDE.md](CLAUDE.md) / [AGENTS.md](AGENTS.md).
