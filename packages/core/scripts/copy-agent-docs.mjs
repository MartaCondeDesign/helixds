/**
 * Ships Helix's machine-readable docs inside the npm package, so an agent in a consumer project can read
 * them from node_modules even with no MCP server connected:
 *
 *   dist/contracts/<Name>.json   contracts/components/*.json   every prop, required flag, neverUseFor
 *   dist/contracts/manifest.json contracts/manifest.json       the component inventory
 *   dist/prop-map.md             .ai/maps/prop-map.md          canonical prop vocabulary + anti-synonyms
 *   AGENTS.md (package root)     AGENTS.md                     the consumer agent guide, where a listing of
 *                                                              node_modules/@helixds/react shows it first
 *
 * And it heads every component's .d.ts with where its contract is. Evals (installed level, 2026-10-09):
 * an agent in an app with only the package installed never opened dist/AGENTS.md, opened a .d.ts in 6 of
 * 15 answers, and the only 3 answers that compiled were the 3 that read contracts.
 *
 * Copies, not links: the sources live outside this package, and npm only publishes what is inside it.
 * Runs as part of `build`, so the copies can never be older than the code they describe.
 */
import fs from 'node:fs';
import path from 'node:path';

const pkg = path.resolve(import.meta.dirname, '..');
const root = path.resolve(pkg, '../..');
const dist = path.join(pkg, 'dist');
const contractsOut = path.join(dist, 'contracts');

fs.rmSync(contractsOut, { recursive: true, force: true });
fs.mkdirSync(contractsOut, { recursive: true });

const componentsDir = path.join(root, 'contracts/components');
const contracts = fs.readdirSync(componentsDir).filter(f => f.endsWith('.json'));
for (const file of contracts) fs.copyFileSync(path.join(componentsDir, file), path.join(contractsOut, file));
fs.copyFileSync(path.join(root, 'contracts/manifest.json'), path.join(contractsOut, 'manifest.json'));
fs.copyFileSync(path.join(root, '.ai/maps/prop-map.md'), path.join(dist, 'prop-map.md'));
fs.copyFileSync(path.join(root, 'AGENTS.md'), path.join(pkg, 'AGENTS.md'));
fs.rmSync(path.join(dist, 'AGENTS.md'), { force: true });

// Banners on the declaration files agents open. Marker-guarded, so a rerun without tsc doesn't stack them.
const MARK = '@helixds/react — agent note';
const banner = (lines) => `/**\n * ${MARK}\n${lines.map(l => ` * ${l}`).join('\n')}\n */\n`;
const prepend = (file, text) => {
  const current = fs.readFileSync(file, 'utf8');
  if (!current.includes(MARK)) fs.writeFileSync(file, text + current);
};
prepend(path.join(dist, 'index.d.ts'), banner([
  'Before writing JSX with Helix, read the contract of EVERY component you use (layout ones too):',
  '  node_modules/@helixds/react/dist/contracts/<Name>.json — exact props, which are required, the import line.',
  'Helix props differ from other libraries (Button text is children, not label; PageHeader takes label, not title;',
  'Card takes no style). Guide: node_modules/@helixds/react/AGENTS.md',
]));
let banners = 0;
for (const base of ['components', 'layout']) {
  for (const name of fs.readdirSync(path.join(dist, base))) {
    if (!contracts.includes(`${name}.json`)) continue;
    const note = banner([
      `Before using ${name}, read its contract: node_modules/@helixds/react/dist/contracts/${name}.json`,
      '(every prop, which are required, when not to use it, the import line). Do not guess Helix props.',
      'Guide: node_modules/@helixds/react/AGENTS.md',
    ]);
    for (const file of [`${name}.d.ts`, `${name}.types.d.ts`, 'index.d.ts']) {
      const full = path.join(dist, base, name, file);
      if (fs.existsSync(full)) { prepend(full, note); banners++; }
    }
  }
}

console.log(`✅ agent docs — ${contracts.length} contracts, manifest, prop-map.md in dist/; AGENTS.md at the package root; ${banners} .d.ts banners`);
