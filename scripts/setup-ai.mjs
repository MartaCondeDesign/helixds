#!/usr/bin/env node
/**
 * Prepares a consumer project to use Helix with AI coding tools.
 *
 * Copies the approved AGENTS.md template into the target project, and writes a small
 * pointer file for whichever AI tool directories are already detected there (Cursor,
 * GitHub Copilot) so those tools pick up the same guidance without duplicating it.
 *
 * Idempotent: running it twice does not duplicate content. If a target file already
 * exists with DIFFERENT content, it is never silently overwritten — reported as a
 * conflict instead, so a human decides.
 *
 * Guardrails (Claude Code) — unless --agents-only: the same checks this repo runs on its own agents, pointed
 * at this clone of Helix, so they work in the app without copying any code into it:
 *   .mcp.json               the Helix MCP server (contracts, token search, helix_validate_snippet)
 *   .cursor/mcp.json        the same server for Cursor — only if the app already has .cursor/; Cursor runs the
 *                           hooks from .claude/settings.json (its "third-party hooks" setting)
 *   .codex/config.toml      Codex (ChatGPT's coding agent): the MCP server; .codex/hooks.json: the hooks
 *   .gemini/settings.json   Gemini CLI: the MCP server, the hooks and AGENTS.md as its context file
 *                           — Codex and Gemini when the app has .codex/ / .gemini/, or with --with codex,gemini
 *   .claude/settings.json   the three hooks — contracts read before writing (claude-contract-hook), Helix lint
 *                           after writing (claude-lint-hook) and owner approval before Helix itself is patched
 *                           in node_modules (claude-owner-gate-hook)
 * Both reference the clone as ${HELIX_DS_DIR:-<this clone's path>}: each teammate with a clone elsewhere sets
 * HELIX_DS_DIR, so the files can be committed. They're merged, not overwritten: missing entries are added next
 * to the app's own servers and hooks; an existing `helix` server that points somewhere else is a conflict.
 *
 * Run: node scripts/setup-ai.mjs [target-dir] [--dry-run] [--agents-only] [--with codex,gemini|all]
 * Default target-dir is the current working directory.
 *
 * AGENTS.md is the single source of truth this copies; the pointer files only point back to it.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const agentsOnly = args.includes('--agents-only');
// --with codex,gemini: install for these agents even if the app has no .codex/ or .gemini/ folder yet.
const withArg = args.find(a => a.startsWith('--with='))?.slice(7) ?? (args.includes('--with') ? args[args.indexOf('--with') + 1] : '');
const withAgents = new Set(withArg.split(',').map(a => a.trim().toLowerCase()).filter(Boolean));
const uses = agent => withAgents.has(agent) || withAgents.has('all') || fs.existsSync(path.join(targetDir, `.${agent}`));
const targetDir = path.resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--with') ?? process.cwd());

const TEMPLATE_PATH = path.join(repoRoot, 'AGENTS.md');

/** A file this script may write, plus how to build its content for a given target. */
const PLAN = [
  {
    // The approved template itself — always written/checked, regardless of which tools
    // are detected. AGENTS.md is the one file every tool can be pointed at directly.
    targetPath: () => path.join(targetDir, 'AGENTS.md'),
    content: () => fs.readFileSync(TEMPLATE_PATH, 'utf-8'),
    detect: () => true,
  },
  {
    // Cursor reads .cursor/rules/*.mdc — only written if the project already has a
    // .cursor/ directory, i.e. Cursor is actually in use here. Never create the
    // directory itself; that's the editor's job, not this script's.
    targetPath: () => path.join(targetDir, '.cursor', 'rules', 'helix.mdc'),
    content: () => `---\ndescription: Helix DS agent guidance\nalwaysApply: true\n---\n\nSee AGENTS.md at the project root for the full Helix DS guide (setup, component inventory, prop vocabulary, token usage). This file exists so Cursor picks it up automatically — AGENTS.md remains the single source of truth; do not duplicate its content here.\n`,
    detect: () => fs.existsSync(path.join(targetDir, '.cursor')),
  },
  {
    // GitHub Copilot reads .github/copilot-instructions.md — only written if .github/
    // already exists (a real GitHub-connected repo), same detection principle as Cursor.
    targetPath: () => path.join(targetDir, '.github', 'copilot-instructions.md'),
    content: () => `# Helix DS\n\nSee AGENTS.md at the project root for the full Helix DS guide (setup, component inventory, prop vocabulary, token usage) — this file points Copilot at it rather than duplicating it.\n`,
    detect: () => fs.existsSync(path.join(targetDir, '.github')),
  },
];

