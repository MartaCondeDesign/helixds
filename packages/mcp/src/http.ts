/**
 * Helix DS MCP server over Streamable HTTP — for clients that connect to a URL instead of launching
 * a local process: claude.ai / Claude mobile "custom connectors", or any remote MCP client.
 *
 * Stateless: every POST gets a fresh server + transport (the tools keep no state, and it lets this run
 * behind any load balancer or serverless host).
 *
 * Env:
 *   PORT                 port to listen on (default 3333)
 *   HELIX_ROOT           Helix checkout to read (default: this repo)
 *   HELIX_MCP_SECRET     if set, the endpoint is /mcp/<secret> and everything else is 404. The repo is
 *                        private — without this, anyone with the URL can read contracts and tokens.
 *
 * Run: pnpm --filter @helix-ds/mcp serve
 */
import http from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';

const PORT = Number(process.env.PORT ?? 3333);
const SECRET = process.env.HELIX_MCP_SECRET;
const ENDPOINT = SECRET ? `/mcp/${SECRET}` : '/mcp';

const send = (res: http.ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body));
};

const readBody = (req: http.IncomingMessage) => new Promise<unknown>((resolve, reject) => {
  const chunks: Buffer[] = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf-8')) : undefined); }
    catch (e) { reject(e); }
  });
  req.on('error', reject);
});

http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (url.pathname === '/' || url.pathname === '/health') {
    return send(res, 200, { name: 'helix', status: 'ok' });
  }
  if (url.pathname !== ENDPOINT) return send(res, 404, { error: 'not found' });

  // Stateless server: no SSE stream to resume (GET) and no session to end (DELETE).
  if (req.method !== 'POST') {
    return send(res, 405, { jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed' }, id: null });
  }

  try {
    const body = await readBody(req);
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({}); // no sessionIdGenerator → stateless
    res.on('close', () => { void transport.close(); void server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch (error) {
    if (!res.headersSent) {
      send(res, 500, { jsonrpc: '2.0', error: { code: -32603, message: String(error) }, id: null });
    }
  }
}).listen(PORT, () => {
  console.log(`helix MCP (HTTP) on http://localhost:${PORT}${SECRET ? '/mcp/<secret>' : '/mcp'}`);
});
