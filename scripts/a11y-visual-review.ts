/**
 * AI visual accessibility review — the questions axe and the browser checks can't decide, because they need
 * someone to LOOK at the component. For each story of a component it takes screenshots (light, dark, and light
 * with keyboard focus on the first control) plus what a screen reader gets (ariaSnapshot), and asks Claude
 * (haiku by default, headless `claude -p`, Read tool only) five questions:
 *
 *   color-only     WCAG 1.4.1  — is any state or meaning shown by color alone (error, selected, status)?
 *   non-text       WCAG 1.4.11 — are control edges, icons and focus rings distinguishable from what's around
 *                                them (3:1 by eye)? axe only measures TEXT contrast
 *   label-in-name  WCAG 2.5.3  — does each control's visible text appear in the name the screen reader reads?
 *   clipped        WCAG 1.4.4/1.4.12 — is any text cut off, overlapping or truncated without a way to read it?
 *   focus-clear    WCAG 2.4.11/2.4.13 — with keyboard focus, is it obvious WHICH control has it?
 *
 * Advisory, not a gate: a model can be wrong, so findings go to .ai/a11y-visual/<Name>.json for a person to
 * confirm (and record with `pnpm a11y:review`) — they never change a component's status. Needs Storybook running.
 *
 * Run: pnpm a11y:visual <Name>[,<Name>…] | --all  [--url http://localhost:6006] [--model haiku] [--max-stories 3]
 * Cost: one call per component, a few cents with haiku.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const opt = (name: string) => { const i = args.indexOf(name); return i === -1 ? undefined : args[i + 1]; };
const sbUrl = opt('--url') ?? 'http://localhost:6006';
const model = opt('--model') ?? 'haiku';
const maxStories = Number(opt('--max-stories') ?? 3);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'contracts/manifest.json'), 'utf8'));
const all: { name: string; category: string }[] = manifest.components;
const flagValues = new Set(['--url', '--model', '--max-stories'].map(opt).filter(Boolean));
const positional = args.find(a => !a.startsWith('--') && !flagValues.has(a)) ?? '';
const wanted = args.includes('--all') ? all.map(c => c.name) : positional.split(',').filter(Boolean);
if (!wanted.length) {
  console.error('Usage: pnpm a11y:visual <Name>[,<Name>…] | --all');
  process.exit(1);
}

const QUESTIONS = {
  'color-only': 'WCAG 1.4.1 — Is any state or meaning (error, selected, current, status, required) shown by color ALONE, with no text, icon, shape or pattern that also shows it?',
  'non-text': 'WCAG 1.4.11 — Are control boundaries (field borders, checkbox/switch outlines), meaningful icons and focus rings clearly distinguishable from the background next to them (roughly 3:1)? Judge light and dark.',
  'label-in-name': 'WCAG 2.5.3 — For every control, does the text you SEE on it appear (same words) in the name the screen reader announces (the ariaSnapshot)?',
  'clipped': 'WCAG 1.4.4 / 1.4.12 — Is any text cut off, overlapping other content, or truncated with no way to read the rest?',
  'focus-clear': 'WCAG 2.4.11 / 2.4.13 — In the "focused" screenshots, is it obvious at a glance WHICH control has keyboard focus (indicator big and contrasting enough)?',
} as const;
type QuestionId = keyof typeof QUESTIONS;

const SYSTEM = [
  'You are an accessibility reviewer for a design system. You get screenshots of one component\'s Storybook stories',
  'and, per story, the accessibility tree a screen reader reads. Open every screenshot with the Read tool before answering.',
  'Answer each question for the component as a whole: pass=true when nothing fails it, pass=false when at least one',
  'story fails it. Name the story and the element in "reason". Only report what you can see; when the screenshots',
  'can\'t show it, pass=true and say so. Disabled controls are exempt from 1.4.11 and never take focus — never report them.',
  'A border that changes color on focus is not "color only" (1.4.1 is about meaning: errors, selection, status).',
  'focus-clear only applies to stories that have a "focused" screenshot; the text says which element has focus. Be concise.',
].join(' ');
const SCHEMA = {
  type: 'object', required: ['answers'],
  properties: { answers: { type: 'array', items: {
    type: 'object', required: ['id', 'pass', 'reason'],
    properties: { id: { type: 'string', enum: Object.keys(QUESTIONS) }, pass: { type: 'boolean' }, reason: { type: 'string' } },
  } } },
};

async function main() {
  const index = await fetch(`${sbUrl}/index.json`).then(r => r.json()).catch(() => null);
  if (!index) {
    console.error(`Storybook isn't running at ${sbUrl} — start it first (pnpm --dir apps/storybook storybook).`);
    process.exit(1);
  }
  const outDir = path.join(root, '.ai/a11y-visual');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });

  for (const name of wanted) {
    const c = all.find(x => x.name === name);
    if (!c) { console.log(`✗ ${name}: not in contracts/manifest.json`); continue; }
    const title = `${c.category === 'layout' ? 'Layout' : 'Components'}/${name}`;
    const stories = Object.values<any>(index.entries).filter(e => e.type === 'story' && e.title === title).slice(0, maxStories);
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-a11y-visual-'));
    const sections: string[] = [];

    for (const s of stories) {
      await page.goto(`${sbUrl}/iframe.html?id=${s.id}&viewMode=story`);
      await page.waitForSelector('#storybook-root > *', { timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(800); // play test + enter transitions
      const aria = await page.locator('body').ariaSnapshot().catch(() => '');
      // Cropped to what the story renders (overlays included), padded so focus rings and shadows fit: fewer
      // pixels, fewer tokens.
      const clip = await page.evaluate(() => {
        const boxes = [...document.querySelectorAll('#storybook-root > *, body > [data-helix-part], dialog[open]')]
          .map(e => e.getBoundingClientRect()).filter(r => r.width && r.height);
        if (!boxes.length) return undefined;
        const x = Math.max(0, Math.min(...boxes.map(b => b.left)) - 12), y = Math.max(0, Math.min(...boxes.map(b => b.top)) - 12);
        const right = Math.min(innerWidth, Math.max(...boxes.map(b => b.right)) + 12), bottom = Math.min(innerHeight, Math.max(...boxes.map(b => b.bottom)) + 12);
        return { x, y, width: right - x, height: bottom - y };
      });
      const shots: string[] = [];
      for (const theme of ['light', 'dark'] as const) {
        await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
        await page.waitForTimeout(300);
        const file = `${s.id}-${theme}.png`;
        await page.screenshot({ path: path.join(work, file), clip, animations: 'disabled' });
        shots.push(`${file} (${theme})`);
      }
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
      await page.mouse.move(0, 0);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(250);
      const focusedEl = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        return `<${el.tagName.toLowerCase()}${el.getAttribute('role') ? ` role="${el.getAttribute('role')}"` : ''}> "${(el.getAttribute('aria-label') || el.innerText || '').trim().slice(0, 40)}"`;
      });
      if (focusedEl) {
        const focused = `${s.id}-focused.png`;
        await page.screenshot({ path: path.join(work, focused), clip, animations: 'disabled' });
        shots.push(`${focused} (light, keyboard focus on ${focusedEl})`);
      } else shots.push('(no focused screenshot: nothing in this story takes keyboard focus)');
      sections.push(`## Story "${s.name}"\nScreenshots: ${shots.join(', ')}\nScreen reader gets:\n${aria || '(nothing)'}`);
    }

    const user = [
      `# Component: ${name}`,
      `# Questions\n${Object.entries(QUESTIONS).map(([id, q]) => `- ${id}: ${q}`).join('\n')}`,
      ...sections,
    ].join('\n\n');
    try {
      const raw = await new Promise<string>((resolve, reject) => {
        const child = spawn('claude', ['-p', '--output-format', 'json', '--model', model, '--tools', 'Read', '--allowedTools', 'Read',
          '--strict-mcp-config', '--no-session-persistence', '--system-prompt', SYSTEM, '--json-schema', JSON.stringify(SCHEMA)],
          { cwd: work, stdio: ['pipe', 'pipe', 'pipe'] });
        let out = '', err = '';
        child.stdout.on('data', d => (out += d));
        child.stderr.on('data', d => (err += d));
        child.on('close', code => (code === 0 ? resolve(out) : reject(new Error(`claude exited ${code}: ${err.slice(0, 300)}`))));
        child.stdin.end(user);
      });
      const envelope = JSON.parse(raw);
      const structured = envelope.structured_output ?? JSON.parse(String(envelope.result).match(/\{[\s\S]*\}/)?.[0] ?? '{}');
      const byId = new Map<string, { pass: boolean; reason: string }>((structured.answers ?? []).map((a: any) => [a.id, a]));
      // A question the model skipped is reported as unanswered — never as a pass.
      const answers = (Object.keys(QUESTIONS) as QuestionId[]).map(id => ({ id, wcag: QUESTIONS[id].split(' — ')[0], ...(byId.get(id) ?? { pass: null, reason: 'No answer returned.' }) }));
      fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify({
        $comment: 'AI visual review (pnpm a11y:visual) — advisory: a person confirms findings and records the review with pnpm a11y:review.',
        component: name, reviewedAt: new Date().toISOString(), model, stories: stories.map(s => s.name),
        costUsd: envelope.total_cost_usd ?? null, answers,
      }, null, 2) + '\n');
      const fails = answers.filter(a => a.pass === false);
      console.log(`${fails.length ? '⚠' : '✓'} ${name} — ${stories.length} stories, ${fails.length} finding(s)${envelope.total_cost_usd ? ` · $${envelope.total_cost_usd.toFixed(3)}` : ''}`);
      for (const f of fails) console.log(`   ${f.id} (${f.wcag}): ${f.reason}`);
    } catch (e) {
      console.log(`✗ ${name}: ${(e as Error).message}`);
    } finally {
      fs.rmSync(work, { recursive: true, force: true });
    }
  }
  await browser.close();
}

main();
