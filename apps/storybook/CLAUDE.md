# Helix Storybook — Agent Contract

Storybook is the living, always-in-sync reference for every Helix token and component. See the root
`CLAUDE.md` for the token/component contract itself — this file covers Storybook-specific structure rules.

## Every story starts with a title + description — no exceptions

**Every `*.stories.tsx` story's rendered output must open with a `StoryHeader`** (title + description),
before any other content. This applies to every story in the app — Foundation, Components, Patterns,
Pages, everything — not just the Foundation token stories it was first built for.

```tsx
import { StoryHeader } from '../_shared/StoryHeader'; // path relative to the story file's location

export const MyStory: Story = {
  render: () => (
    <div>
      <StoryHeader title="Section — Thing" description="One sentence: what this shows and why it matters." />
      {/* ...the actual story content... */}
    </div>
  ),
};
```

- **Import `StoryHeader` from `apps/storybook/stories/_shared/StoryHeader.tsx`** — it's app-wide, not
  Foundation-specific, even though Foundation was the first place it was used.
- **Title format**: `"{Group} — {Specific}"` for Foundation stories (e.g. `"Primitives — Spacing"`,
  `"Semantic — Radius"`) so the header itself communicates which layer you're looking at, mirroring the
  4-collection structure in Figma. For Component/Pattern stories, use the component or pattern name
  directly (e.g. `"Button"`, `"Empty State"`).
- **Description**: one or two sentences — what the story shows and why it matters, not a restatement of
  the title. Reuse existing `parameters.docs.description.story` text where one already exists rather than
  writing a second, different description — and remove the now-redundant `parameters.docs.description`
  entry once the visible header carries the same text, so there's one source of truth, not two.
- **Typography/spacing is fixed, do not improvise it** — `StoryHeader` matches the *actual rendered*
  Component "Docs" page (confirmed against the live Badge docs page): title `32px` / **regular (400),
  not bold** / margin-bottom `16px`; description `16px` / `400` / margin-bottom `24px`. Note this is
  **not** the same as `@storybook/blocks`' theoretical default `Title`/`Subtitle` spec (which is
  `700`/`20px` in the package source in isolation) — something in the cascade (Helix's own CSS, loaded
  into the same docs iframe) changes what actually renders, so match the live page, not the package
  source, if the two ever disagree again. This makes a component's autodocs page and any hand-built
  story's Canvas view look like the same design system, not two different ones. If you need a visually
  different header for a specific story, that's a sign the content doesn't belong in `StoryHeader` —
  don't fork its styling inline.

**Why this exists:** before this rule, `Foundation.stories.tsx`'s sections had no visible header at all —
just token content, with any explanation buried in `parameters.docs.description.story` (only visible in
the separate "Docs" tab, never in "Canvas" view, which is what most people actually look at first).

## Token-driven stories must read from `tokens.json`, not hardcode a list

See `packages/tokens/CLAUDE.md` → "Adding a token" step 6. Where a story enumerates tokens (a color table,
a spacing scale, a list of radii…), prefer importing `tokens.json` directly
(`import tokensJson from '../../../../packages/tokens/src/tokens.json'` — path depth varies by file
location; `resolveJsonModule` is already enabled in `tsconfig.json`) over a hardcoded array of keys.
A derived list picks up a token addition/rename/removal, and its `$description`, on the next build with
zero story edits. `packages/tokens/dist/index.ts` is **not** the right import for this — it only holds
resolved values, dropping both the alias path (`$value`) and `$description`; import from `src/tokens.json`
when you need either of those, from `dist/index.ts` only when you need a plain resolved value at runtime.

## Foundation story structure

`apps/storybook/stories/Foundation/` mirrors the 4-collection structure of the live Figma file, not a
flat list of token categories:

- `Primitives.stories.tsx` — raw, role-agnostic scales. Never what components actually bind to.
- `Semantic.stories.tsx` — the tokens components actually consume. Shows `$description` for every token.
- `Theme.stories.tsx` — semantic color only, with a working light/dark toggle
  (`document.documentElement.setAttribute('data-theme', ...)`, matching the `:root[data-theme="dark"]`
  selector `packages/tokens/src/build.ts` actually emits).
- `TextStyles.stories.tsx` — the named `{role} / {size} / {weight}` combinations mirroring Figma's Text
  Styles.
- `_shared.tsx` — helpers local to Foundation (`SectionHead`, `SpacingBar`, `DescCaption`, `TokenLeaf`).
  Not a `*.stories.tsx` file, so Storybook's glob doesn't pick it up as its own story.

A token category that exists in both `primitive.*` and `semantic.*` (color, spacing, shadow, motion) gets
a section in both files. A category with no primitive layer (radius) or no semantic layer at time of
writing gets a short explanatory note in the file where it's missing, rather than silently having no entry
at all — see `Primitives.stories.tsx`'s `Radius` story for the pattern.
