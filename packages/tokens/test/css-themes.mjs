// Resolves dist/helix.css the way a browser would for each theme: the :root blocks, then (for dark) the
// [data-theme="dark"] block on top, following var() chains to literal values. Used to prove that how dark mode
// is authored can change (build.ts map → DTCG resolver) while every rendered value stays the same.
import fs from 'node:fs';

function declarations(block) {
  const out = new Map();
  for (const m of block.matchAll(/(--helix-[\w-]+)\s*:\s*([^;]+);/g)) out.set(m[1], m[2].trim());
  return out;
}

/** { light, dark }: Map<cssVar, fully resolved value> for every --helix-* var, from the CSS text. */
export function resolveThemes(css) {
  const withoutMedia = css.replace(/@media[^{]*\{\s*:root[^{]*\{[^}]*\}\s*\}/g, '');
  const base = new Map();
  for (const m of withoutMedia.matchAll(/(^|\n):root\s*\{([^}]*)\}/g)) for (const [k, v] of declarations(m[2])) base.set(k, v);
  const darkBlock = css.match(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/)?.[1] ?? '';
  const dark = new Map([...base, ...declarations(darkBlock)]);
  const resolve = decls => {
    const memo = new Map();
    const value = (name, depth = 0) => {
      if (memo.has(name)) return memo.get(name);
      if (depth > 20) throw new Error(`var() cycle at ${name}`);
      const raw = decls.get(name);
      if (raw === undefined) return undefined;
      const v = raw.replace(/var\((--[\w-]+)\)/g, (_, ref) => value(ref, depth + 1) ?? `var(${ref})`);
      memo.set(name, v);
      return v;
    };
    return new Map([...decls.keys()].map(k => [k, value(k)]));
  };
  return { light: resolve(base), dark: resolve(dark) };
}

// CLI: node css-themes.mjs <helix.css> → JSON { light: {...}, dark: {...} }
if (import.meta.url === `file://${process.argv[1]}`) {
  const { light, dark } = resolveThemes(fs.readFileSync(process.argv[2], 'utf8'));
  console.log(JSON.stringify({ light: Object.fromEntries(light), dark: Object.fromEntries(dark) }));
}
