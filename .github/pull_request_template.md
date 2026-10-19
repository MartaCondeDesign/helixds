## What and why

<!-- One concern per PR. Link the issue it closes: "Closes #123". -->

## How it was checked

<!-- Commands you ran, stories you looked at. Screenshots in light AND dark for anything visual. -->

## Checklist

- [ ] Read the contract of every component this touches (`contracts/components/`)
- [ ] Colors, radii and spacing use `--helix-*` tokens only
- [ ] `pnpm a11y all <Name>` passes for a new or changed component (light and dark)
- [ ] Added a changeset (`pnpm changeset`) if a published `@helixds/*` package changes
- [ ] Tokens, contracts or `prop-map.md` changed → the options considered are in the description
