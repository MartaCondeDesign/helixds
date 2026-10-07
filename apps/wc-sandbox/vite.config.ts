import { defineConfig } from 'vite';

// Workspace-linked packages (@helix/tokens, @helix/wc) resolve to sibling dist/ folders
// outside this app's own directory — Vite's default fs.allow blocks that. Explicitly allow-listing
// the repo root still 403s here: macOS/APFS returns this path's "Documentación" segment in a
// different Unicode normalization form (NFD) than the browser's request URL decodes it to (NFC),
// so Vite's plain string-prefix check on server.fs.allow never matches even though both refer to
// the same file. fs.strict is a local-dev safety net (stops a page from reading arbitrary files
// off the machine it's served from) with no bearing on the pilot itself — off is fine for this
// sandbox; keep it on if this config is ever reused for anything actually deployed.
export default defineConfig({
  server: {
    fs: {
      strict: false,
    },
  },
});
