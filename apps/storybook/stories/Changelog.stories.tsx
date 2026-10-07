import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import { IconSearch, IconCalendar } from '@tabler/icons-react';
import { Badge, Input, MultiSelect, Select } from '@helixds/react';
import type { BadgeVariant } from '@helixds/react';
import { StoryHeader } from './_shared/StoryHeader';
import changelog from '../../../.ai/maps/changelog.json';

const meta: Meta = {
  title: 'Changelog',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Every commit on this branch, generated from `git log` — nothing here is hand-written.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

type Bump = 'major' | 'minor' | 'patch';

// Badge variant for each bump's per-commit label. The bump filter is a MultiSelect — Chip has no
// selected state (see Chip.json), so it can't be a toggleable filter.
const BUMP_META: Record<Bump, { label: string; variant: BadgeVariant }> = {
  major: { label: 'Major', variant: 'danger' },
  minor: { label: 'Minor', variant: 'warning' },
  patch: { label: 'Patch', variant: 'info' },
};

const ALL_AUTHORS = 'all-authors';

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!)).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

function ChangelogPage() {
  const [query, setQuery] = useState('');
  const [bumpFilter, setBumpFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState(''); // '' = all dates, native <input type="date"> semantics
  const [authorFilter, setAuthorFilter] = useState(ALL_AUTHORS);

  const authors = useMemo(() => {
    const set = new Set<string>();
    changelog.days.forEach(day => day.commits.forEach(c => set.add(c.author)));
    return [...set].sort();
  }, []);

  const authorOptions = [
    { value: ALL_AUTHORS, label: 'All contributors' },
    ...authors.map(a => ({ value: a, label: a })),
  ];

  const q = query.trim().toLowerCase();
  const filteredDays = changelog.days
    .filter(day => dateFilter === '' || day.date === dateFilter)
    .map(day => ({
      ...day,
      commits: day.commits.filter(c =>
        (bumpFilter.length === 0 || bumpFilter.includes(c.bump))
        && (authorFilter === ALL_AUTHORS || c.author === authorFilter)
        && (q === '' || c.subject.toLowerCase().includes(q) || c.hash.includes(q)),
      ),
    }))
    .filter(day => day.commits.length > 0);

  const resultCount = filteredDays.reduce((n, d) => n + d.commits.length, 0);

  return (
    <div>
      <StoryHeader
        title="Changelog"
        description={`Generated from ${changelog.commitCount} commits across ${changelog.days.length} day${changelog.days.length === 1 ? '' : 's'} on this branch. Rebuilt from git automatically after every commit, so it is always current.`}
      />

      <p style={{
        margin: '0 0 var(--helix-spacing-s)',
        fontSize: 'var(--helix-textStyle-caption-regular-fontSize)',
        color: 'var(--helix-color-text-neutral-lightest)',
      }}>
        Major/Minor/Patch is a keyword guess from the commit message, not a real semver signal —
        this repo doesn't use conventional-commit prefixes. Filter by it with the change-type menu below.
      </p>

      {/* Filter bar: search, date, contributor and change type in one row, separated from the
          commit list by a bottom border. */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--helix-spacing-m)', flexWrap: 'wrap',
        marginBottom: 'var(--helix-spacing-xl)', paddingBottom: 'var(--helix-spacing-m)',
        borderBottom: '1px solid var(--helix-color-border-neutral-light)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--helix-spacing-xs)', flexWrap: 'wrap' }}>
          <div style={{ width: 260 }}>
            <Input
              label="Search"
              hideLabel
              icon={IconSearch}
              placeholder="Search by word or hash…"
              size="m"
              fullWidth
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          <div style={{ width: 170 }} className="changelog-date-input">
            {/* Hides the browser's own native calendar-picker-indicator icon (WebKit/Blink-only
                pseudo-element, not stylable via a token/prop) so the Tabler IconCalendar on the
                left is the only calendar icon shown — the native indicator still opens the picker
                on click, just invisible. Scoped to this one input, not a global style. */}
            <style>{`
              .changelog-date-input input[type="date"]::-webkit-calendar-picker-indicator {
                opacity: 0;
              }
            `}</style>
            <Input
              label="Date"
              hideLabel
              type="date"
              icon={IconCalendar}
              size="m"
              fullWidth
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>

          <div style={{ width: 200 }}>
            <Select
              label="Contributor"
              hideLabel
              options={authorOptions}
              value={authorFilter}
              onChange={setAuthorFilter}
            />
          </div>

          <div style={{ width: 240 }}>
            <MultiSelect
              label="Change type"
              hideLabel
              placeholder="All change types"
              options={(Object.keys(BUMP_META) as Bump[]).map(bump => ({ value: bump, label: `${BUMP_META[bump].label} (${changelog.bumpCounts[bump]})` }))}
              value={bumpFilter}
              onChange={setBumpFilter}
              fullWidth
            />
          </div>
        </div>
      </div>

      {resultCount === 0 ? (
        <p style={{
          fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)',
          color: 'var(--helix-color-text-neutral-light)',
        }}>
          No commits match these filters.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--helix-spacing-xl)' }}>
          {filteredDays.map(day => (
            <section key={day.date}>
              <h2 style={{
                margin: 0,
                marginBottom: 'var(--helix-spacing-s)',
                fontSize: 'var(--helix-textStyle-caption-semibold-fontSize)',
                fontWeight: 'var(--helix-textStyle-caption-semibold-fontWeight)',
                color: 'var(--helix-color-text-neutral-lightest)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {formatDate(day.date)}
              </h2>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {day.commits.map(commit => (
                  <li
                    key={commit.hash}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--helix-spacing-s)',
                      padding: 'var(--helix-spacing-xs) 0',
                      borderBottom: '1px solid var(--helix-color-border-neutral-light)',
                    }}
                  >
                    <Badge variant={BUMP_META[commit.bump as Bump].variant} label={BUMP_META[commit.bump as Bump].label} />
                    {changelog.repoUrl ? (
                      <a
                        href={`${changelog.repoUrl}/commit/${commit.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`View ${commit.hash} on GitHub`}
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 'var(--helix-textStyle-caption-regular-fontSize)',
                          color: 'var(--helix-color-text-neutral-lightest)',
                          flexShrink: 0,
                          textDecoration: 'underline',
                        }}
                      >
                        {commit.hash}
                      </a>
                    ) : (
                      <code style={{
                        fontFamily: 'monospace',
                        fontSize: 'var(--helix-textStyle-caption-regular-fontSize)',
                        color: 'var(--helix-color-text-neutral-lightest)',
                        flexShrink: 0,
                      }}>
                        {commit.hash}
                      </code>
                    )}
                    <span style={{
                      fontSize: 'var(--helix-textStyle-body-s-regular-fontSize)',
                      fontWeight: 'var(--helix-textStyle-body-s-regular-fontWeight)',
                      color: 'var(--helix-color-text-neutral)',
                      flex: 1,
                    }}>
                      {commit.subject}
                    </span>
                    <span style={{
                      fontSize: 'var(--helix-textStyle-caption-regular-fontSize)',
                      color: 'var(--helix-color-text-neutral-lightest)',
                      flexShrink: 0,
                    }}>
                      {commit.author}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export const Overview: Story = {
  render: () => <ChangelogPage />,
};
