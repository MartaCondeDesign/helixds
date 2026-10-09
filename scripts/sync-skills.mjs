/**
 * Publishes .ai/skills/*.md in the Agent Skills layout every tool looks for — the contributor-side
 * sync ADR-003 left open.
 *
 * .ai/skills/<name>.md stays the ONE source (CLAUDE.md, contracts and scripts link to those paths).
 * Tools that support skills want a folder per skill with a SKILL.md inside, so this builds:
 *
 *   .agents/skills/<name>/SKILL.md  → symlink to ../../../.ai/skills/<name>.md   (the shared layout)
 *   .claude/skills                  → symlink to ../.agents/skills                (Claude Code)
 *   .gemini/skills                  → symlink to ../.agents/skills                (Gemini CLI)
 *   .github/skills                  → symlink to ../.agents/skills                (GitHub Copilot)
 *
 * Idempotent: adds links for new skills, drops folders whose source is gone, prints what it changed.
 * Runs in .husky/pre-commit, so a new .ai/skills/*.md is published in the same commit that adds it.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, '.ai/skills');
const shared = path.join(root, '.agents/skills');
const toolDirs = ['.claude', '.gemini', '.github'];
const changes = [];

function ensureSymlink(linkPath, target) {
  const current = fs.lstatSync(linkPath, { throwIfNoEntry: false });
  if (current?.isSymbolicLink() && fs.readlinkSync(linkPath) === target) return;
  if (current) fs.rmSync(linkPath, { recursive: true });
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(target, linkPath);
  changes.push(path.relative(root, linkPath) + ' → ' + target);
}

const names = fs.readdirSync(source).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3));
for (const name of names) {
  ensureSymlink(path.join(shared, name, 'SKILL.md'), `../../../.ai/skills/${name}.md`);
}
for (const dir of fs.readdirSync(shared)) {
  if (!names.includes(dir)) {
    fs.rmSync(path.join(shared, dir), { recursive: true });
    changes.push(`removed .agents/skills/${dir} (no .ai/skills/${dir}.md)`);
  }
}
for (const tool of toolDirs) ensureSymlink(path.join(root, tool, 'skills'), '../.agents/skills');

console.log(changes.length
  ? `✅ sync-skills — ${names.length} skills; updated:\n   ${changes.join('\n   ')}`
  : `✅ sync-skills — ${names.length} skills already published`);