// ── Guardrails: JSON files merged into, never replaced ─────────────────────────

const HELIX_DIR = `\${HELIX_DS_DIR:-${repoRoot}}`;
const hookCommand = script => `node "${HELIX_DIR}/scripts/${script}"`;
const HOOKS = [
  { event: 'PreToolUse', matcher: 'Edit|Write|MultiEdit|NotebookEdit|Bash', script: 'claude-owner-gate-hook.mjs', timeout: 10, statusMessage: 'Helix owner gate' },
  { event: 'PreToolUse', matcher: 'Edit|Write|MultiEdit', script: 'claude-contract-hook.mjs', timeout: 30, statusMessage: 'Helix contracts read?' },
  { event: 'PostToolUse', matcher: 'Edit|Write', script: 'claude-lint-hook.mjs', timeout: 60, statusMessage: 'Helix lint' },
];

// The MCP server for agents that don't expand ${VAR:-default} in their config: the shell does it.
const MCP_VIA_SHELL = { command: 'sh', args: ['-c', `pnpm -s --dir "${HELIX_DIR}" helix:mcp`] };

/** Adds `hooks` (Claude-style matcher groups) to `json.hooks` for each event, unless the script is already there. */
function mergeHooks(json, hooks, entryFor) {
  json.hooks ??= {};
  let changed = false;
  for (const hook of hooks) {
    const entries = (json.hooks[hook.event] ??= []);
    // Already installed — whatever path it points at — if any entry runs this script.
    if (entries.some(e => (e.hooks ?? []).some(h => String(h.command ?? '').includes(hook.script)))) continue;
    entries.push(entryFor(hook));
    changed = true;
  }
  return changed;
}

/**
 * A JSON file this script adds entries to. `merge(json)` changes `json` in place and returns
 * 'changed' | 'same' | a conflict message (an entry exists with a value this script won't overwrite).
 */
