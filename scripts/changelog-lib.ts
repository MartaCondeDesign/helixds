/** Shared by scripts/generate-changelog.ts and its test (scripts/storybook-tokens.test.ts). */

/** A squash-merged PR lists the commits it folded in as `* subject` lines in its body (GitHub's default
 * squash message) — those are the changes it carries, shown under its subject instead of being lost.
 * The Changelog workflow's own "Update CHANGELOG.md for #n" commits are bookkeeping, not a change. */
export function squashedChanges(body: string): string[] {
  return body.split('\n').filter(line => line.startsWith('* ')).map(line => line.slice(2).trim())
    .filter(change => change && !change.startsWith('Update CHANGELOG.md for #'));
}
