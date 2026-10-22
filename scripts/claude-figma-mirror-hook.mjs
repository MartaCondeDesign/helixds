#!/usr/bin/env node
/**
 * PostToolUse hook on the Figma MCP's `use_figma` (.claude/settings.json): every change made in Helix's Figma
 * working file is made in the copy in the martacondedieguez account (the file published on Figma Community) too, in the same step (owner's rule 2026-10-22,
 * .ai/skills/components-to-figma.md → Phase 8). Both keys live in contracts/figma-sync.json: `figmaFileKey` and
 * `figmaCommunityFileKey`. When a script that changes the working file has run, the agent is told to run the same
 * script on the Community file now — read-only scripts (no create / remove / append / property write) go straight
 * through, and so does any script on the Community file itself. Fails open: a payload it can't read lets it through.
 */
import fs from 'node:fs';
import path from 'node:path';
import { feedback, readPayload, projectDir } from './hook-io.mjs';

// A write in the Plugin API: creating, moving, removing or binding nodes, setting their properties, or editing
// components, variables and styles. `===`/`==` comparisons don't count.
const WRITE = new RegExp([
  String.raw`\bfigma\.(create\w+|combineAsVariants|group|flatten|union|subtract|intersect|exclude)\s*\(`,
  String.raw`\bfigma\.variables\.(create\w+|setBoundVariableForPaint)\s*\(`,
  String.raw`\.(appendChild|insertChild|appendChildAt|remove|resize|resizeWithoutConstraints|rescale|setBoundVariable|setProperties|swapComponent|detachInstance|setExplicitVariableModeForCollection|setValueForMode|addComponentProperty|editComponentProperty|deleteComponentProperty|setTextStyleIdAsync|setFillStyleIdAsync|setEffectStyleIdAsync)\s*\(`,
  String.raw`\.(fills|strokes|effects|characters|name|description|x|y|visible|opacity|layoutMode|layoutSizingHorizontal|layoutSizingVertical|itemSpacing|padding\w*|cornerRadius|\w+Radius|textStyleId|fontName|fontSize|strokeWeight|clipsContent|primaryAxis\w+|counterAxis\w+|gridRowSizes|gridColumnSizes|scopes|codeSyntax)\s*=(?!=)`,
].join('|'));

const payload = await readPayload();
if (!payload) process.exit(0);
if (!/use_figma$/.test(String(payload.tool_name ?? ''))) process.exit(0);
let sync = {};
try { sync = JSON.parse(fs.readFileSync(path.join(projectDir(payload), 'contracts/figma-sync.json'), 'utf8')); } catch { process.exit(0); }
const { figmaFileKey: working, figmaCommunityFileKey: community } = sync;
const fileKey = String(payload.tool_input?.fileKey ?? '');
const code = String(payload.tool_input?.code ?? '');
if (!working || !community || fileKey !== working || !WRITE.test(code)) process.exit(0);
const failed = payload.tool_response && /"isError"\s*:\s*true|^Error\b/.test(typeof payload.tool_response === 'string' ? payload.tool_response : JSON.stringify(payload.tool_response));
if (failed) process.exit(0);

console.log(JSON.stringify(feedback(payload, [
  `This use_figma script changed Helix's Figma working file (${working}).`,
  `Every Figma change goes into both files in the same step (owner's rule, .ai/skills/components-to-figma.md → Phase 8):`,
  `run the same script now on the copy in the martacondedieguez account (the file published on Figma Community), fileKey "${community}" (contracts/figma-sync.json →`,
  `figmaCommunityFileKey), adjusting only node ids that differ between the files (look them up by name there),`,
  `and check it the same way (audit or screenshot). If the Figma MCP has no edit access to that file, use the`,
  `connection signed in as martacondedieguez (figma-community) or tell the owner — never skip it silently.`,
].join('\n'))));
