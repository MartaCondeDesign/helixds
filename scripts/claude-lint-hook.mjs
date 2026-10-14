#!/usr/bin/env node
/**
 * PostToolUse hook (Claude Code and Cursor: .claude/settings.json · Codex: .codex/hooks.json · Gemini CLI:
 * .gemini/settings.json AfterTool — scripts/hook-io.mjs translates each agent): lints the files the agent just
 * wrote with @helixds/eslint-plugin and, if they break a Helix rule, hands the problems back to the agent so it
 * fixes them in the same turn — the agent equivalent of the editor's live warnings.
 *
 * Reads the hook payload on stdin. In this repo it lints only what eslint.config.mjs covers (apps/**, JS/TS);
 * anything else exits silently. In an app that uses Helix (installed by `pnpm setup:ai`, run from this repo's
 * clone) it uses the app's own ESLint config when that config runs the Helix rules, and Helix's recommended
 * config otherwise — so the guardrail works in an app that never set up @helixds/eslint-plugin. Never fails
 * the tool call: a lint crash is reported, not thrown.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import helix from '@helixds/eslint-plugin';
import { feedback, helixRepo, projectDir, readPayload, toolCall } from './hook-io.mjs';
import { hasOpenLintBlock, recordHookTrace } from './hook-trace.mjs';

const payload = await readPayload();
if (!payload) process.exit(0);
const root = projectDir(payload);
const call = toolCall(payload);
const written = (call.kind === 'files' ? call.files : [])
  .filter(f => !f.deleted && /\.(jsx?|mjs|tsx?)$/.test(f.path))
  .map(f => path.resolve(root, f.path))
  .filter(f => !path.relative(root, f).startsWith('..') && fs.existsSync(f));
if (!written.length) process.exit(0);

// An app's own config, if it runs the Helix rules; Helix's recommended config if it doesn't (or has no
// config at all). Never inside this repo: here eslint.config.mjs decides, and it skips packages/core on purpose.
const fallback = new ESLint({
  cwd: root,
  overrideConfigFile: true,
  overrideConfig: [
    { ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/coverage/**'] },
    { ...helix.configs.recommended, languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } } },
  ],
});
async function projectRunsHelixRules(eslint, file) {
  try {
    const config = await eslint.calculateConfigForFile(file);
    return Object.keys(config?.rules ?? {}).some(rule => rule.startsWith('helix/'));
  } catch { return false; } // no eslint.config.* in the app
}
const own = new ESLint({ cwd: root });
const inHelixRepo = path.resolve(root) === helixRepo;

const report = [];
for (const file of written) {
  const eslint = inHelixRepo || (await projectRunsHelixRules(own, file)) ? own : fallback;
  if (await eslint.isPathIgnored(file)) continue;
  const relative = path.relative(root, file);
  const [result] = await eslint.lintFiles([file]);
  // No config applies (e.g. packages/core): ESLint reports a single "no matching configuration" warning.
  const problems = (result?.messages ?? []).filter(m => m.ruleId?.startsWith('helix/'));
  if (!problems.length) {
    // The agent fixed what an earlier block in this session reported: record that it recovered.
    if (hasOpenLintBlock(payload, file)) recordHookTrace({ hook: 'lint', decision: 'resolved', payload, file });
    continue;
  }
  recordHookTrace({
    hook: 'lint', decision: 'block', payload, file,
    findings: problems.map(m => ({ rule: m.ruleId, line: m.line, message: m.message })),
  });
  report.push({ relative, problems });
}
if (!report.length) process.exit(0);

const count = report.reduce((n, r) => n + r.problems.length, 0);
const lines = report.flatMap(({ relative, problems }) =>
  problems.map(m => `${relative}:${m.line}:${m.column} ${m.severity === 2 ? 'error' : 'warning'} ${m.ruleId} — ${m.message}`));
const names = report.map(r => r.relative).join(' ');
console.log(JSON.stringify(feedback(payload,
  `Helix lint found ${count} problem(s) in ${names}. Fix them before moving on (\`npx eslint --fix ${names}\` fixes props and import paths):\n${lines.join('\n')}`,
)));
