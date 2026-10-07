/**
 * Adds one token to packages/tokens/src/tokens.json, refusing to write it if the key
 * violates the naming rules in packages/tokens/CLAUDE.md (checked with the same logic
 * as `pnpm verify:tokens`, before anything touches disk).
 *
 * Writes via a surgical text insertion (find the parent object's closing brace, insert
 * one line before it) — NOT a full JSON.parse + stringify — because re-serializing the
 * whole file destroys its hand-aligned formatting (verified: a naive stringify turned a
 * one-token addition into a 2000-line diff). This only touches the lines it needs to.
 *
 * Run: pnpm token:add <dot.path.to.key> <value> [--type color|dimension|fontWeight|shadow|number|duration|fontFamily] [--description "text"]
 * Example: pnpm token:add semantic.color.text.neutral-lightest "{primitive.color.gray.500}" --type color
 *
 * Does NOT push to Figma or update Storybook — those are separate manual/agent steps. After this
 * succeeds: sync Figma following .ai/skills/tokens-to-figma.md → "Entry C — single token addition",
 * and add the token to apps/storybook/stories/Foundation.stories.tsx (ColorSemantic story). See
 * packages/tokens/CLAUDE.md → "Adding a token" for the full checklist — a token isn't done until
 * both of those reflect it too.
 */
import fs from 'fs';
import path from 'path';
import { checkKeyNaming, checkIconAliasNaming, checkRelativeLightness } from './token-naming-lib';

const args = process.argv.slice(2);
const [dotPath, value] = args;

if (!dotPath || value === undefined) {
  console.error('Usage: pnpm token:add <dot.path.to.key> <value> [--type color] [--description "text"]');
  console.error('Example: pnpm token:add semantic.color.text.neutral-lightest "{primitive.color.gray.500}" --type color');
  process.exit(1);
}

