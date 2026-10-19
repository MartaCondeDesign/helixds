# Security Policy

## Supported versions

Helix DS is in `0.x`: only the **latest published version** of the `@helixds/*` packages gets security
fixes. All packages share one version number, so "latest" means the same release for every package. Fixes
land on `main` and ship in the next release.

## Scope

Helix ships UI components and design tokens: static markup, CSS custom properties, and client-side
React — there's no server, no network calls, no data collection, and no credential handling anywhere
in `packages/`. Realistic report categories are things like:

- A component rendering unsanitized user-supplied content in a way that enables XSS (e.g. an `href`
  or `style` prop that isn't escaped).
- A `contracts/*.json` or `.ai/` file whose guidance would lead an AI agent to generate insecure code
  (e.g. suggesting `dangerouslySetInnerHTML` without a caveat).
- A supply-chain issue in a dependency pulled in by `packages/*/package.json`.

General bugs, accessibility gaps, and token/contract mismatches aren't security issues — file those as
a regular GitHub issue instead.

## Reporting a vulnerability

Please don't open a public issue for a security report. Instead, email
**martacondedesign@gmail.com** or use [GitHub's private security advisory form](../../security/advisories/new)
for this repository. Include the affected package/component, a minimal reproduction, and the impact
you'd expect.

There's no formal SLA at this stage (single-maintainer project) — expect an acknowledgment
within a few days.
