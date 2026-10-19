import { defineConfig } from 'tsup';

// cli.js is the `proof` bin; config.js is what a proof.config.mjs imports (defineConfig + its types).
export default defineConfig({
  entry: ['src/cli.ts', 'src/config.ts'],
  format: 'esm',
  target: 'node20',
  platform: 'node',
  dts: { entry: 'src/config.ts' },
  clean: true,
});
