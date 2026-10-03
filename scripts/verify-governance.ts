/**
 * Audits component contracts (contracts/components/*.json) for agent decision legibility & governance completeness.
 * Checks presence of rationale, neverUseFor anti-patterns, and governance boundaries.
 * Run: node --experimental-strip-types scripts/verify-governance.ts
 */
import { governanceCoverage } from './quality-lib.ts';

const { total, contracts: reports } = governanceCoverage();

const withRationale = reports.filter(r => r.hasRationale);
const withNeverUseFor = reports.filter(r => r.hasNeverUseFor);
const withGovernance = reports.filter(r => r.hasGovernance);

console.log(`\n📋 Governance & Legibility Audit — ${total} contracts\n`);
console.log(`  ✓ Anti-patterns (neverUseFor): ${withNeverUseFor.length}/${total}`);
console.log(`  ✓ Rationale (rationale):         ${withRationale.length}/${total}`);
console.log(`  ✓ Governance boundaries:        ${withGovernance.length}/${total}\n`);

for (const r of reports) {
  const flags = [
    r.hasNeverUseFor ? 'neverUseFor ✓' : 'neverUseFor ✗',
    r.hasRationale ? 'rationale ✓' : 'rationale ✗',
    r.hasGovernance ? 'governance ✓' : 'governance ✗',
  ].join(' | ');

  console.log(` - ${r.name.padEnd(20)} (${r.status.padEnd(6)}) → ${flags}`);
}

console.log('\nAudit complete.');
