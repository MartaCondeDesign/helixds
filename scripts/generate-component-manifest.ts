/**
 * Generates contracts/manifest.json — a single consolidated index of every component,
 * derived from contracts/components/*.json and cross-checked against the real exports in
 * packages/core/src/index.ts and the Storybook story files.
 *
 * This file is GENERATED — do not hand-edit it. Run: pnpm docs:manifest
 * Run it after adding/removing a component, contract, export, or story — the same way
 * `pnpm docs:token-exceptions` is run after every token change (see root CLAUDE.md).
 */
import fs from 'fs';
import path from 'path';

const root           = path.resolve(import.meta.dirname, '..');
const contractsDir   = path.join(root, 'contracts/components');
const indexPath      = path.join(root, 'packages/core/src/index.ts');
const componentsDir  = path.join(root, 'packages/core/src/components');
const layoutDir      = path.join(root, 'packages/core/src/layout');
// Additive only (ADR-015) — a component may also have a Web Components pilot implementation
// alongside its React one. Most components have none; this stays null for those, same as
// `story` staying null when a story file doesn't exist yet.
const wcComponentsDir = path.join(root, 'packages/wc/src/components');
const storiesComponentsDir = path.join(root, 'apps/storybook/stories/Components');
const storiesLayoutDir     = path.join(root, 'apps/storybook/stories/Layout');
const outPath        = path.join(root, 'contracts/manifest.json');

const indexSrc = fs.readFileSync(indexPath, 'utf-8');

type Contract = {
  name: string;
  version: string;
  status?: string;
  purpose: string;
  a11y?: { role?: string; wcag?: string[]; keyboardNav?: string[] };
};

type ManifestEntry = {
  name: string;
  category: 'core' | 'layout';
  status: string;
  version: string;
  purpose: string;
  contract: string;
  implementation: string;
  wcImplementation: string | null;
  story: string | null;
  exports: {
    component: boolean;
    doc: boolean;
    types: string[];
  };
  a11yComplete: boolean;
};

type DriftIssue = { component: string; message: string };

const drift: DriftIssue[] = [];
const entries: ManifestEntry[] = [];

const contractFiles = fs.readdirSync(contractsDir).filter(f => f.endsWith('.json'));

for (const file of contractFiles) {
  const contract = JSON.parse(fs.readFileSync(path.join(contractsDir, file), 'utf-8')) as Contract;
  const name = contract.name;

  const isCore   = fs.existsSync(path.join(componentsDir, name));
  const isLayout = fs.existsSync(path.join(layoutDir, name));
  const category: 'core' | 'layout' = isLayout ? 'layout' : 'core';

  if (!isCore && !isLayout) {
    drift.push({ component: name, message: `Contract exists but no implementation folder found under components/ or layout/.` });
  }

  const implementation = isLayout
    ? `packages/core/src/layout/${name}`
    : `packages/core/src/components/${name}`;

  const wcDir = path.join(wcComponentsDir, name.toLowerCase());
  const wcImplementation = fs.existsSync(wcDir)
    ? `packages/wc/src/components/${name.toLowerCase()}`
    : null;

  // Component export: `export { Name }` or `export { Name, ... }` from the right path.
  const componentExportRe = new RegExp(`export \\{[^}]*\\b${name}\\b[^}]*\\}\\s*from '\\./(components|layout)/${name}'`);
  const hasComponentExport = componentExportRe.test(indexSrc);
  if (!hasComponentExport) {
    drift.push({ component: name, message: `No component export found in packages/core/src/index.ts.` });
  }

  // Doc export: `export { doc as NameDoc }`
  const docExportRe = new RegExp(`export \\{ doc as ${name}Doc \\}`);
  const hasDocExport = docExportRe.test(indexSrc);
  if (!hasDocExport) {
    drift.push({ component: name, message: `No '${name}Doc' export found in packages/core/src/index.ts.` });
  }

  // Type exports: find the `export type { ... } from './(components|layout)/Name'` line
  // (single-line or multi-line) and collect every identifier that starts with Name.
  const typeBlockRe = new RegExp(
    `export type \\{([^}]*)\\}\\s*from '\\./(components|layout)/${name}'`,
  );
  const typeMatch = indexSrc.match(typeBlockRe);
  const types = typeMatch
    ? typeMatch[1]!.split(',').map(t => t.trim()).filter(Boolean)
    : [];
  if (types.length === 0) {
    drift.push({ component: name, message: `No 'export type { ... }' block found for this component in packages/core/src/index.ts.` });
  } else if (!types.includes(`${name}Props`)) {
    drift.push({ component: name, message: `Type exports found but '${name}Props' is missing from them.` });
  }

  // Story file: Components/Name.stories.tsx or Layout/Name.stories.tsx
  const storyDir  = category === 'layout' ? storiesLayoutDir : storiesComponentsDir;
  const storyFile = path.join(storyDir, `${name}.stories.tsx`);
  const hasStory  = fs.existsSync(storyFile);
  if (!hasStory) {
    drift.push({ component: name, message: `No Storybook story found (expected ${path.relative(root, storyFile)}).` });
  }

  // a11y completeness: the contract scaffold defaults role to 'TODO' and wcag/keyboardNav to []
  // — a component whose contract was never filled in still has those literal placeholder values.
  const role = contract.a11y?.role;
  const a11yComplete = !!role && role !== 'TODO' && (contract.a11y?.wcag?.length ?? 0) > 0;
  if (!a11yComplete) {
    drift.push({ component: name, message: `a11y section in the contract is incomplete (role/wcag still a placeholder or empty).` });
  }

  entries.push({
    name,
    category,
    status:  contract.status ?? 'unknown',
    version: contract.version,
    purpose: contract.purpose,
    contract: `contracts/components/${file}`,
    implementation,
    wcImplementation,
    story: hasStory ? path.relative(root, storyFile) : null,
    exports: {
      component: hasComponentExport,
      doc:       hasDocExport,
      types,
    },
    a11yComplete,
  });
}

entries.sort((a, b) => a.name.localeCompare(b.name));

const manifest = {
  $comment: 'Generated by scripts/generate-component-manifest.ts — do not hand-edit. Run `pnpm docs:manifest` to regenerate.',
  generatedAt: new Date().toISOString(),
  count: entries.length,
  components: entries,
  drift,
};

const nextJson = JSON.stringify(manifest, null, 2) + '\n';
const prevJson = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf-8') : null;

// Ignore the generatedAt timestamp when deciding whether anything actually changed.
const strip = (s: string) => s.replace(/"generatedAt": "[^"]*",\n/, '');
const changed = prevJson === null || strip(prevJson) !== strip(nextJson);

fs.writeFileSync(outPath, nextJson);

if (drift.length > 0) {
  console.log(`⚠️  contracts/manifest.json regenerated — ${drift.length} drift issue(s) found:\n`);
  for (const d of drift) {
    console.log(`   ${d.component}: ${d.message}`);
  }
  console.log('');
} else if (changed) {
  console.log(`✅ contracts/manifest.json regenerated — ${entries.length} components, 0 drift issues`);
} else {
  console.log(`✅ contracts/manifest.json already matches — ${entries.length} components, 0 drift issues`);
}
