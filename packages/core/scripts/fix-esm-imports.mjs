/**
 * Gives every relative import in dist/ its full path: `./components/Button` → `./components/Button/index.js`,
 * `./Button` → `./Button.js`.
 *
 * tsc keeps imports as written in src (extensionless, moduleResolution "Bundler"). Bundlers accept that, but
 * Node's ESM loader doesn't, and Node is what loads @helixds/react in a consumer's Vite SSR, Vitest or plain
 * `node` — it throws ERR_UNSUPPORTED_DIR_IMPORT on the first import. Rewriting dist keeps src unchanged and
 * one file per module (so .d.ts banners and tree-shaking stay as they are).
 * Runs as part of `build`, after tsc.
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(import.meta.dirname, '../dist');
const specifier = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"]+)\2/g;

const resolve = (file, spec) => {
  if (/\.(js|json|css)$/.test(spec)) return spec;
  const target = path.resolve(path.dirname(file), spec);
  if (fs.existsSync(`${target}.js`)) return `${spec}.js`;
  if (fs.existsSync(path.join(target, 'index.js'))) return `${spec}/index.js`;
  throw new Error(`fix-esm-imports: ${path.relative(dist, file)} imports "${spec}", which isn't in dist/`);
};

let rewritten = 0;
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(file); continue; }
    if (!/\.(js|d\.ts)$/.test(entry.name)) continue;
    const source = fs.readFileSync(file, 'utf8');
    const next = source.replace(specifier, (_, head, quote, spec) => `${head}${quote}${resolve(file, spec)}${quote}`);
    if (next !== source) { fs.writeFileSync(file, next); rewritten++; }
  }
};
walk(dist);
console.log(`✅ ESM imports — ${rewritten} files in dist/ use full paths`);
