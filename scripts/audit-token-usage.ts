/** Derived token-usage evidence. Counts stay out of contracts so they cannot go stale. */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const root = path.resolve(import.meta.dirname, '..');
const componentsDir = path.join(root, 'packages/core/src/components');
const output = path.join(root, 'quality/token-audit.json');
const componentOutput = path.join(root, 'quality/component-metrics.json');
const files = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const count = (text: string, pattern: RegExp) => [...text.matchAll(pattern)].length;
const report = fs.readdirSync(componentsDir, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => {
  const source = files(path.join(componentsDir, entry.name)).filter(file => /\.(tsx|ts|css)$/.test(file)).map(file => fs.readFileSync(file, 'utf8')).join('\n');
  const tokenRefs = count(source, /var\(--helix-[\w-]+\)/g);
  const hardcodedColors = count(source, /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g);
  const hardcodedDimensions = count(source, /\b\d+(?:\.\d+)?(?:px|rem)\b/g);
  const visualValues = tokenRefs + hardcodedColors + hardcodedDimensions;
  return { component: entry.name, tokenRefs, hardcodedColors, hardcodedDimensions, coverage: visualValues ? tokenRefs / visualValues : null };
});
const totals = report.reduce((sum, item) => ({ tokenRefs: sum.tokenRefs + item.tokenRefs, hardcodedColors: sum.hardcodedColors + item.hardcodedColors, hardcodedDimensions: sum.hardcodedDimensions + item.hardcodedDimensions }), { tokenRefs: 0, hardcodedColors: 0, hardcodedDimensions: 0 });
const generatedAt = new Date().toISOString();
const commit = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
const payload = { generatedAt, commit, totals: { ...totals, componentsWithGaps: report.filter(item => item.hardcodedColors + item.hardcodedDimensions > 0).length, coverage: (totals.tokenRefs + totals.hardcodedColors + totals.hardcodedDimensions) ? totals.tokenRefs / (totals.tokenRefs + totals.hardcodedColors + totals.hardcodedDimensions) : null }, components: report };
fs.writeFileSync(output, JSON.stringify(payload, null, 2) + '\n');
fs.writeFileSync(componentOutput, JSON.stringify({ generatedAt, commit, components: Object.fromEntries(report.map(item => [item.component, { tokenReferences: item.tokenRefs, hardcodedColors: item.hardcodedColors, hardcodedDimensions: item.hardcodedDimensions, tokenCoverage: item.coverage }])) }, null, 2) + '\n');
console.log(`Token audit: ${report.length} components, ${totals.tokenRefs} token references, ${totals.hardcodedColors + totals.hardcodedDimensions} hardcoded values.`);
