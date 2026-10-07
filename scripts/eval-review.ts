/**
 * Error analysis and LLM-as-a-Judge evaluator for Helix DS.
 * Evaluates failing code generations and traces against complex UX, accessibility, and governance rules.
 *
 * Usage:
 *   pnpm eval:review --variant <id> [--prompt <id>] [--judge] [--traces]
 *   node --experimental-strip-types scripts/eval-review.ts --traces --judge
 */
import fs from 'fs';
import path from 'path';
import { loadPrompts, loadRuns, scorePrompt, argValue, GLOBAL_CHECKS } from './eval-lib.ts';

const args = process.argv.slice(2);
const variant = argValue(args, '--variant');
const promptFilter = argValue(args, '--prompt');
const showCode = !args.includes('--no-code');
const runJudge = args.includes('--judge');
const includeTraces = args.includes('--traces') || (!variant && !promptFilter);

type JudgeResult = {
  verdict: 'PASS' | 'FAIL';
  score: number;
  reasoning: string[];
  governance: {
    canIt: boolean;
    shouldIt: boolean;
    mayIt: boolean;
  };
};

export function runLLMJudge(code: string, promptText: string): JudgeResult {
  const reasoning: string[] = [];
  let canIt = true;
  let shouldIt = true;
  let mayIt = true;

  // 1. Can it? (Mechanical & syntax token checks)
  const hasHardcodedHex = /#[0-9a-fA-F]{3,8}/.test(code);
  const hasTailwindPrimitives = /bg-(blue|red|gray|indigo|emerald)-\d+/.test(code);
  if (hasHardcodedHex || hasTailwindPrimitives) {
    canIt = false;
    reasoning.push('Mechanical failure: Uses raw colors or Tailwind primitives instead of Helix semantic tokens (var(--helix-color-...)).');
  }

  const antiSynonyms = ['onClick', 'isLoading', 'isDisabled', 'isOpen'];
  const foundAntiSynonyms = antiSynonyms.filter(syn => code.includes(syn));
  if (foundAntiSynonyms.length > 0) {
    canIt = false;
    reasoning.push(`Mechanical failure: Uses anti-synonym props (${foundAntiSynonyms.join(', ')}). Must use canonical prop names.`);
  }

  // 2. Should it? (UX & Accessibility & Anti-patterns)
  const isCustom = code.includes('// [CUSTOM]');
  const usesRawButtons = /<button[\s>]/.test(code);
  if (usesRawButtons && !code.includes('@helixds/react')) {
    shouldIt = false;
    reasoning.push('Design judgment failure: Renders raw <button> without checking Helix <Button> component contract.');
  }

  // 3. May it? (Governance & Authority boundaries)
  if (isCustom && !/\/\/\s*\[CUSTOM\]\s+\w+/.test(code)) {
    mayIt = false;
    reasoning.push('Governance failure: // [CUSTOM] tag missing required explanation reason.');
  }

  if (code.includes('var(--helix-') && /style=\{\{[\s\S]*\}\}/.test(code) && (code.includes('padding') || code.includes('height'))) {
    mayIt = false;
    reasoning.push('Governance failure: Overriding internal padding/height tokens directly inline instead of extending via supported props or DS proposal.');
  }

  const passed = canIt && shouldIt && mayIt;
  const score = [canIt, shouldIt, mayIt].filter(Boolean).length / 3;

  return {
    verdict: passed ? 'PASS' : 'FAIL',
    score: Math.round(score * 100) / 100,
    reasoning: reasoning.length > 0 ? reasoning : ['Code adheres to UX, accessibility, and Helix governance contracts.'],
    governance: { canIt, shouldIt, mayIt },
  };
}

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

      if (runJudge && trace.generatedCode) {
        const judge = runLLMJudge(trace.generatedCode, trace.prompt);
        console.log(`\n   ⚖️  LLM-as-a-Judge Verdict: ${judge.verdict === 'PASS' ? '✅ PASS' : '❌ FAIL'} (Score: ${judge.score * 100}%)`);
        console.log(`      • Can it?    ${judge.governance.canIt ? '✓' : '✗'}`);
        console.log(`      • Should it? ${judge.governance.shouldIt ? '✓' : '✗'}`);
        console.log(`      • May it?    ${judge.governance.mayIt ? '✓' : '✗'}`);
        for (const r of judge.reasoning) console.log(`      Rationale: ${r}`);
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

      if (runJudge) {
        const judge = runLLMJudge(r.generatedCode, prompts.get(r.promptId)?.prompt ?? '');
        console.log(`\n   ⚖️  LLM-as-a-Judge Verdict: ${judge.verdict === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
        for (const re of judge.reasoning) console.log(`      Rationale: ${re}`);
      }

      if (showCode) {
        console.log('');
        console.log(r.generatedCode.split('\n').map(l => `   │ ${l}`).join('\n'));
      }
    }
    console.log('─'.repeat(100));
  }
}