const GUARDRAILS = agentsOnly ? [] : [
  {
    targetPath: () => path.join(targetDir, '.mcp.json'),
    merge(json) {
      const server = { command: 'pnpm', args: ['-s', '--dir', HELIX_DIR, 'helix:mcp'] };
      json.mcpServers ??= {};
      const existing = json.mcpServers.helix;
      if (!existing) { json.mcpServers.helix = server; return 'changed'; }
      return JSON.stringify(existing) === JSON.stringify(server) ? 'same' : 'a "helix" MCP server already exists with a different command';
    },
  },
  {
    // Cursor reads .cursor/mcp.json — only if the app already has .cursor/ (same rule as the pointer file).
    // Cursor doesn't expand ${VAR:-default}, so the shell does: HELIX_DS_DIR still overrides the clone path.
    targetPath: () => path.join(targetDir, '.cursor', 'mcp.json'),
    detect: () => fs.existsSync(path.join(targetDir, '.cursor')),
    merge(json) {
      const server = { command: 'sh', args: ['-c', `pnpm -s --dir "${HELIX_DIR}" helix:mcp`] };
      json.mcpServers ??= {};
      const existing = json.mcpServers.helix;
      if (!existing) { json.mcpServers.helix = server; return 'changed'; }
      return JSON.stringify(existing) === JSON.stringify(server) ? 'same' : 'a "helix" MCP server already exists with a different command';
    },
  },
  {
    targetPath: () => path.join(targetDir, '.claude', 'settings.json'),
    // Claude Code — and Cursor, which runs these same hooks with its "third-party hooks" setting on.
    merge(json) {
      return mergeHooks(json, HOOKS, hook => ({ matcher: hook.matcher, hooks: [{ type: 'command', command: hookCommand(hook.script), timeout: hook.timeout, statusMessage: hook.statusMessage }] }))
        ? 'changed' : 'same';
    },
  },
  {
    // Codex (ChatGPT's coding agent) reads AGENTS.md itself; .codex/hooks.json has Claude Code's format, with
    // its own tool names (Bash, apply_patch). Project hooks run once the project is trusted in Codex.
    targetPath: () => path.join(targetDir, '.codex', 'hooks.json'),
    detect: () => uses('codex'),
    merge(json) {
      const matchers = { 'claude-owner-gate-hook.mjs': 'Bash|apply_patch', 'claude-contract-hook.mjs': 'apply_patch', 'claude-lint-hook.mjs': 'apply_patch' };
      return mergeHooks(json, HOOKS, hook => ({ matcher: matchers[hook.script], hooks: [{ type: 'command', command: hookCommand(hook.script), timeout: hook.timeout, statusMessage: hook.statusMessage }] }))
        ? 'changed' : 'same';
    },
  },
  {
    // Gemini CLI: the MCP server, the hooks (BeforeTool/AfterTool, timeout in ms) and AGENTS.md as context.
    targetPath: () => path.join(targetDir, '.gemini', 'settings.json'),
    detect: () => uses('gemini'),
    merge(json) {
      let changed = false;
      json.mcpServers ??= {};
      const existing = json.mcpServers.helix;
      if (!existing) { json.mcpServers.helix = MCP_VIA_SHELL; changed = true; }
      else if (JSON.stringify(existing) !== JSON.stringify(MCP_VIA_SHELL)) return 'a "helix" MCP server already exists with a different command';
      const events = { PreToolUse: 'BeforeTool', PostToolUse: 'AfterTool' };
      const matchers = { 'claude-owner-gate-hook.mjs': 'write_file|replace|run_shell_command', 'claude-contract-hook.mjs': 'write_file|replace', 'claude-lint-hook.mjs': 'write_file|replace' };
      const geminiHooks = HOOKS.map(h => ({ ...h, event: events[h.event] }));
      if (mergeHooks(json, geminiHooks, hook => ({ matcher: matchers[hook.script], hooks: [{ type: 'command', name: `helix-${hook.script.replace(/^claude-|-hook\.mjs$/g, '')}`, command: hookCommand(hook.script), timeout: hook.timeout * 1000, description: hook.statusMessage }] }))) changed = true;
      json.context ??= {};
      const names = [json.context.fileName ?? []].flat();
      if (!names.includes('AGENTS.md')) { json.context.fileName = ['AGENTS.md', ...(names.length ? names : ['GEMINI.md'])]; changed = true; }
      return changed ? 'changed' : 'same';
    },
  },
];

