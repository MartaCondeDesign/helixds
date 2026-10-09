/**
 * Tests the eval graders themselves: does every check catch the mistake it exists for, and stay quiet
 * on a correct answer? No agent, no tokens — it only grades code we wrote on purpose.
 *
 * Each case takes a prompt's reference answer (its "Expected output shape", which must pass everything)
 * and plants ONE known mistake — the kind agents really make (evals/bench/ has real examples). The case
 * says which graders must flag it:
 *
 *   checklist   the prompt's own success criteria / invalid patterns (eval-lib.ts scorePrompt)
 *   compile     tsc against Helix's real types (eval-mechanical.ts)
 *   lint:<rule> an @helixds/eslint-plugin rule (eval-mechanical.ts)
 *
 * A grader that misses a planted mistake, or flags a reference answer, fails the run — so a number on
 * Metrics is only as trustworthy as this table. Run: pnpm eval:calibrate
 */
import { loadPrompts, scorePrompt } from './eval-lib.ts';
import { checkMechanical } from './eval-mechanical.ts';

type Grader = 'checklist' | 'compile' | `lint:${string}`;
interface Case { prompt: string; mistake: string; find: string; replace: string; caughtBy: Grader[] }

const CASES: Case[] = [
  { prompt: 'screen-team-members', mistake: 'Button text as a `label` prop', caughtBy: ['compile', 'lint:helix/unknown-prop'],
    find: '<Button variant="primary" onClick={onInvite}>Invite member</Button>', replace: '<Button variant="primary" onClick={onInvite} label="Invite member" />' },
  { prompt: 'screen-team-members', mistake: 'PageHeader `title` instead of `label`', caughtBy: ['checklist', 'compile'],
    find: '<PageHeader label="Team"', replace: '<PageHeader title="Team"' },
  { prompt: 'screen-team-members', mistake: 'Raw `padding: \'16px\'` instead of a spacing token', caughtBy: ['lint:helix/no-raw-spacing'],
    find: '<Table>', replace: "<Table className=\"members\">{null}</Table>\n      <section style={{ padding: '16px' }} />\n      <Table>" },
  { prompt: 'screen-team-members', mistake: 'Imports a component Helix doesn\'t have', caughtBy: ['compile'],
    find: 'import { Button, PageHeader,', replace: 'import { Button, EmptyState, PageHeader,' },
  { prompt: 'screen-signup-errors', mistake: 'Input without its required `label`', caughtBy: ['compile'],
    find: '<Input label="Password" ', replace: '<Input ' },
  { prompt: 'screen-signup-errors', mistake: 'Select fed `<option>` children instead of `options`', caughtBy: ['checklist', 'compile'],
    find: '<Select label="Country" options={COUNTRIES} value={country} onChange={setCountry} placeholder="Choose a country"\n        invalid={submitted && !!countryError} errorMessage={submitted ? countryError : undefined} />',
    replace: '<Select label="Country" value={country} onChange={setCountry}>\n        <option value="es">Spain</option>\n      </Select>' },
  { prompt: 'screen-signup-errors', mistake: '`error` instead of `errorMessage`', caughtBy: ['checklist', 'compile'],
    find: 'invalid={submitted && !!emailError} errorMessage={submitted ? emailError : undefined}', replace: 'invalid={submitted && !!emailError} error={submitted ? emailError : undefined}' },
  { prompt: 'screen-notification-settings', mistake: '`isChecked` instead of `checked`', caughtBy: ['checklist', 'compile'],
    find: 'checked={channels.sms}', replace: 'isChecked={channels.sms}' },
  { prompt: 'screen-save-feedback', mistake: '`loading` instead of `isLoading`', caughtBy: ['checklist', 'compile', 'lint:helix/prop-vocabulary'],
    find: 'isLoading={saving}', replace: 'loading={saving}' },
  { prompt: 'screen-save-feedback', mistake: 'Forgets to mount `<Toast />` (compiles, shows nothing)', caughtBy: ['checklist'],
    find: '      <Toast />\n', replace: '' },
  { prompt: 'screen-delete-account', mistake: '`onClose` instead of `onDismiss` on Modal', caughtBy: ['checklist', 'compile'],
    find: 'onDismiss={() => setConfirming(false)}', replace: 'onClose={() => setConfirming(false)}' },
  { prompt: 'screen-delete-account', mistake: 'Browser `window.confirm` instead of a dialog', caughtBy: ['checklist'],
    find: 'onClick={() => setConfirming(true)}', replace: "onClick={() => { if (window.confirm('Sure?')) onDelete(); }}" },
  { prompt: 'screen-delete-account', mistake: 'Raw hex color', caughtBy: ['lint:helix/no-raw-color'],
    find: '<Button variant="danger"', replace: "<section style={{ color: '#dc2626' }} />\n      <Button variant=\"danger\"" },
];

async function grade(promptId: string, code: string) {
  const prompt = loadPrompts(promptId)[0]!;
  const mechanical = await checkMechanical(code);
  const flagged = new Set<Grader>();
  if (!scorePrompt(prompt, code).passed) flagged.add('checklist');
  if (!mechanical.compiles) flagged.add('compile');
  for (const p of mechanical.lintProblems) flagged.add(`lint:${p.rule}`);
  return { flagged, mechanical };
}

async function main() {
  let failures = 0;
  const prompts = new Set(CASES.map(c => c.prompt));

  console.log('\nReference answers — must pass every grader (no false alarms)\n');
  for (const id of prompts) {
    const { flagged, mechanical } = await grade(id, loadPrompts(id)[0]!.expectedOutput);
    const ok = flagged.size === 0;
    if (!ok) failures++;
    console.log(`${ok ? '✅' : '❌'} ${id}${ok ? '' : ` — wrongly flagged by ${[...flagged].join(', ')} ${mechanical.compileErrors[0] ?? ''}`}`);
  }

  console.log('\nPlanted mistakes — each must be caught by the graders it names\n');
  for (const c of CASES) {
    const reference = loadPrompts(c.prompt)[0]!.expectedOutput;
    if (!reference.includes(c.find)) {
      failures++;
      console.log(`❌ ${c.prompt}: "${c.mistake}" — the case no longer applies (reference answer changed); update it`);
      continue;
    }
    const { flagged } = await grade(c.prompt, reference.replace(c.find, c.replace));
    const missed = c.caughtBy.filter(g => !flagged.has(g));
    if (missed.length) failures++;
    const caught = c.caughtBy.filter(g => flagged.has(g));
    console.log(`${missed.length ? '❌' : '✅'} ${c.mistake.replace(/`/g, '')}  →  caught by ${caught.join(', ') || 'nothing'}${missed.length ? `  · MISSED by ${missed.join(', ')}` : ''}`);
  }

  console.log(`\n${failures === 0 ? '✅ Every grader caught what it should and nothing it shouldn\'t.' : `❌ ${failures} problem(s): a grader can't be trusted for that case.`}`);
  if (failures) process.exit(1);
}

main();
