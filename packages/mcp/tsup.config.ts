import { defineConfig } from 'tsup';

// server.js is the `helix-mcp` bin (`npx @helixds/mcp`). Local code — the query library, the checks and
// packages/tokens/src/dtcg.mjs it imports — is bundled in; dependencies stay external.
export default defineConfig({
  entry: ['src/server.ts'],
  format: 'esm',
  target: 'node20',
  platform: 'node',
  banner: { js: '#!/usr/bin/env node' },
  clean: true,
});
