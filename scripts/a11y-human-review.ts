/**
 * Records a hands-on accessibility review — a person using the component with a real screen reader (and
 * keyboard, zoom…), judging what no automated check can: does the announcement make sense, is the order
 * natural, is anything missing or said twice. Appends to the contract's a11y.humanReview (newest last);
 * verify:stable reports which components have one and how old it is. Findings from `pnpm a11y:visual`
 * (.ai/a11y-visual/<Name>.json) are the place to start: confirm or dismiss each one here.
 *
 * Run: pnpm a11y:review <Name> --by "<who>" --with "<screen reader + browser>" --result pass|issues [--notes "…"]
 *   e.g. pnpm a11y:review Modal --by "Marta Conde" --with "VoiceOver + Safari 26" --result pass
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const opt = (name: string) => { const i = args.indexOf(name); return i === -1 ? undefined : args[i + 1]; };
const name = args[0] && !args[0].startsWith('--') ? args[0] : undefined;
const by = opt('--by'), withAt = opt('--with'), result = opt('--result'), notes = opt('--notes');

if (!name || !by || !withAt || !['pass', 'issues'].includes(result ?? '')) {
  console.error('Usage: pnpm a11y:review <Name> --by "<who>" --with "<screen reader + browser>" --result pass|issues [--notes "…"]');
  process.exit(1);
}
const file = path.join(root, 'contracts/components', `${name}.json`);
if (!fs.existsSync(file)) {
  console.error(`No contract for ${name} (contracts/components/${name}.json).`);
  process.exit(1);
}

const src = fs.readFileSync(file, 'utf8');
const contract = JSON.parse(src);
const entry = { date: new Date().toISOString().slice(0, 10), by, with: withAt, result, ...(notes ? { notes } : {}) };
const reviews = [...(contract.a11y?.humanReview ?? []), entry];
const block = `"humanReview": ${JSON.stringify(reviews, null, 2).replace(/\n/g, '\n    ')}`;

// Text edit, not a re-serialisation, so the rest of the contract keeps its formatting.
const updated = /"humanReview":\s*\[[\s\S]*?\n    \]/.test(src)
  ? src.replace(/"humanReview":\s*\[[\s\S]*?\n    \]/, block)
  : src.replace(/("a11y":\s*\{\n)/, `$1    ${block},\n`);
if (updated === src) {
  console.error(`Couldn't find the a11y section in ${name}.json.`);
  process.exit(1);
}
JSON.parse(updated); // never write a broken contract
fs.writeFileSync(file, updated);
console.log(`✅ ${name}: human review recorded (${entry.date}, ${by}, ${withAt}, ${result}). Run pnpm verify:stable to refresh the report.`);
