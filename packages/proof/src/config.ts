// Everything design-system specific lives in the config file — this package knows nothing about Helix.
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { InlineConfig } from 'vite';

/** `command`: how to produce this level's answers — shown on its row until it has any. `{task}` is
 * replaced by the task in view. `explain`: plain words on what the agent got at this level — the tooltip
 * of the ⓘ next to its name. */
export type VariantInfo = { label: string; detail?: string; command?: string; explain?: string };

export type GalleryConfig = {
  /** Shown in the gallery title, e.g. "Helix". */
  name: string;
  /** Folder of saved answers: one JSON per answer (see README → "Answer format"). */
  outputs: string;
  /** Where gallery.html is written. */
  out: string;
  /**
   * A folder that can already render your design system: its node_modules has react, react-dom and your
   * packages (a Storybook, a docs site, a sample app). Answers are rendered from inside it, so their
   * imports resolve exactly as they would in a real consumer.
   */
  app: string;
  /** Every task id, run or not — the picker lists them all, so what's still missing is visible. When
   * omitted, only tasks with answers are listed. */
  tasks?: string[];
  /** The task the page opens on (a #task= link still wins). Default: the first task alphabetically. */
  defaultTask?: string;
  /** Stylesheets every answer needs (tokens, component CSS) — import specifiers, resolved from `app`. */
  css?: string[];
  /**
   * Imports an answer may use. Anything else ("@acme/ui-kit-v2" an agent made up) is recorded as a build
   * failure without trying to compile it. Exact names match the package and its subpaths.
   */
  imports: string[];
  /** Extra Vite config — plugins your CSS needs (Tailwind…), aliases to source. Receives a helper that
   * imports a package from `app`, since the config file itself may not see the app's dependencies. */
  vite?: (helpers: { importFromApp: (spec: string) => Promise<any> }) => InlineConfig | Promise<InlineConfig>;
  /** Attribute set on <html> before rendering, e.g. { "data-theme": "light" }. */
  htmlAttributes?: Record<string, string>;
  /** The context levels to show, in row order, with their display names. When set, any other variant (a
   * one-off experiment) is left out. When omitted, every variant is shown under its own name. */
  variants?: Record<string, VariantInfo>;
  /**
   * Optional: makes the served page's "Run evals" button work (`proof --serve`). Commands are argv arrays
   * run from the config's folder; `{levels}`, `{tasks}`, `{runs}` become the selection (comma-separated).
   * `plan` must print JSON `{ answers, estTokens }` without generating; `run` generates; `after` runs once
   * it succeeds (e.g. refresh other reports). Proof then rebuilds itself and the page reloads.
   */
  runner?: { plan: string[]; run: string[]; after?: string[][]; defaultRuns?: number };
  /** Screenshot viewport. Default 800×520. */
  viewport?: { width: number; height: number };
};

export const defineConfig = (config: GalleryConfig) => config;

export type ResolvedConfig = GalleryConfig & { root: string; outputsDir: string; outDir: string; appDir: string };

export async function loadConfig(configPath: string): Promise<ResolvedConfig> {
  const file = path.resolve(configPath);
  if (!existsSync(file)) throw new Error(`No config at ${file} — create proof.config.mjs (see README).`);
  const config = (await import(pathToFileURL(file).href)).default as GalleryConfig;
  for (const key of ['name', 'outputs', 'out', 'app', 'imports'] as const) {
    if (!config?.[key]) throw new Error(`${path.basename(file)}: "${key}" is required.`);
  }
  const root = path.dirname(file);
  return {
    ...config,
    root,
    outputsDir: path.resolve(root, config.outputs),
    outDir: path.resolve(root, config.out),
    appDir: path.resolve(root, config.app),
  };
}

export function importFromApp(appDir: string) {
  const require = createRequire(path.join(appDir, 'package.json'));
  return (spec: string) => import(pathToFileURL(require.resolve(spec)).href);
}
