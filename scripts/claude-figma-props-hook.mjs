#!/usr/bin/env node
/**
 * PreToolUse hook on the Figma MCP's `use_figma` (.claude/settings.json): a Figma script that creates, renames
 * or deletes a component property — or builds a component or variant set — stops and asks the design-system
 * owner first, showing the code-vs-Figma table of every component it touches (owner's decision 2026-10-21,
 * CLAUDE.md rule 16). The comparison is automatic — the table is .ai/maps/figma-map.md's section for that
 * component: every code prop from the contract, the Figma property the standard (contracts/figma-conversion.json)
 * says it must be, what Figma has today (.ai/figma-props.json), the property order and any Figma-only property.
 * The naming decision is the owner's: the change only runs if they approve it (permissionDecision "ask").
 *
 * What asks: addComponentProperty, editComponentProperty, deleteComponentProperty, combineAsVariants,
 * createComponent(FromNode), and renaming a variant (`.name = 'size=m, …'`, which is how an axis is renamed).
 * Read-only scripts, layout, fills and bindings go straight through. Components are recognised by the node ids
 * the script names (looked up in .ai/figma-props.json) and by contract names it quotes. Fails open: a payload
 * it can't read lets the call through.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ask, readPayload, projectDir } from './hook-io.mjs';
import { recordHookTrace } from './hook-trace.mjs';

const PROP_WRITE = /\b(addComponentProperty|editComponentProperty|deleteComponentProperty|combineAsVariants|createComponentFromNode|createComponent)\s*\(/g;
// A variant's name is its properties: `v.name = 'size=m, state=default'` or a template building `${k}=${v}`.
const VARIANT_RENAME = /\.name\s*=\s*(?:[`'"][^`'"\n]*\w=|[^;\n]*\$\{[^}]+\}=)/;

const payload = await readPayload();
if (!payload) process.exit(0);
if (!/use_figma$/.test(String(payload.tool_name ?? ''))) process.exit(0);
const code = String(payload.tool_input?.code ?? '');
const calls = [...new Set([...code.matchAll(PROP_WRITE)].map(m => m[1]))];
if (VARIANT_RENAME.test(code)) calls.push('variant rename (.name = "prop=value, …")');
if (!calls.length) process.exit(0);

const root = projectDir(payload);
const read = file => { try { return fs.readFileSync(path.join(root, file), 'utf8'); } catch { return ''; } };
let snapshot = {};
try { snapshot = JSON.parse(read('.ai/figma-props.json')).components ?? {}; } catch {}
let contracts = [];
try { contracts = fs.readdirSync(path.join(root, 'contracts/components')).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, '')); } catch {}

// Which components: the node ids the script names, then contract names it quotes ('Avatar', "Button").
const byId = Object.fromEntries(Object.entries(snapshot).map(([name, c]) => [c.nodeId, name]));
const ids = [...code.matchAll(/['"`](\d+:\d+)['"`]/g)].map(m => m[1]);
const quoted = new Set([...code.matchAll(/['"`]([A-Z][A-Za-z]+)['"`]/g)].map(m => m[1]));
const components = [...new Set([...ids.map(id => byId[id]).filter(Boolean), ...contracts.filter(n => quoted.has(n))])];

const map = read('.ai/maps/figma-map.md');
const sectionOf = name => {
  const sec = map.split(/^### /m).find(s => s.startsWith(`${name} (`));
  if (!sec) return `### ${name}\n_Not in .ai/maps/figma-map.md yet — run \`pnpm docs:figma-map\` and show the owner the table before building._`;
  return `### ${sec.split(/\n\*\*Anatomy layers\*\*/)[0].trim()}`;
};
const tables = components.length
  ? components.map(sectionOf).join('\n\n')
  : '_No known component in this script (a new component, or ids not in .ai/figma-props.json)._ Show the owner the code-vs-Figma table first: write the contract, run `pnpm docs:figma-map`, and paste that component\'s section.';

recordHookTrace({
  hook: 'figma-props', decision: 'ask', payload,
  findings: [{ gate: 'Figma component properties', message: `${calls.join(', ')} — ${components.join(', ') || 'unknown component'}` }],
});

console.log(JSON.stringify(ask(payload,
  `Helix owner approval needed — this Figma script changes component properties (${calls.join(', ')})` +
  `${components.length ? ` on ${components.join(', ')}` : ''}.\n` +
  'Rule 16: every Figma property has the code prop\'s exact name and kind, in the code\'s order. Check the table — ' +
  'code prop · the Figma property it must be · what Figma has today (last snapshot) — and approve only if the ' +
  'names the script creates or renames are the ones in the "Figma property" column. Anything else (a new name, a ' +
  'Figma-only property) is your decision: deny and ask the agent for the options.\n\n' + tables,
)));
