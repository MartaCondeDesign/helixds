/**
 * Error analysis helper: prints every FAILING generation of a variant — which criteria it broke,
 * which global checks it tripped, and the code the agent actually wrote — so you can read them,
 * note what went wrong in evals/error-analysis.md, and decide which errors matter most.
 * Run: pnpm eval:review --variant <id> [--prompt <id>[,<id>…]] [--no-code]
 */
import { loadPrompts, loadRuns, scorePrompt, argValue, GLOBAL_CHECKS } from './eval-lib';

const args = process.argv.slice(2);
const variant = argValue(args, '--variant');
const promptFilter = argValue(args, '--prompt');
const showCode = !args.includes('--no-code');

if (!variant) {
  console.error('Pass --variant <id> (see `pnpm eval:report` for the list).');
  process.exit(1);
}

const prompts = new Map(loadPrompts().map(p => [p.id, p]));
const ids = promptFilter ? new Set(promptFilter.split(',')) : undefined;

const failing = loadRuns()
  .filter(r => r.variant === variant && (!ids || ids.has(r.promptId)))
  .map(r => (prompts.has(r.promptId) ? { ...r, ...scorePrompt(prompts.get(r.promptId)!, r.generatedCode) } : r))
  .filter(r => !r.passed || GLOBAL_CHECKS.some(c => r.globalChecks?.[c.id]));

if (failing.length === 0) {
  console.log(`Nothing to review for variant "${variant}" — every generation passed and tripped no global check.`);
  process.exit(0);
}

console.log(`\n🔎 ${failing.length} generation(s) to review in variant "${variant}"\n`);
for (const r of failing) {
  console.log('─'.repeat(100));
  console.log(`${r.passed ? '⚠️ ' : '❌'} ${r.promptId} · run ${r.runId} #${r.rep + 1} · score ${Math.round(r.score * 100)}% · ${r.file}`);
  console.log(`   Prompt: ${prompts.get(r.promptId)?.prompt.replace(/\s+/g, ' ').slice(0, 220) ?? '(prompt deleted)'}`);
  for (const c of r.successResults) if (c.pass === false) console.log(`   ✗ ${c.text}`);
  for (const c of r.invalidResults) if (c.pass === false) console.log(`   ⚠️  INVALID: ${c.text}`);
  for (const c of GLOBAL_CHECKS) if (r.globalChecks?.[c.id]) console.log(`   · global: ${c.description}`);
  if (showCode) {
    console.log('');
    console.log(r.generatedCode.split('\n').map(l => `   │ ${l}`).join('\n'));
  }
}
console.log('─'.repeat(100));
console.log('\nNext: write what you saw in evals/error-analysis.md (annotate → categorize → prioritize).');
