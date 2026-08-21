/**
 * Validates component contracts (contracts/components/*.json) against the schema.
 * Reports violations — does NOT gate yet. Run: pnpm verify:contract
 *
 * To promote to gate: change REPORT_ONLY to false.
 */
import fs from 'fs';
import path from 'path';

const REPORT_ONLY = true; // flip to false when violations list is clean

const contractsDir = path.resolve(import.meta.dirname, '../contracts/components');
const schemaPath   = path.resolve(import.meta.dirname, '../contracts/component.schema.json');
const schema       = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

const REQUIRED_FIELDS = schema.required as string[];

type Issue = { file: string; field?: string; message: string; severity: 'error' | 'warn' };
const issues: Issue[] = [];

const files = fs.readdirSync(contractsDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const fullPath = path.join(contractsDir, file);
  const contract = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

  // 1. Required fields present
  for (const field of REQUIRED_FIELDS) {
    if (!(field in contract)) {
      issues.push({ file, field, message: `Missing required field: ${field}`, severity: 'error' });
    }
  }

  // 2. Status must be one of the enum values
  if (contract.status && !['draft', 'beta', 'stable', 'deprecated'].includes(contract.status)) {
    issues.push({ file, field: 'status', message: `Invalid status: ${contract.status}`, severity: 'error' });
  }

  // 3. Props must use canonical names from prop-map
  const propMapPath = path.resolve(import.meta.dirname, '../.ai/maps/prop-map.md');
  const propMapText = fs.readFileSync(propMapPath, 'utf-8');
  const antiSynonyms = extractAntiSynonyms(propMapText);

  if (Array.isArray(contract.props)) {
    const propNames = new Set((contract.props as { name: string }[]).map(p => p.name));
    for (const prop of contract.props as { name: string }[]) {
      if (antiSynonyms.has(prop.name)) {
        const canonical = antiSynonyms.get(prop.name);
        // 'name' is a legitimate native HTML form attribute (distinct from visible label
        // text) whenever the contract already has its own real 'label' prop — don't flag
        // that as the "name is an anti-synonym for label" false positive.
        if (prop.name === 'name' && canonical === 'label' && propNames.has('label')) continue;

        issues.push({
          file,
          field: `props.${prop.name}`,
          message: `Prop '${prop.name}' is an anti-synonym. Use '${canonical}' instead.`,
          severity: 'error',
        });
      }
    }
  }

  // 4. Anatomy parts must have data-helix-part values (kebab-case)
  if (Array.isArray(contract.anatomy)) {
    for (const part of contract.anatomy as { part: string }[]) {
      if (!/^[a-z][a-z0-9-]*$/.test(part.part)) {
        issues.push({
          file,
          field: `anatomy.${part.part}`,
          message: `Anatomy part '${part.part}' must be kebab-case.`,
          severity: 'warn',
        });
      }
    }
  }

  // 5. tokenPolicy.forbidden must not appear in tokenPolicy.allowed
  const policy = contract.tokenPolicy as { allowed?: string[]; forbidden?: string[] } | undefined;
  if (policy?.allowed && policy?.forbidden) {
    for (const token of policy.forbidden) {
      if (policy.allowed.includes(token)) {
        issues.push({
          file,
          field: 'tokenPolicy',
          message: `Token '${token}' appears in both allowed and forbidden.`,
          severity: 'error',
        });
      }
    }
  }
}

function extractAntiSynonyms(mapText: string): Map<string, string> {
  const result = new Map<string, string>();
  const rows = mapText.match(/\|[^|]+\|[^|]+\|[^|]+\|/g) ?? [];
  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 2 && cells[0]?.startsWith('`') && cells[1]?.startsWith('`')) {
      const canonical  = cells[0]?.replace(/`/g, '');
      const antiStr    = cells[1]?.replace(/`/g, '') ?? '';
      for (const anti of antiStr.split(',').map(s => s.trim())) {
        if (anti && canonical) result.set(anti, canonical);
      }
    }
  }
  return result;
}

// ── Report ────────────────────────────────────────────────────────────────────

const errors = issues.filter(i => i.severity === 'error');
const warns  = issues.filter(i => i.severity === 'warn');

if (issues.length === 0) {
  console.log(`✅ verify:contract — ${files.length} contracts valid, 0 issues`);
  process.exit(0);
}

console.log(`\n📋 Contract verification — ${files.length} contracts\n`);

for (const issue of issues) {
  const icon = issue.severity === 'error' ? '❌' : '⚠️';
  console.log(`${icon} ${issue.file}${issue.field ? ` › ${issue.field}` : ''}`);
  console.log(`   ${issue.message}\n`);
}

console.log(`Summary: ${errors.length} errors, ${warns.length} warnings`);

if (REPORT_ONLY) {
  console.log('\n(report-only mode — not blocking CI)');
  process.exit(0);
} else {
  process.exit(errors.length > 0 ? 1 : 0);
}
