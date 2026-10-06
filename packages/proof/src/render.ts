// Renders every buildable answer for real and screenshots it: a throwaway Vite app inside `config.app`
// (so imports resolve like in a consumer), one page per answer, headless Chromium.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { chromium, type Browser } from 'playwright';
import { createServer, mergeConfig, type InlineConfig } from 'vite';
import { importFromApp, type ResolvedConfig } from './config.ts';
import type { Cell } from './cells.ts';

const RENDER_DIR = '.proof';
const AXE_SCRIPT = createRequire(import.meta.url).resolve('axe-core/axe.min.js');
// WCAG 2.2 A/AA on the component itself. Page-level rules are off: an answer is a component, not a page,
// so "no <main> landmark" or "no <h1>" would flag every single one.
const AXE_OPTIONS = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
  rules: { region: { enabled: false }, 'landmark-one-main': { enabled: false }, 'page-has-heading-one': { enabled: false }, bypass: { enabled: false } },
};

function harness(config: ResolvedConfig) {
  const cssImports = (config.css ?? []).map(spec => `import ${JSON.stringify(spec)};`).join('\n');
  return `${cssImports}
import { Component, createElement } from 'react';
import { createRoot } from 'react-dom/client';

const cells = import.meta.glob('./cells/*.tsx');
const id = new URLSearchParams(location.search).get('cell');
const done = (status) => { window.__cellStatus = status; };

// A component that declares props and crashes when rendered without them was written to receive data
// from a parent — not the agent's mistake, so it's reported apart from a real crash.
let takesProps = false;
const failed = (message) => done((takesProps ? 'Needs props: rendered without the data its parent would pass — ' : 'Render failed: ') + message);

class Boundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { failed(error?.message ?? error); }
  render() { return this.state.error ? null : this.props.children; }
}

window.addEventListener('error', e => failed(e.message));
cells['./cells/' + id + '.tsx']().then(mod => {
  const Comp = mod.default ?? Object.entries(mod).find(([n, v]) => /^[A-Z]/.test(n) && typeof v === 'function')?.[1];
  if (!Comp) return done('No component exported');
  takesProps = Comp.length > 0;
  createRoot(document.getElementById('root')).render(createElement(Boundary, null, createElement(Comp)));
  setTimeout(() => window.__cellStatus ?? done('ok'), 400);
}, error => done('Build failed: ' + (error?.message ?? error)));
`;
}

function writeWorkspace(config: ResolvedConfig, cells: Cell[]) {
  const dir = path.join(config.appDir, RENDER_DIR);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(path.join(dir, 'cells'), { recursive: true });
  const attrs = Object.entries(config.htmlAttributes ?? {}).map(([k, v]) => ` ${k}="${v}"`).join('');
  writeFileSync(path.join(dir, 'index.html'),
    `<!doctype html><html lang="en"${attrs}><head><meta charset="utf-8"><title>Proof cell</title></head><body><div id="root"></div><script type="module" src="./main.tsx"></script></body></html>`);
  writeFileSync(path.join(dir, 'main.tsx'), `// @ts-nocheck\n${harness(config)}`);
  for (const cell of cells) if (!cell.buildError) writeFileSync(path.join(dir, 'cells', `${cell.id}.tsx`), cell.code);
  return dir;
}

async function launch(): Promise<Browser> {
  try { return await chromium.launch(); }
  catch { return chromium.launch({ channel: 'chrome' }); } // fall back to an installed Google Chrome
}

export async function renderCells(config: ResolvedConfig, cells: Cell[], log: (msg: string) => void) {
  const buildable = cells.filter(c => !c.buildError);
  if (!buildable.length) return;
  const dir = writeWorkspace(config, buildable);
  const base: InlineConfig = {
    root: dir,
    configFile: false,
    logLevel: 'silent',
    esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
    server: { port: 0, strictPort: false, hmr: false, fs: { strict: false } },
    // Scan every answer up front, so dependency optimization never reloads a page mid-capture.
    optimizeDeps: { entries: ['main.tsx', 'cells/*.tsx'] },
  };
  const extra = config.vite ? await config.vite({ importFromApp: importFromApp(config.appDir) }) : {};
  const server = await createServer(mergeConfig(base, extra));
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  const browser = await launch();
  const viewport = config.viewport ?? { width: 800, height: 520 };
  try {
    const capture = async (cell: Cell) => {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
      try {
        await page.goto(`${url}?cell=${cell.id}`, { waitUntil: 'load', timeout: 60_000 });
        await page.waitForFunction(() => (window as any).__cellStatus, null, { timeout: 30_000 });
        const status = await page.evaluate(() => (window as any).__cellStatus as string);
        cell.renderError = status === 'ok' ? null : status;
        await page.waitForTimeout(250); // let entrance animations settle
        if (status === 'ok') {
          await page.addScriptTag({ path: AXE_SCRIPT });
          cell.a11y = await page.evaluate(async options => {
            const { violations } = await (window as any).axe.run(document, options);
            return violations.map((v: any) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length }));
          }, AXE_OPTIONS);
        }
        // Crop to what was actually painted (portals included), so a lone button isn't a speck in a blank page.
        const clip = await page.evaluate(({ width, height }) => {
          let x1 = Infinity, y1 = Infinity, x2 = 0, y2 = 0;
          for (const el of document.body.querySelectorAll('*')) {
            if (el.id === 'root' || el.tagName === 'SCRIPT') continue;
            const r = el.getBoundingClientRect();
            if (r.width < 1 || r.height < 1) continue;
            x1 = Math.min(x1, r.left); y1 = Math.min(y1, r.top); x2 = Math.max(x2, r.right); y2 = Math.max(y2, r.bottom);
          }
          if (x1 === Infinity) return null;
          const pad = 24;
          const x = Math.max(0, x1 - pad), y = Math.max(0, y1 - pad);
          return { x, y, width: Math.max(240, Math.min(width, x2 + pad) - x), height: Math.max(140, Math.min(height, y2 + pad) - y) };
        }, viewport);
        cell.screenshot = (await page.screenshot({ type: 'jpeg', quality: 75, ...(clip ? { clip } : {}) })).toString('base64');
      } catch (error) {
        cell.renderError = `Render failed: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`;
      } finally {
        await page.close();
      }
    };
    // First one alone warms Vite's dependency cache; then 4 at a time.
    await capture(buildable[0]);
    let next = 1, finished = 1;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (next < buildable.length) {
        await capture(buildable[next++]);
        if (++finished % 20 === 0) log(`  ${finished}/${buildable.length} captured`);
      }
    }));
  } finally {
    await browser.close();
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
}
