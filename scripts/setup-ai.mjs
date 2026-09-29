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
 * Run: node scripts/setup-ai.mjs [target-dir] [--dry-run]
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
const targetDir = path.resolve(args.find(a => !a.startsWith('--')) ?? process.cwd());

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

process.exit(report.conflicts.length > 0 ? 1 : 0);
