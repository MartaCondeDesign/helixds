/**
 * Trace logger for Helix DS.
 * Logs execution failures from consumer app CI pipelines, agents, or interactive sessions to `evals/traces/`.
 *
 * Usage:
 *   pnpm eval:trace --prompt "Task description" --code "path/to/component.tsx" --error "Error message" --source "consumer-ci-failure"
 *   npx tsx scripts/log-trace.ts --prompt "..." --code "..." --error "..."
 */
import fs from 'fs';
import path from 'path';

function argValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

const args = process.argv.slice(2);
const promptText = argValue(args, '--prompt') || 'Unspecified user prompt';
const codePathOrContent = argValue(args, '--code');
const errorMsg = argValue(args, '--error') || 'Build or contract verification failure';
const source = argValue(args, '--source') || 'consumer-ci-failure';
const appName = argValue(args, '--app') || 'consumer-app';

let generatedCode = '';
if (codePathOrContent) {
  if (fs.existsSync(codePathOrContent)) {
    generatedCode = fs.readFileSync(codePathOrContent, 'utf-8');
  } else {
    generatedCode = codePathOrContent;
  }
}

const timestamp = new Date().toISOString();
const id = `trace-ci-${Date.now()}`;

const tracesDir = path.resolve(import.meta.dirname, '../evals/traces');
if (!fs.existsSync(tracesDir)) {
  fs.mkdirSync(tracesDir, { recursive: true });
}

// Perform simple governance diagnosis
const canIt = !/#[0-9a-fA-F]{3,8}/.test(generatedCode) && !['onClick', 'isLoading', 'isDisabled'].some(syn => generatedCode.includes(syn));
const shouldIt = !/<button[\s>]/.test(generatedCode) || generatedCode.includes('@helix/react');
const mayIt = !generatedCode.includes('// [CUSTOM]') || /\/\/\s*\[CUSTOM\]\s+\w+/.test(generatedCode);

const traceRecord = {
  id,
  timestamp,
  source,
  appName,
  prompt: promptText,
  generatedCode: generatedCode || '// No code provided',
  errorDetails: errorMsg.split('\n').filter(Boolean),
  governanceAnalysis: {
    canIt,
    shouldIt,
    mayIt,
    violationCategory: !canIt ? 'mechanical-token-anti-synonym' : !shouldIt ? 'primitive-bypass' : 'governance-boundary',
    recommendedFix: 'Query Helix via pnpm helix component <Name> or follow AGENTS.md governance boundaries.',
  },
};

const fileTarget = path.join(tracesDir, `${id}.json`);
fs.writeFileSync(fileTarget, JSON.stringify(traceRecord, null, 2));

console.log(`\n✅ Trace recorded successfully!`);
console.log(`   ID:     ${id}`);
console.log(`   Source: ${source}`);
console.log(`   Saved:  ${fileTarget}\n`);
