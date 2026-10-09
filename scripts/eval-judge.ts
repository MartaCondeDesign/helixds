/**
 * LLM-as-a-Judge for design quality — the part no parser can grade: hierarchy, copy, UX states.
 * Each prompt's hidden "# Judge rubric" lists items; a separate model judges an answer against them.
 *
 * Built like open-design-system-bench's judge (evals/bench/): the `claude` CLI headless, from an empty
 * temp dir, no tools, no MCP, structured JSON output. Blind: it sees the task, the rubric and the code —
 * never which context level, model or experiment produced it, nor which items are critical.
 *
 * It's a model's opinion, so it's checked like the other graders: `pnpm eval:calibrate --judge` makes it
 * judge each reference answer (must pass) and a deliberately badly-designed one (must fail the item the
 * flaw breaks). Costs tokens: one judge call per answer (haiku by default).
 *
 * Run: pnpm eval:judge [--prompt <id>,…] [--variant <id>] [--model <alias>] [--force]
 *   judges saved answers in evals/outputs/ whose prompt has a rubric and that have no verdict yet
 *   (--force: judge again). The verdict is stored on the answer as `judge`.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { loadPrompts, outputsDir, argValue, type EvalPrompt } from './eval-lib.ts';

export interface JudgeVerdict { id: string; pass: boolean; reason: string }
export interface JudgeResult {
  model: string;
  score: number; // share of rubric items passed, 0..1
  passed: boolean; // every critical item passed
  verdicts: JudgeVerdict[];
}

const SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, pass: { type: 'boolean' }, reason: { type: 'string' } },
        required: ['id', 'pass', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['verdicts'],
  additionalProperties: false,
};

const SYSTEM = [
  'You are a strict product-design reviewer. You judge one React answer to a UI task against a fixed rubric.',
  'Judge ONLY the rubric items given, each as something the code clearly does or does not do — not style taste.',
  'Pass an item only if the code clearly satisfies it; if the evidence is missing, partial or ambiguous, fail it.',
  'Read the user-facing copy (labels, messages) as a person using the screen would.',
  'Give one verdict per rubric item, using its id, with a one-sentence reason. Do not use any tools.',
].join('\n');

export async function judgeAnswer(prompt: EvalPrompt, code: string, model = 'haiku'): Promise<JudgeResult> {
  const user = [
    `# Task given to the developer\n\n${prompt.prompt}`,
    `# Rubric\n\n${prompt.judgeRubric.map(r => `- ${r.id}: ${r.text}`).join('\n')}`,
    `# The developer's answer\n\n\`\`\`tsx\n${code}\n\`\`\``,
  ].join('\n\n');
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-judge-'));
  const args = [
    '-p', '--output-format', 'json', '--model', model, '--tools', '', '--strict-mcp-config',
    '--no-session-persistence', '--system-prompt', SYSTEM, '--json-schema', JSON.stringify(SCHEMA),
  ];
  try {
    const raw = await new Promise<string>((resolve, reject) => {
      const child = spawn('claude', args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
      let out = '', err = '';
      child.stdout.on('data', d => (out += d));
      child.stderr.on('data', d => (err += d));
      child.on('close', code => (code === 0 ? resolve(out) : reject(new Error(`claude exited ${code}: ${err.slice(0, 300)}`))));
      child.stdin.end(user);
    });
    const envelope = JSON.parse(raw);
    const structured = envelope.structured_output ?? JSON.parse(String(envelope.result).match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    const byId = new Map<string, JudgeVerdict>((structured.verdicts ?? []).map((v: JudgeVerdict) => [v.id, v]));
    // An item the judge skipped counts as failed — never as passed.
    const verdicts = prompt.judgeRubric.map(r => byId.get(r.id) ?? { id: r.id, pass: false, reason: 'No verdict returned for this item.' });
    const critical = new Set(prompt.judgeRubric.filter(r => r.critical).map(r => r.id));
    return {
      model,
      score: verdicts.filter(v => v.pass).length / verdicts.length,
      passed: verdicts.every(v => v.pass || !critical.has(v.id)),
      verdicts,
    };
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const promptFilter = argValue(args, '--prompt');
  const variant = argValue(args, '--variant');
  const model = argValue(args, '--model') ?? 'haiku';
  const force = args.includes('--force');

  const prompts = new Map(loadPrompts(promptFilter).filter(p => p.judgeRubric.length).map(p => [p.id, p]));
  const files = fs.readdirSync(outputsDir).filter(f => f.endsWith('.json')).sort();
  let judged = 0, failedJudge = 0;
  for (const file of files) {
    const full = path.join(outputsDir, file);
    const run = JSON.parse(fs.readFileSync(full, 'utf-8'));
    const prompt = prompts.get(run.promptId);
    if (!prompt || run.source === 'self-test' || (variant && run.variant !== variant) || (run.judge && !force)) continue;
    try {
      const judge = await judgeAnswer(prompt, run.generatedCode, model);
      fs.writeFileSync(full, JSON.stringify({ ...run, judge }, null, 2));
      judged++;
      console.log(`${judge.passed ? '✅' : '❌'} ${run.promptId} · ${run.variant} · rep ${run.rep}  ${Math.round(judge.score * 100)}%` +
        judge.verdicts.filter(v => !v.pass).map(v => `\n   ✗ ${v.id} — ${v.reason}`).join(''));
    } catch (e) {
      failedJudge++;
      console.log(`⚠️  ${file}: ${(e as Error).message}`);
    }
  }
  console.log(`\nJudged ${judged} answer(s)${failedJudge ? `, ${failedJudge} failed to judge` : ''}. Model: ${model}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) main();
