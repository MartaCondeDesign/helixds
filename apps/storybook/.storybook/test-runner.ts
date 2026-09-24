import fs from 'fs';
import path from 'path';
import type { TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, getViolations } from 'axe-playwright';

// Stability criteria 4 (a11y) and 6 (contrast, light + dark) — see docs/ADR/ADR-018-stability-criteria.md.
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
    const byTheme: Record<string, { rule: string; impact: string | null | undefined; nodes: number; help: string }[]> = {};

    for (const theme of THEMES) {
      await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      // Let transitions on theme-driven colors settle before measuring contrast.
      await page.waitForTimeout(350);
      const violations = await getViolations(page, '#storybook-root', {
        runOnly: { type: 'tag', values: AXE_TAGS },
      });
      byTheme[theme] = violations.map(v => ({ rule: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));
    }

    fs.mkdirSync(RESULTS_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(RESULTS_DIR, `${context.id}.json`),
      JSON.stringify({ id: context.id, title: context.title, name: context.name, violations: byTheme }, null, 2),
    );
  },
};

export default config;
