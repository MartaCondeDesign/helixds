/**
 * Validates the .ai/ directory structure integrity.
 * Checks: skills have SPORT sections, agents have frontmatter, memory files are non-empty.
 * Run: pnpm lint:ai
 */
import fs from 'fs';
import path from 'path';

const root  = path.resolve(import.meta.dirname, '..');
const aiDir = path.join(root, '.ai');

type Issue = { path: string; message: string; severity: 'error' | 'warn' };
const issues: Issue[] = [];

// ── Skills: require SPORT sections ───────────────────────────────────────────

const skillsDir = path.join(aiDir, 'skills');
for (const f of fs.readdirSync(skillsDir).filter(f => f.endsWith('.md'))) {
  const content = fs.readFileSync(path.join(skillsDir, f), 'utf-8');
  const required = ['## Scope', '## Process', '## Output', '## Regression checklist'];
  for (const section of required) {
    if (!content.includes(section)) {
      issues.push({
        path: `.ai/skills/${f}`,
        message: `Missing SPORT section: ${section}`,
        severity: 'error',
      });
    }
  }
}

// ── Agents: require YAML frontmatter with name + tools ───────────────────────

const agentsDir = path.join(aiDir, 'agents');
for (const f of fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))) {
  const content = fs.readFileSync(path.join(agentsDir, f), 'utf-8');
  if (!content.startsWith('---')) {
    issues.push({ path: `.ai/agents/${f}`, message: 'Missing YAML frontmatter (---)', severity: 'error' });
    continue;
  }
  for (const field of ['name:', 'tools:']) {
    if (!content.includes(field)) {
      issues.push({ path: `.ai/agents/${f}`, message: `Missing frontmatter field: ${field}`, severity: 'error' });
    }
  }
}

// ── Memory: must be non-empty ─────────────────────────────────────────────────

const memoryDir = path.join(aiDir, 'memory');
for (const f of fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'))) {
  const stat = fs.statSync(path.join(memoryDir, f));
  if (stat.size < 50) {
    issues.push({ path: `.ai/memory/${f}`, message: 'Memory file appears empty or placeholder (<50 bytes)', severity: 'warn' });
  }
}

// ── config.json: must be valid JSON ──────────────────────────────────────────

try {
  JSON.parse(fs.readFileSync(path.join(aiDir, 'config.json'), 'utf-8'));
} catch {
  issues.push({ path: '.ai/config.json', message: 'Invalid JSON', severity: 'error' });
}

// ── Report ────────────────────────────────────────────────────────────────────

if (issues.length === 0) {
  console.log('✅ lint:ai — .ai/ directory is valid');
  process.exit(0);
}

console.log('\n🤖 lint:ai results\n');
for (const issue of issues) {
  const icon = issue.severity === 'error' ? '❌' : '⚠️';
  console.log(`${icon} ${issue.path}: ${issue.message}`);
}

const errors = issues.filter(i => i.severity === 'error');
console.log(`\n${errors.length} error(s), ${issues.length - errors.length} warning(s)`);
process.exit(errors.length > 0 ? 1 : 0);
