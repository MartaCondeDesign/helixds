# Launch checklist

Everything that can be done while the repository is private is done. These are the steps for the day
Helix goes public, in order. Nothing here needs to happen before that day.

## Already in place

- CI on every pull request and push to `main` (`.github/workflows/ci.yml`)
- Packages ready for npm: `@helixds/react`, `tokens`, `eslint-plugin`, `mcp`, `proof`,
  `storybook-addon-tokens` (`@helixds/wc` stays private)
- Changesets + release workflow, **switched off** until step 5 (`RELEASE_ENABLED`)
- Storybook deploy workflow, which only runs while the repo is public
- CONTRIBUTING, Code of Conduct, CODEOWNERS, issue and PR templates, SECURITY.md
- Docs already in their published wording: README, `docs/getting-started.md`, SECURITY.md, the
  `@helixds/react` README and `AGENTS.md` (MCP via `npx @helixds/mcp`)
- Personal paths removed from the tracked files. Decided: commit `fe24c6e` keeps them in history
  (local folder names only, no secrets); not worth rewriting history.
- npm org `@helixds`: owned by Marta

## Launch day

### 1. Last check
```bash
pnpm release:dry
```
Lists the packages and versions that will be published, publishing nothing. CI on `main` must be green.

### 2. Make the repo public and turn on the GitHub features
```bash
scripts/launch-github.sh
```
It asks before making the repo public, then enables GitHub Pages (Storybook), protects `main` (CI and
code owner review required; you can still merge your own PRs as admin), turns on private
vulnerability reporting, and starts the first Storybook deploy.

### 3. First npm publish, from your machine
npm can only trust GitHub for a package that already exists, so the first version goes out by hand:
```bash
npm login
pnpm release:first
```
npm asks for your 2FA code. It publishes every public package at its current version and tags it.
Push the tags afterwards: `git push --tags`.

### 4. Trusted Publishing on each package
On npmjs.com, for **each** of `@helixds/react`, `@helixds/tokens`, `@helixds/eslint-plugin`,
`@helixds/mcp`, `@helixds/proof` and `@helixds/storybook-addon-tokens`:
package → **Settings** → **Trusted publishing** → **GitHub Actions**:

| Field | Value |
|---|---|
| Organization or user | `MartaCondeDesign` |
| Repository | `helixds` |
| Workflow filename | `release.yml` |
| Environment | *(empty)* |

Then, in the same Settings page, set **Publishing access** to require 2FA and disallow tokens: from
here on only GitHub publishes.

### 5. Switch the release workflow on
```bash
gh variable set RELEASE_ENABLED --body true --repo MartaCondeDesign/helixds
```
From now on: changesets in a merged PR → a **Version Packages** PR → merging it publishes.

### 6. Check
- https://martacondedesign.github.io/helixds/ loads
- https://www.npmjs.com/package/@helixds/react shows the version and the README
- In an empty folder: `npx @helixds/mcp` starts, and `npm i @helixds/react @helixds/tokens` works