function flagValue(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const type = flagValue('type', 'color');
const description = args.includes('--description') ? flagValue('description', '') : undefined;

const pathParts = dotPath.split('.');
const newKey = pathParts.at(-1)!;
const parentPath = pathParts.slice(0, -1);
const layer = pathParts[0];

// ── Naming check — refuse to write on violation, same rules as verify:tokens ──

const keyViolations = checkKeyNaming(newKey);
if (keyViolations.length > 0) {
  console.error(`❌ '${dotPath}' violates the naming vocabulary:`);
  for (const v of keyViolations) console.error(`   ${v}`);
  console.error('\nSee packages/tokens/CLAUDE.md → "Semantic naming vocabulary". Not written.');
  process.exit(1);
}

const iconViolations = checkIconAliasNaming(pathParts, value);
if (iconViolations.length > 0) {
  console.error(`❌ '${dotPath}':`);
  for (const v of iconViolations) console.error(`   ${v}`);
  console.error('\nNot written.');
  process.exit(1);
}

if (layer !== 'primitive' && layer !== 'semantic' && layer !== 'component') {
  console.error(`❌ First path segment must be primitive, semantic, or component — got '${layer}'.`);
  process.exit(1);
}

if (parentPath.length === 0) {
  console.error(`❌ Can't add a top-level layer key — only keys nested inside primitive/semantic/component.`);
  process.exit(1);
}

// ── Structural checks (parent exists, key doesn't already) — via parse, read-only ──

const tokensPath = path.resolve(import.meta.dirname, '../packages/tokens/src/tokens.json');
const raw = fs.readFileSync(tokensPath, 'utf-8');
const parsed = JSON.parse(raw);

let node: any = parsed;
for (const part of parentPath) {
  if (typeof node !== 'object' || node === null || !(part in node)) {
    console.error(`❌ Parent path '${parentPath.join('.')}' doesn't exist in tokens.json. Create it manually first (this tool only adds a leaf to an existing object).`);
    process.exit(1);
  }
  node = node[part];
}
if (typeof node !== 'object' || node === null || '$value' in node) {
  console.error(`❌ '${parentPath.join('.')}' is a leaf token, not an object — can't add a child to it.`);
  process.exit(1);
}
if (newKey in node) {
  console.error(`❌ '${dotPath}' already exists. Edit tokens.json directly to change an existing token.`);
  process.exit(1);
}

// ── Relative light/dark check — only meaningful for semantic.color.* additions, since it
// compares a role's tiers against each other (checkRelativeLightness needs the whole tree to
// find siblings, so simulate the addition on a clone rather than duplicating its logic here) ──

if (layer === 'semantic' && pathParts[1] === 'color' && type === 'color') {
  const simulated = JSON.parse(raw);
  let simNode: any = simulated;
  for (const part of parentPath) simNode = simNode[part];
  simNode[newKey] = { $value: value, $type: type };

  const lightnessIssues = checkRelativeLightness(simulated).filter(msg => msg.includes(`.${newKey}:`));
  if (lightnessIssues.length > 0) {
    console.error(`❌ '${dotPath}' fails the relative light/dark check:`);
    for (const v of lightnessIssues) console.error(`   ${v}`);
    console.error('\nSee packages/tokens/CLAUDE.md → "Semantic naming vocabulary" (the light/dark-vs-base-tone rule). Not written.');
    process.exit(1);
  }
}

// ── Surgical text insertion ───────────────────────────────────────────────────

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

const lines = raw.split('\n');
const depthStack: string[] = [];
let inserted = false;

for (let li = 0; li < lines.length && !inserted; li++) {
  const line = lines[li];
  const openMatch = line.match(/^(\s*)"([^"]+)":\s*\{\s*$/);

  if (openMatch) {
    const [, indent, key] = openMatch;
    depthStack.push(key);

    if (arraysEqual(depthStack, parentPath)) {
      // find this object's matching closing line by tracking brace balance
      let braceDepth = 1;
      let lj = li + 1;
      while (braceDepth > 0 && lj < lines.length) {
        const opens = (lines[lj].match(/\{/g) || []).length;
        const closes = (lines[lj].match(/\}/g) || []).length;
        braceDepth += opens - closes;
        if (braceDepth === 0) break;
        lj++;
      }
      if (lj >= lines.length) {
        console.error('❌ Could not find the closing brace for the parent object — aborting without writing.');
        process.exit(1);
      }

      const childIndent = indent + '  ';
      let leaf = `{ "$value": ${JSON.stringify(value)}, "$type": ${JSON.stringify(type)}`;
      if (description) leaf += `, "$description": ${JSON.stringify(description)}`;
      leaf += ' }';
      const newLine = `${childIndent}"${newKey}": ${leaf}`;

      // ensure the previous sibling line ends with a comma
      const prevIdx = lj - 1;
      const prevLine = lines[prevIdx];
      if (prevLine.trim() !== '' && !/,\s*$/.test(prevLine)) {
        lines[prevIdx] = prevLine.replace(/\s*$/, '') + ',';
      }

      lines.splice(lj, 0, newLine);
      inserted = true;
      break;
    }
    continue;
  }

  if (/^\s*\},?\s*$/.test(line) && depthStack.length > 0) {
    depthStack.pop();
  }
}

if (!inserted) {
  console.error(`❌ Could not locate '${parentPath.join('.')}' as an insertion point in the file text — aborting without writing. (This can happen if the object is written on a single line.)`);
  process.exit(1);
}

fs.writeFileSync(tokensPath, lines.join('\n'));

console.log(`✅ Added '${dotPath}'`);
console.log(`\nNext:`);
console.log(`  1. git diff packages/tokens/src/tokens.json — confirm only the new line(s) changed`);
console.log(`  2. pnpm --filter @helixds/tokens build`);
console.log(`  3. pnpm verify:tokens   # confirm the whole file is still clean`);
console.log(`  4. Sync to Figma: .ai/skills/tokens-to-figma.md → "Entry C — single token addition"`);
console.log(`  5. Add it to apps/storybook/stories/Foundation.stories.tsx (ColorSemantic story)`);
