/**
 * Generates .ai/maps/changelog.json from `git log` — one entry per commit, grouped by day.
 * Storybook's Changelog story (apps/storybook/stories/Changelog.stories.tsx) imports this file
 * directly to render an always-current "what changed" page inside Storybook itself.
 *
 * The output is GENERATED and not tracked by git (.gitignore) — it is derived from `git log`, so storing
 * it would only add a "Regenerate changelog" commit after every real one (that's what the old post-commit
 * hook did: 108 of the first 273 commits). It is rebuilt instead on `pnpm install`, when Storybook starts
 * or builds, and after every commit (.husky/post-commit), so the page is always current. Run by hand:
 * pnpm docs:changelog. The tracked CHANGELOG.md (--md, see the bottom of this file) is different: the
 * same hook amends it into each commit, so it never needs its own commit either.
 *
 * Each commit also gets a `bump` classification (major/minor/patch — always one of the three, no
 * fallback "other" bucket) — a KEYWORD HEURISTIC on the commit subject, not a real semver signal.
 * This repo's commits don't use conventional-commit prefixes (feat:/fix:/...), so there's no
 * reliable signal to parse; this is a deliberately fuzzy stand-in the user chose over enforcing a
 * new commit convention. Treat `bump` as "a rough read of what kind of change this was," not an
 * authoritative version-bump decision — packages here are `private: true` and nothing is actually
 * published, so no real version number depends on it.
 *
 * Also resolves `origin`'s GitHub URL (`repoUrl`) so each commit's hash can link straight to it on
 * GitHub — null if there's no `origin` remote or it isn't a github.com one, in which case the page
 * just renders the hash as plain text instead of a broken link.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root    = path.resolve(import.meta.dirname, '..');
const outPath = path.join(root, '.ai/maps/changelog.json');

// Keyword heuristic, checked in this order (first match wins):
//   major — removal/rename/breaking-sounding language
//   patch — fix-sounding language
//   minor — addition-sounding language
//   (fallback) — anything matching none of the above (docs, refactors, reorganizing, ...) is
//   also patch — the user wants every commit landing in one of the three real buckets, no "other".
type Bump = 'major' | 'minor' | 'patch';
const MAJOR_RE = /\b(remove|removed|removing|delete|deleted|drop|dropped|break|breaking|rename|renamed)\b/i;
const PATCH_RE = /\b(fix|fixed|fixes|bug|correct|corrected|resolve|resolved)\b/i;
const MINOR_RE = /\b(add|added|adding|create|created|introduce|introduced|new)\b/i;
// Newer commits do use conventional prefixes; when one is present it wins over the keywords
// (`feat!:` used to land in patch because "publish under the @helixds scope" has no keyword).
const CONVENTIONAL_RE = /^([a-z]+)(\([^)]*\))?(!)?:/;
// Without a prefix, the subject's FIRST word says what the commit mainly did. A keyword later in
// the sentence is usually a side note: "Fix Figma-link spacing; drop the dash" is a fix, not a
// removal. Only when the first word is no known verb ("Chip s is 24px (xs removed)") do the
// keyword scans below decide.
const LEADING_VERB: Record<string, Bump> = Object.fromEntries([
  ...['remove', 'delete', 'drop', 'rename', 'break'].map(v => [v, 'major'] as const),
  ...['add', 'create', 'introduce', 'implement', 'support', 'wire', 'show', 'translate'].map(v => [v, 'minor'] as const),
  ...['fix', 'correct', 'resolve', 'restore', 'update', 'fill', 'document', 'tighten', 'simplify', 'unify',
    'split', 'fold', 'restructure', 'rework', 'rewrite', 'refactor', 'move', 'polish', 'refine', 'tweak',
    'clean', 'align', 'adjust', 'improve', 'verify', 'regenerate'].map(v => [v, 'patch'] as const),
]);

function classify(subject: string): Bump {
  const conv = subject.match(CONVENTIONAL_RE);
  if (conv?.[3] || /BREAKING CHANGE/.test(subject)) return 'major';
  if (conv?.[1] === 'feat') return 'minor';
  if (conv?.[1] === 'fix') return 'patch';
  if (conv) return 'patch'; // chore:/docs:/eval:/… — housekeeping, whatever words follow
  const leading = LEADING_VERB[subject.match(/^[A-Za-z]+/)?.[0].toLowerCase() ?? ''];
  if (leading) return leading;
  if (MAJOR_RE.test(subject)) return 'major';
  if (PATCH_RE.test(subject)) return 'patch';
  if (MINOR_RE.test(subject)) return 'minor';
  return 'patch';
}

// Normalizes `git remote get-url origin` (HTTPS or SSH form) into a plain
// `https://github.com/{owner}/{repo}` base the Changelog page can append `/commit/{hash}` to.
// Returns null if there's no `origin` remote, or it isn't a github.com remote — the page just
// renders hashes as plain text in that case, no broken links.
function getGithubRepoUrl(): string | null {
  let remote: string;
  try {
    remote = execSync('git remote get-url origin', { cwd: root, encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
  const sshMatch = remote.match(/^git@github\.com:(.+?)(\.git)?$/);
  if (sshMatch) return `https://github.com/${sshMatch[1]}`;
  const httpsMatch = remote.match(/^https:\/\/github\.com\/(.+?)(\.git)?$/);
  if (httpsMatch) return `https://github.com/${httpsMatch[1]}`;
  return null;
}

// %x1f asks git itself to insert the ASCII unit-separator byte (0x1F) — resolved by git, not the
// shell, so there's no shell-escaping risk from embedding a raw control character in the command.
const FIELD_SEP = '%x1f';
const format = ['%H', '%ad', '%s', '%an'].join(FIELD_SEP);

const raw = execSync(
  'git log --pretty=format:' + format + ' --date=format:%Y-%m-%d',
  { cwd: root, encoding: 'utf-8', maxBuffer: 1024 * 1024 * 16 },
).trim();

type Commit = { hash: string; subject: string; author: string; bump: Bump };
type Day = { date: string; commits: Commit[] };

const days: Day[] = [];
const byDate = new Map<string, Commit[]>();

if (raw.length > 0) {
  for (const line of raw.split('\n')) {
    const [hash, date, subject, author] = line.split('\x1f');
    if (!hash || !date || !subject) continue;
    // Bookkeeping commits from the old auto-commit hook — not changes anyone made.
    if (subject.startsWith('Regenerate changelog')) continue;
    if (!byDate.has(date)) {
      byDate.set(date, []);
      days.push({ date, commits: byDate.get(date)! });
    }
    byDate.get(date)!.push({
      hash: hash.slice(0, 7),
      subject,
      author: author ?? 'unknown',
      bump: classify(subject),
    });
  }
}

const allCommits = days.flatMap(d => d.commits);
const bumpCounts = {
  major: allCommits.filter(c => c.bump === 'major').length,
  minor: allCommits.filter(c => c.bump === 'minor').length,
  patch: allCommits.filter(c => c.bump === 'patch').length,
};

const changelog = {
  $comment: 'Generated by scripts/generate-changelog.ts — do not hand-edit. Run `pnpm docs:changelog` to regenerate.',
  generatedAt: new Date().toISOString(),
  commitCount: allCommits.length,
  bumpCounts,
  repoUrl: getGithubRepoUrl(),
  days,
};

const nextJson = JSON.stringify(changelog, null, 2) + '\n';
const prevJson = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf-8') : null;

const strip = (s: string) => s.replace(/"generatedAt": "[^"]*",\n/, '');
const changed = prevJson === null || strip(prevJson) !== strip(nextJson);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, nextJson);

console.log(
  changed
    ? '✅ .ai/maps/changelog.json regenerated — ' + changelog.commitCount + ' commits across ' + days.length + ' day(s)'
    : '✅ .ai/maps/changelog.json already matches — ' + changelog.commitCount + ' commits across ' + days.length + ' day(s)',
);

// --md: also write CHANGELOG.md at the repo root — the agent-readable twin of the JSON above.
// Unlike the JSON it IS tracked. .husky/post-commit runs this with --head-pending and amends the
// regenerated file into the commit that was just made, so every commit carries its own entry and
// the tree is never left dirty. Agents and audit tools look for a root CHANGELOG.md with
// "## <version>" headings; breaking changes come first because that is what someone (or
// something) migrating code needs.
if (process.argv.includes('--md')) {
  const mdPath = path.join(root, 'CHANGELOG.md');
  const version = JSON.parse(fs.readFileSync(path.join(root, 'packages/core/package.json'), 'utf-8')).version;
  // --head-pending: HEAD is about to be amended (new hash), so its current hash would be a dead link.
  // It gets its real hash on the next regeneration, once it is no longer HEAD.
  const pendingHash = process.argv.includes('--head-pending') ? days[0]?.commits[0]?.hash : undefined;
  const link = (c: Commit) =>
    c.hash === pendingHash ? 'latest commit'
    : changelog.repoUrl ? `[\`${c.hash}\`](${changelog.repoUrl}/commit/${c.hash})` : `\`${c.hash}\``;
  const line = (d: Day, c: Commit) => `- ${d.date} — ${c.subject} (${link(c)})`;
  const section = (title: string, bump: Bump) => {
    const lines = days.flatMap(d => d.commits.filter(c => c.bump === bump).map(c => line(d, c)));
    return lines.length ? [`### ${title}`, '', ...lines, ''] : [];
  };
  const md = [
    '# Changelog',
    '',
    '<!-- Generated by scripts/generate-changelog.ts --md from git log — do not hand-edit. Updated automatically on every commit (.husky/post-commit). -->',
    '',
    'All notable changes to Helix DS. Entries come from commit subjects; the breaking/added/changed',
    'split is a heuristic (conventional prefix first, then keywords), not a semver guarantee.',
    '',
    `## [${version}] — unreleased`,
    '',
    ...section('⚠️ Breaking changes', 'major'),
    ...section('Added', 'minor'),
    ...section('Changed & fixed', 'patch'),
  ].join('\n');
  fs.writeFileSync(mdPath, md);
  console.log('✅ CHANGELOG.md written — ' + bumpCounts.major + ' breaking, ' + bumpCounts.minor + ' added, ' + bumpCounts.patch + ' changed/fixed');
}
