#!/usr/bin/env tsx
/** CLI for agents and people querying the Helix design system. Every query is read-only; only scaffold:custom writes. */
import { getComponent, getPattern, getToken, listComponents, search } from './helix-query-lib.ts';
import { scaffoldCustom } from './scaffold-custom.ts';
import { dashboard } from './helix-dashboard.ts';

type Result = { error?: string; [key: string]: unknown };
const args = process.argv.slice(2);

if (args[0] === 'scaffold:custom') {
  scaffoldCustom(args.slice(1));
  process.exit(0);
}

if (args[0] === 'dashboard') {
  dashboard(args.slice(1));
  process.exit(0);
}
const json = args.includes('--json');
const cleaned = args.filter(arg => arg !== '--json');

function usage(): never {
  console.error(`Usage: pnpm helix <command> [argument] [--json]

Commands:
  components [--status draft|beta|stable]  List components
  component <Name>                         Get an exact component contract
  token <dot.path>                         Get a semantic token
  pattern <name>                           Get a documented composition pattern
  search <query>                           Search components, patterns, and semantic tokens
  batch --command "component Button"       Run multiple read-only queries
  dashboard                                AI-readiness score, its signals, gaps and data freshness
  scaffold:custom <Name> --reason "<why>" [--dir <path>]
                                           Create a local [CUSTOM] component (writes files)`);
  process.exit(1);
}

function run(commandArgs: string[]): Result {
  const [command, ...rest] = commandArgs;
  if (command === 'components') {
    const statusAt = rest.indexOf('--status');
    const status = statusAt >= 0 ? rest[statusAt + 1] : undefined;
    return { command, components: listComponents(status) };
  }
  const argument = rest.join(' ').trim();
  if (!argument) return { error: `Missing argument for '${command}'.` };
  if (command === 'component') return getComponent(argument) ?? { error: `Component '${argument}' was not found.` };
  if (command === 'token') return getToken(argument) ?? { error: `Token '${argument}' was not found.` };
  if (command === 'pattern') return getPattern(argument) ?? { error: `Pattern '${argument}' was not found.` };
  if (command === 'search') return search(argument);
  return { error: `Unknown command '${command}'.` };
}

function format(result: Result): string {
  if (result.error) return `Error: ${result.error}`;
  if ('components' in result) return (result.components as Array<{ name: string; status: string; purpose: string }>)
    .map(component => `${component.name} (${component.status}) — ${component.purpose}`).join('\n');
  if ('results' in result) return (result.results as Array<Record<string, unknown>>).map(item =>
    item.kind === 'component' ? `${item.name} (${item.status}) — ${item.purpose}` :
    item.kind === 'token' ? `${item.path} = ${item.value}` : `${item.name} — ${item.source}`).join('\n') || 'No results.';
  if ('props' in result) {
    const component = result as {
      name: string;
      purpose: string;
      rationale?: string | null;
      governance?: { mayExtendLocally?: string[]; mustEscalateToDS?: string[] } | null;
      props: Array<{ name: string; type: string; required?: boolean; description: string }>;
    };
    const props = component.props.map(prop => `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type} — ${prop.description}`).join('\n');
    let out = `${component.name} — ${component.purpose}\nProps:\n${props || '  None documented.'}`;
    if (component.rationale) {
      out += `\nRationale:\n  ${component.rationale}`;
    }
    if (component.governance) {
      if (component.governance.mayExtendLocally?.length) {
        out += `\nGovernance (May extend locally):\n` + component.governance.mayExtendLocally.map(rule => `  ✓ ${rule}`).join('\n');
      }
      if (component.governance.mustEscalateToDS?.length) {
        out += `\nGovernance (Must escalate to DS):\n` + component.governance.mustEscalateToDS.map(rule => `  ! ${rule}`).join('\n');
      }
    }
    return out;
  }
  if ('cssVariable' in result) return `${result.path} = ${JSON.stringify(result.value)} (${result.cssVariable})`;
  if ('guidance' in result) return String(result.guidance);
  return JSON.stringify(result, null, 2);
}

let result: Result;
if (cleaned[0] === 'batch') {
  const commands: string[] = [];
  for (let index = 1; index < cleaned.length; index += 1) {
    if (cleaned[index] === '--command' && cleaned[index + 1]) commands.push(cleaned[index + 1]!);
  }
  if (commands.length === 0) usage();
  result = { batch: commands.map(command => ({ command, result: run(command.trim().split(/\s+/)) })) };
} else {
  if (cleaned.length === 0 || cleaned[0] === '--help' || cleaned[0] === 'help') usage();
  result = run(cleaned);
}

if (json) console.log(JSON.stringify(result, null, 2));
else if ('batch' in result) console.log((result.batch as Array<{ command: string; result: Result }>).map(entry => `# ${entry.command}\n${format(entry.result)}`).join('\n\n'));
else console.log(format(result));

process.exit(result.error ? 1 : 0);
