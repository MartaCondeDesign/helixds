# Changesets

Every pull request that changes what a published `@helixds/*` package ships adds a changeset:

```bash
pnpm changeset
```

It asks which packages change, whether it's a **patch** (a fix), **minor** (something new, or — while
Helix is `0.x` — a breaking change) or **major** (reserved for `1.0`), and one line for the changelog. Commit the
file it writes here with the rest of the PR.

All `@helixds/*` packages share one version number (`fixed` in `config.json`): `@helixds/react` and
`@helixds/tokens` read the same contracts and tokens, so a mismatched pair is never something to debug.
Private packages (`private: true`) are never versioned or published.

When it merges, `.github/workflows/release.yml` opens (or updates) a **Version Packages** pull request
that bumps the versions and writes each package's `CHANGELOG.md`. Merging that one publishes to npm.

Changes that don't reach a package (stories, docs, scripts, evals, CI) need no changeset.
