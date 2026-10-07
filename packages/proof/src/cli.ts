#!/usr/bin/env -S npx tsx
// proof [--config proof.config.mjs] [--task a,b] [--no-screenshots] [--serve [--no-build] [--port 6007]]
// Proof: builds <out>/proof.html from saved agent answers. No agent runs — it only reads what's on disk.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { readCells } from './cells.ts';
import { loadConfig } from './config.ts';
import { galleryHtml } from './html.ts';
import { renderCells } from './render.ts';
import { serve } from './serve.ts';

const { values } = parseArgs({
  options: {
    config: { type: 'string', default: 'proof.config.mjs' },
    task: { type: 'string' },
    'no-screenshots': { type: 'boolean', default: false },
    // --serve: open the result on localhost (default port 6007, next to Storybook's 6006);
    // with --no-build, serve the last proof.html as is.
    serve: { type: 'boolean', default: false },
    'no-build': { type: 'boolean', default: false },
    port: { type: 'string', default: process.env.PORT ?? '6007' },
  },
});

const started = Date.now();
const config = await loadConfig(values.config!);
const file = path.join(config.outDir, 'proof.html');
if (values.serve && values['no-build']) {
  serve(file, Number(values.port), config, build);
} else {
  await build();
  if (values.serve) serve(file, Number(values.port), config, build);
}

async function build() {
  let cells = readCells(config.outputsDir, config.imports, config.exports);
  // Listed variants are the context levels every task is run at; a one-off experiment on a few tasks
  // (anything not listed) would leave holes in the comparison, so it's left out.
  if (config.variants) cells = cells.filter(c => c.variant in config.variants!);
  if (values.task) {
    const wanted = new Set(values.task.split(','));
    cells = cells.filter(c => wanted.has(c.task));
  }
  if (!cells.length) {
    console.error(`No answers with a "variant" in ${config.outputsDir}${values.task ? ` for ${values.task}` : ''}.`);
    process.exit(1);
  }

  const tasks = new Set(cells.map(c => c.task)).size;
  const unbuildable = cells.filter(c => c.buildError).length;
  console.log(`${config.name}: ${cells.length} answers · ${tasks} tasks · ${unbuildable} can't build`);
  if (!values['no-screenshots']) {
    console.log('Rendering and capturing…');
    await renderCells(config, cells, console.log);
  }

  mkdirSync(config.outDir, { recursive: true });
  writeFileSync(file, galleryHtml({ name: config.name, cells, tasks: config.tasks ?? [], defaultTask: config.defaultTask, variants: config.variants ?? {}, generatedAt: new Date().toISOString() }));
  const checked = cells.filter(c => c.a11y);
  if (checked.length) console.log(`Accessibility: ${checked.filter(c => !c.a11y!.length).length}/${checked.length} rendered answers with no axe issues`);
  const measured = cells.filter(c => c.tokens);
  if (measured.length) console.log(`Tokens: ${measured.reduce((n, c) => n + c.tokens!, 0).toLocaleString()} across ${measured.length} answers with usage recorded`);
  const needsProps = cells.filter(c => c.renderError?.startsWith('Needs props')).length;
  const failed = cells.filter(c => !c.buildError && c.renderError).length - needsProps;
  console.log(`✓ ${path.relative(process.cwd(), file)} (${failed} failed to render, ${needsProps} need props) in ${Math.round((Date.now() - started) / 1000)}s`);
}