function ensureDirFor(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

const report = { created: [], updated: [], upToDate: [], skipped: [], conflicts: [] };

for (const step of PLAN) {
  if (!step.detect()) {
    report.skipped.push(step.targetPath().replace(targetDir + path.sep, ''));
    continue;
  }

  const targetPath = step.targetPath();
  const relPath = path.relative(targetDir, targetPath);
  const newContent = step.content();

  if (!fs.existsSync(targetPath)) {
    report.created.push(relPath);
    if (!dryRun) {
      ensureDirFor(targetPath);
      fs.writeFileSync(targetPath, newContent);
    }
    continue;
  }

  const existing = fs.readFileSync(targetPath, 'utf-8');
  if (existing === newContent) {
    report.upToDate.push(relPath);
    continue;
  }

  // File exists with different content — never overwrite silently. This is what makes
  // the script safe to run on a project with hand-customized AGENTS.md/tool files.
  report.conflicts.push(relPath);
}

for (const step of GUARDRAILS) {
  const targetPath = step.targetPath();
  const relPath = path.relative(targetDir, targetPath);
  if (step.detect && !step.detect()) { report.skipped.push(relPath); continue; }
  const exists = fs.existsSync(targetPath);
  let json = {};
  if (exists) {
    try { json = JSON.parse(fs.readFileSync(targetPath, 'utf-8')); } catch {
      report.conflicts.push(`${relPath} (not valid JSON)`);
      continue;
    }
  }
  const result = step.merge(json);
  if (result === 'same') { report.upToDate.push(relPath); continue; }
  if (result !== 'changed') { report.conflicts.push(`${relPath} (${result})`); continue; }
  (exists ? report.updated : report.created).push(relPath);
  if (!dryRun) {
    ensureDirFor(targetPath);
    fs.writeFileSync(targetPath, JSON.stringify(json, null, 2) + '\n');
  }
}

// Codex's MCP servers live in .codex/config.toml. Without a TOML parser: append the [mcp_servers.helix] table
// when there's none; an existing one that differs is a conflict, like the JSON files.
if (!agentsOnly) {
  const tomlPath = path.join(targetDir, '.codex', 'config.toml');
  const relPath = path.relative(targetDir, tomlPath);
  const table = `[mcp_servers.helix]\ncommand = "sh"\nargs = ${JSON.stringify(MCP_VIA_SHELL.args)}\n`;
  if (!uses('codex')) report.skipped.push(relPath);
  else {
    const existing = fs.existsSync(tomlPath) ? fs.readFileSync(tomlPath, 'utf-8') : null;
    if (existing?.includes(table)) report.upToDate.push(relPath);
    else if (existing && /^\s*\[mcp_servers\.helix\]/m.test(existing)) report.conflicts.push(`${relPath} (an [mcp_servers.helix] table already exists with different settings)`);
    else {
      (existing === null ? report.created : report.updated).push(relPath);
      if (!dryRun) {
        ensureDirFor(tomlPath);
        fs.writeFileSync(tomlPath, existing === null ? table : `${existing.replace(/\n*$/, '\n\n')}${table}`);
      }
    }
  }
}

// ── Report ────────────────────────────────────────────────────────────────────

const prefix = dryRun ? '[dry-run] ' : '';
console.log(`\n${prefix}Helix AI setup — target: ${targetDir}\n`);

if (report.created.length) {
  console.log(`${dryRun ? 'Would create' : 'Created'}:`);
  report.created.forEach(f => console.log(`  + ${f}`));
}
if (report.updated.length) {
  console.log(`${dryRun ? 'Would update' : 'Updated'}:`);
  report.updated.forEach(f => console.log(`  ~ ${f}`));
}
if (report.upToDate.length) {
  console.log(`Already up to date:`);
  report.upToDate.forEach(f => console.log(`  = ${f}`));
}
if (report.skipped.length) {
  console.log(`Skipped (tool not detected in this project):`);
  report.skipped.forEach(f => console.log(`  - ${f}`));
}
if (report.conflicts.length) {
  console.log(`\n⚠️  Needs manual review — exists with different content than the approved template:`);
  report.conflicts.forEach(f => console.log(`  ! ${f}`));
  console.log('  Not overwritten. Diff by hand and merge what you want to keep.');
}

if (GUARDRAILS.length) {
  console.log(`\nGuardrails point at this Helix clone (${repoRoot}).`);
  console.log('Teammates with their clone elsewhere: export HELIX_DS_DIR=/path/to/helixds. Restart the agent to load them.');
  if (fs.existsSync(path.join(targetDir, '.cursor'))) console.log('Cursor: turn on Settings → "Include Third-Party Plugins, Skills, and Other Configs" so it runs the hooks in .claude/settings.json.');
  if (uses('codex')) console.log('Codex: trust this project when Codex asks, or its project hooks and MCP config stay off.');
  console.log('Other agents: install for them with --with codex,gemini (or --with all) before their folder exists.');
}

process.exit(report.conflicts.length > 0 ? 1 : 0);
