/**
 * Error analysis for Helix DS: lists the failing generations of a variant (and recorded traces) with what
 * they missed, and the LLM judge's verdict when `pnpm eval:judge` has judged them (eval-judge.ts).
 *
 * Usage:
 *   pnpm eval:review --variant <id> [--prompt <id>] [--traces] [--no-code]
 */
import fs from 'fs';
import path from 'path';
import { loadPrompts, loadRuns, scorePrompt, argValue, GLOBAL_CHECKS } from './eval-lib.ts';

const args = process.argv.slice(2);
const variant = argValue(args, '--variant');
const promptFilter = argValue(args, '--prompt');
const showCode = !args.includes('--no-code');
const includeTraces = args.includes('--traces') || (!variant && !promptFilter);

// 1. Review Traces if requested
if (includeTraces) {
  const tracesDir = path.resolve(import.meta.dirname, '../evals/traces');
  if (fs.existsSync(tracesDir)) {
    const traceFiles = fs.readdirSync(tracesDir).filter(f => f.endsWith('.json'));
    console.log(`\n📋 Reviewing ${traceFiles.length} trace(s) in evals/traces/\n`);
    for (const file of traceFiles) {
      const trace = JSON.parse(fs.readFileSync(path.join(tracesDir, file), 'utf-8'));
      console.log('─'.repeat(100));
      console.log(`📌 TRACE: ${trace.id} (${trace.source})`);
      console.log(`   Prompt: ${trace.prompt}`);
      if (trace.errorDetails?.length) {
        console.log(`   Errors:`);
        for (const err of trace.errorDetails) console.log(`     • ${err}`);
      }

    }
    console.log('─'.repeat(100));
  }
}

// 2. Review Runs if variant specified
if (variant) {
  const prompts = new Map(loadPrompts().map(p => [p.id, p]));
  const ids = promptFilter ? new Set(promptFilter.split(',')) : undefined;

  const failing = loadRuns()
    .filter(r => r.variant === variant && (!ids || ids.has(r.promptId)))
    .map(r => (prompts.has(r.promptId) ? { ...r, ...scorePrompt(prompts.get(r.promptId)!, r.generatedCode) } : r))
    .filter(r => !r.passed || GLOBAL_CHECKS.some(c => r.globalChecks?.[c.id]));

  if (failing.length === 0) {
    console.log(`Nothing to review for variant "${variant}" — every generation passed.`);
  } else {
    console.log(`\n🔎 ${failing.length} generation(s) to review in variant "${variant}"\n`);
    for (const r of failing) {
      console.log('─'.repeat(100));
      console.log(`${r.passed ? '⚠️ ' : '❌'} ${r.promptId} · run ${r.runId} #${r.rep + 1} · score ${Math.round(r.score * 100)}% · ${r.file}`);
      console.log(`   Prompt: ${prompts.get(r.promptId)?.prompt.replace(/\s+/g, ' ').slice(0, 220) ?? '(prompt deleted)'}`);
      for (const c of r.successResults) if (c.pass === false) console.log(`   ✗ ${c.text}`);
      for (const c of r.invalidResults) if (c.pass === false) console.log(`   ⚠️  INVALID: ${c.text}`);

      // The LLM judge's verdict, when `pnpm eval:judge` has judged this answer (eval-judge.ts).
      if (r.judge) {
        console.log(`   ⚖️  Judge (${r.judge.model}): ${r.judge.passed ? 'pass' : 'fail'} · ${Math.round(r.judge.score * 100)}%`);
        for (const v of r.judge.verdicts) if (!v.pass) console.log(`      ✗ ${v.id} — ${v.reason}`);
      }

      if (showCode) {
        console.log('');
        console.log(r.generatedCode.split('\n').map(l => `   │ ${l}`).join('\n'));
      }
    }
    console.log('─'.repeat(100));
  }
}
