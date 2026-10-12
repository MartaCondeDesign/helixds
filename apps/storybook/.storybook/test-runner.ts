import fs from 'fs';
import path from 'path';
import type { TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, getViolations } from 'axe-playwright';
import { checkFocusVisible, checkReflow, checkTargetSize, collectAria, collectContrast, collectTargets } from './a11y-extra-checks';

// Stability criteria 4 (a11y) and 6 (contrast, light + dark) — see docs/ADR/ADR-018-stability-criteria.md.
// Beyond axe, criterion 4 also gets three checks axe can't do (a11y-extra-checks.ts): target size
// (WCAG 2.5.8), visible focus per theme (2.4.7) and reflow at 320 px (1.4.10), plus the story's ARIA
// snapshot — what a screen reader would announce — compared with the contract's role.
// Each story's play function (criterion 5, keyboard tests) is run by the test-runner itself before
// postVisit; this hook then runs axe once per theme and writes one JSON file per story, which
// `pnpm verify:stable` aggregates per component. Results are written, never thrown, so one story's
// violations don't hide the rest of the report. The folder is cleared by verify:stable before a run,
// not here — setup() runs once per parallel worker, so clearing here wiped other workers' results.
const RESULTS_DIR = path.resolve(__dirname, '../.test-results/a11y');
const THEMES = ['light', 'dark'] as const;
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },

  async postVisit(page, context) {
    // What a screen reader gets: the accessibility tree of the story, in the state its play test left it
    // (Playwright ariaSnapshot — roles, names, states). verify:stable compares it with the contract's a11y.role.
    const aria = await page.locator('body').ariaSnapshot().catch(() => '');
    const byTheme: Record<string, { rule: string; impact: string | null | undefined; nodes: number; help: string }[]> = {};
    const focusVisible: Record<string, Awaited<ReturnType<typeof checkFocusVisible>>> = {};
    // The layer the component APPLIES, recorded for its contract (a11y.applied, written by pnpm a11y).
    const applied = { aria: await collectAria(page), contrast: {} as Record<string, Awaited<ReturnType<typeof collectContrast>>>, targets: await collectTargets(page) };

    for (const theme of THEMES) {
      await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      // Let transitions on theme-driven colors settle before measuring contrast.
      await page.waitForTimeout(350);
      const violations = await getViolations(page, 'body', { // body: portaled overlays (Menu, Toast) live outside #storybook-root
        runOnly: { type: 'tag', values: AXE_TAGS },
      });
      byTheme[theme] = violations.map(v => ({ rule: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));
      applied.contrast[theme] = await collectContrast(page);
      focusVisible[theme] = await checkFocusVisible(page);
    }
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    const targetSize = await checkTargetSize(page);
    // Reflow is a page-level criterion: run it on layout components and page stories, where the layout is
    // the component's own. A component story's demo wrapper (a fixed 340px box, every size in one row)
    // would fail it for reasons that aren't the component's.
    const reflow = /^(Layout|Pages)\//.test(context.title) ? await checkReflow(page) : [];

    fs.mkdirSync(RESULTS_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(RESULTS_DIR, `${context.id}.json`),
      JSON.stringify({ id: context.id, title: context.title, name: context.name, violations: byTheme, focusVisible, targetSize, reflow, aria, applied }, null, 2),
    );
  },
};

export default config;
