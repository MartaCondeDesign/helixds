#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook (.claude/settings.json, on Edit|Write): lints the file Claude just wrote
 * with @helixds/eslint-plugin and, if it breaks a Helix rule, hands the problems back to Claude so it fixes
 * them in the same turn — the agent equivalent of the editor's live warnings.
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
import { hasOpenLintBlock, recordHookTrace } from './hook-trace.mjs';

const helixRepo = path.resolve(import.meta.dirname, '..');
const root = process.env.CLAUDE_PROJECT_DIR || helixRepo;

let input = '';
for await (const chunk of process.stdin) input += chunk;
const payload = JSON.parse(input || '{}');
const file = payload.tool_input?.file_path ?? payload.tool_response?.filePath;
if (!file || !/\.(jsx?|mjs|tsx?)$/.test(file)) process.exit(0);

const relative = path.relative(root, path.resolve(root, file));
if (relative.startsWith('..') || !fs.existsSync(path.resolve(root, file))) process.exit(0);

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
async function projectRunsHelixRules(eslint) {
  try {
    const config = await eslint.calculateConfigForFile(file);
    return Object.keys(config?.rules ?? {}).some(rule => rule.startsWith('helix/'));
  } catch { return false; } // no eslint.config.* in the app
}
let eslint = new ESLint({ cwd: root });
if (path.resolve(root) !== helixRepo && !(await projectRunsHelixRules(eslint))) eslint = fallback;
if (await eslint.isPathIgnored(file)) process.exit(0);

const [result] = await eslint.lintFiles([file]);
// No config applies (e.g. packages/core): ESLint reports a single "no matching configuration" warning.
const problems = (result?.messages ?? []).filter(m => m.ruleId?.startsWith('helix/'));
if (!problems.length) {
  // The agent fixed what an earlier block in this session reported: record that it recovered.
  if (hasOpenLintBlock(payload, file)) recordHookTrace({ hook: 'lint', decision: 'resolved', payload, file });
  process.exit(0);
}
recordHookTrace({
  hook: 'lint', decision: 'block', payload, file,
  findings: problems.map(m => ({ rule: m.ruleId, line: m.line, message: m.message })),
});

const lines = problems.map(m => `${relative}:${m.line}:${m.column} ${m.severity === 2 ? 'error' : 'warning'} ${m.ruleId} — ${m.message}`);
console.log(JSON.stringify({
  decision: 'block',
  reason: `Helix lint found ${problems.length} problem(s) in ${relative}. Fix them before moving on (\`npx eslint --fix ${relative}\` fixes props and import paths):\n${lines.join('\n')}`,
}));
