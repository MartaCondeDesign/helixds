// Serves proof.html on localhost and opens it — like a Storybook dev server, for one file. With a
// `runner` in the config, it also backs the page's "Run evals" button: estimate, run, rebuild.
import { existsSync, readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { spawn } from 'node:child_process';
import type { ResolvedConfig } from './config.ts';

type Selection = { levels: string[]; tasks: string[]; runs: number };

// {levels} {tasks} {runs} in a runner command become the selection; everything else is passed as is.
const fill = (command: string[], sel: Selection) => command.map(arg =>
  arg === '{levels}' ? sel.levels.join(',') : arg === '{tasks}' ? sel.tasks.join(',') : arg === '{runs}' ? String(sel.runs) : arg);

function run(command: string[], cwd: string, onOutput: (chunk: string) => void): Promise<number> {
  return new Promise(resolve => {
    const child = spawn(command[0], command.slice(1), { cwd, env: { ...process.env, FORCE_COLOR: '0' } });
    child.stdout.on('data', d => onOutput(String(d)));
    child.stderr.on('data', d => onOutput(String(d)));
    child.on('error', error => { onOutput(`${error.message}\n`); resolve(1); });
    child.on('close', code => resolve(code ?? 1));
  });
}

const readBody = (req: IncomingMessage) => new Promise<string>(resolve => {
  let body = '';
  req.on('data', d => (body += d));
  req.on('end', () => resolve(body));
});

function parseSelection(body: string, config: ResolvedConfig): Selection | null {
  try {
    const sel = JSON.parse(body) as Selection;
    const knownLevels = new Set(Object.keys(config.variants ?? {}));
    const ok = Array.isArray(sel.levels) && sel.levels.length && sel.levels.every(l => knownLevels.has(l))
      && Array.isArray(sel.tasks) && sel.tasks.length && sel.tasks.every(t => /^[\w-]+$/.test(t))
      && Number.isInteger(sel.runs) && sel.runs >= 1 && sel.runs <= 20;
    return ok ? sel : null;
  } catch { return null; }
}

export function serve(file: string, port: number, config: ResolvedConfig, rebuild: () => Promise<void>) {
  if (!existsSync(file)) {
    console.error(`No ${file} yet — run proof without --no-build first.`);
    process.exit(1);
  }
  let running = false;
  const json = (res: ServerResponse, status: number, body: unknown) =>
    res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body));

  const server = createServer(async (req, res) => {
    const url = req.url ?? '/';
    if (url === '/' || url.startsWith('/?') || url.startsWith('/#')) {
      // Read on every request: rebuilding proof.html in another terminal shows up on reload.
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(readFileSync(file));
      return;
    }
    if (url === '/api/runner' && req.method === 'GET') {
      json(res, config.runner ? 200 : 404, config.runner
        ? { levels: Object.entries(config.variants ?? {}).map(([variant, info]) => ({ variant, label: info.label })), tasks: config.tasks ?? [], runs: config.runner.defaultRuns ?? 1, running }
        : { error: 'No runner in the config' });
      return;
    }
    if (!config.runner || req.method !== 'POST' || (url !== '/api/plan' && url !== '/api/run')) {
      res.writeHead(404).end();
      return;
    }
    const sel = parseSelection(await readBody(req), config);
    if (!sel) { json(res, 400, { error: 'Pick at least one level and one task, and 1–20 runs.' }); return; }

    if (url === '/api/plan') {
      let out = '';
      const code = await run(fill(config.runner.plan, sel), config.root, chunk => (out += chunk));
      try { json(res, 200, JSON.parse(out.trim().split('\n').pop()!)); }
      catch { json(res, 500, { error: code ? out.slice(-500) : 'The plan command did not print JSON.' }); }
      return;
    }

    // /api/run: stream the log as plain text; the last line is "__PROOF_DONE__ <exit code>".
    if (running) { json(res, 409, { error: 'A run is already in progress.' }); return; }
    running = true;
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
    const log = (chunk: string) => { res.write(chunk); process.stdout.write(chunk); };
    try {
      let code = await run(fill(config.runner.run, sel), config.root, log);
      for (const after of config.runner.after ?? []) {
        if (code) break;
        log(`\n$ ${after.join(' ')}\n`);
        code = await run(after, config.root, log);
      }
      if (!code) { log('\nRebuilding Proof…\n'); await rebuild(); }
      res.end(`\n__PROOF_DONE__ ${code}\n`);
    } finally {
      running = false;
    }
  });

  // Busy port (a second Storybook often takes 6007): take the next free one, like Storybook does.
  let tries = 0;
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code !== 'EADDRINUSE' || ++tries > 20) throw error;
    server.listen(++port, '127.0.0.1');
  });
  server.on('listening', () => {
    const url = `http://localhost:${port}`;
    console.log(`Proof running at ${url} — Ctrl+C to stop`);
    if (process.env.PROOF_NO_OPEN) return;
    const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    spawn(opener, [url], { stdio: 'ignore', shell: process.platform === 'win32', detached: true }).on('error', () => {}).unref();
  });
  server.listen(port, '127.0.0.1');
}
