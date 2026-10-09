/**
 * Ships Helix's machine-readable docs inside the npm package, so an agent in a consumer project can read
 * them from node_modules even with no MCP server connected:
 *
 *   dist/contracts/<Name>.json   contracts/components/*.json   every prop, required flag, neverUseFor
 *   dist/contracts/manifest.json contracts/manifest.json       the component inventory
 *   dist/prop-map.md             .ai/maps/prop-map.md          canonical prop vocabulary + anti-synonyms
 *   dist/AGENTS.md               AGENTS.md                     the consumer agent guide
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
fs.copyFileSync(path.join(root, 'AGENTS.md'), path.join(dist, 'AGENTS.md'));

console.log(`✅ agent docs in dist/ — ${contracts.length} contracts, manifest, prop-map.md, AGENTS.md`);
