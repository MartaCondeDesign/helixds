/**
 * `pnpm figma:snapshot <file>` — write the Figma property snapshot (.ai/figma-props.json) from the JSON that
 * scripts/figma/read-props.js returns through the Figma MCP, then regenerate .ai/maps/figma-map.md.
 * Run it after every change to a component in Figma: the code-vs-Figma listing is then never hand-edited.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = path.resolve(import.meta.dirname, '../..');
const file = process.argv[2];
if (!file) { console.error('Usage: pnpm figma:snapshot <json returned by scripts/figma/read-props.js>'); process.exit(1); }
const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const read = raw.components ?? raw;
if (!read || typeof read !== 'object' || !Object.keys(read).length) { console.error('❌ no components in that file'); process.exit(1); }
const out = path.join(root, '.ai/figma-props.json');
const prev = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')).components ?? {} : {};
const today = new Date().toISOString().slice(0, 10);
const snapshot = {
  $comment: `Snapshot of every Helix component property in the Figma file (8iTiZ26AvebNtUwkkaKQ7m), read by scripts/figma/read-props.js through the Figma MCP and written by pnpm figma:snapshot on ${today}. Never edit by hand: run the read again after changing a component in Figma.`,
  components: Object.fromEntries(Object.keys(read).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })).map(k => [k, read[k]])),
};
fs.writeFileSync(out, JSON.stringify(snapshot, null, 2) + '\n');
const added = Object.keys(read).filter(k => !prev[k]), gone = Object.keys(prev).filter(k => !read[k]);
const changed = Object.keys(read).filter(k => prev[k] && JSON.stringify(prev[k].properties) !== JSON.stringify(read[k].properties));
console.log(`✅ .ai/figma-props.json — ${Object.keys(read).length} components${changed.length ? ` · changed: ${changed.join(', ')}` : ''}${added.length ? ` · new: ${added.join(', ')}` : ''}${gone.length ? ` · gone: ${gone.join(', ')}` : ''}`);
execSync('pnpm -s docs:figma-map', { cwd: root, stdio: 'inherit' });
