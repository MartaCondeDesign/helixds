#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook (.claude/settings.json, on Edit|Write): lints the file Claude just wrote
 * with @helixds/eslint-plugin and, if it breaks a Helix rule, hands the problems back to Claude so it fixes
 * them in the same turn — the agent equivalent of the editor's live warnings.
 *
 * Reads the hook payload on stdin. Lints only what eslint.config.mjs covers (apps/**, JS/TS); anything
 * else exits silently. Never fails the tool call: a lint crash is reported, not thrown.
 */
import path from 'node:path';
import { ESLint } from 'eslint';

const root = process.env.CLAUDE_PROJECT_DIR || path.resolve(import.meta.dirname, '..');

let input = '';
for await (const chunk of process.stdin) input += chunk;
const payload = JSON.parse(input || '{}');
const file = payload.tool_input?.file_path ?? payload.tool_response?.filePath;
if (!file || !/\.(jsx?|mjs|tsx?)$/.test(file)) process.exit(0);

const eslint = new ESLint({ cwd: root });
const relative = path.relative(root, path.resolve(root, file));
if (relative.startsWith('..') || await eslint.isPathIgnored(file)) process.exit(0);

const [result] = await eslint.lintFiles([file]);
// No config applies (e.g. packages/core): ESLint reports a single "no matching configuration" warning.
const problems = (result?.messages ?? []).filter(m => m.ruleId?.startsWith('helix/'));
if (!problems.length) process.exit(0);

const lines = problems.map(m => `${relative}:${m.line}:${m.column} ${m.severity === 2 ? 'error' : 'warning'} ${m.ruleId} — ${m.message}`);
console.log(JSON.stringify({
  decision: 'block',
  reason: `Helix lint found ${problems.length} problem(s) in ${relative}. Fix them before moving on (\`npx eslint --fix ${relative}\` fixes props and import paths):\n${lines.join('\n')}`,
}));
