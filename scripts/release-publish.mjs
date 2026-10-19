/**
 * Publishes every public @helixds/* package whose current version isn't on npm yet — the `publish`
 * step of .github/workflows/release.yml, and the first-release command on a laptop.
 *
 * Why not `changeset publish`: it publishes through pnpm, and npm Trusted Publishing (OIDC, no token)
 * is only documented for the npm CLI. So each package is packed by pnpm (which rewrites `workspace:*`
 * to real versions) and the tarball is published by npm.
 *
 *   CI (GitHub Actions): OIDC via Trusted Publishing, with provenance. Needs npm ≥ 11.5.1 and a
 *     Trusted Publisher set on each package (npmjs.com → package → Settings → Trusted publishing:
 *     MartaCondeDesign/helixds, workflow release.yml).
 *   Laptop (first release only — npm can't trust a publisher for a package that doesn't exist yet):
 *     `npm login`, then `pnpm release:first`; npm asks for the 2FA code.
 *
 * Prints `New tag: <name>@<version>` per package (the line changesets/action reads to create the
 * GitHub releases) and creates that git tag; in CI it pushes the tags.
 * --dry-run packs and lists what would be published, publishing nothing.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dryRun = process.argv.includes('--dry-run');
const inCI = process.env.GITHUB_ACTIONS === 'true';

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8', ...opts });

const onNpm = (name, version) => {
  try {
    return run('npm', ['view', `${name}@${version}`, 'version'], { stdio: ['ignore', 'pipe', 'ignore'] }).trim() === version;
  } catch {
    return false; // 404: never published
  }
};

const packages = fs.readdirSync(path.join(root, 'packages'))
  .map(dir => path.join(root, 'packages', dir))
  .filter(dir => fs.existsSync(path.join(dir, 'package.json')))
  .map(dir => ({ dir, pkg: JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) }))
  .filter(({ pkg }) => !pkg.private && pkg.name?.startsWith('@helixds/'));

const pending = packages.filter(({ pkg }) => !onNpm(pkg.name, pkg.version));
if (pending.length === 0) {
  console.log('Every public @helixds/* version is already on npm — nothing to publish.');
  process.exit(0);
}

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-release-'));
const published = [];
for (const { dir, pkg } of pending) {
  const id = `${pkg.name}@${pkg.version}`;
  const tarball = run('pnpm', ['pack', '--pack-destination', outDir], { cwd: dir }).trim().split('\n').pop();
  if (dryRun) {
    console.log(`would publish ${id}  (${path.basename(tarball)})`);
    continue;
  }
  const args = ['publish', tarball, '--access', 'public'];
  if (inCI) args.push('--provenance');
  run('npm', args, { stdio: 'inherit' });
  run('git', ['tag', id]);
  console.log(`New tag: ${id}`);
  published.push(id);
}

if (inCI && published.length) run('git', ['push', 'origin', ...published.map(id => `refs/tags/${id}`)], { stdio: 'inherit' });
