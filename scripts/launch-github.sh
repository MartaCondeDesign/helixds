#!/usr/bin/env bash
# Launch day, GitHub side — docs/launch-checklist.md step 2. Makes the repository public and turns on
# what a private repo on the free plan can't have: GitHub Pages (Storybook), branch protection on main
# and private vulnerability reporting. Idempotent: safe to run again.
#
#   scripts/launch-github.sh            asks before making the repo public
#   scripts/launch-github.sh --yes      no question (the repo becomes public immediately)
set -euo pipefail
REPO=MartaCondeDesign/helixds

visibility=$(gh api "repos/$REPO" -q .visibility)
if [ "$visibility" != "public" ]; then
  if [ "${1:-}" != "--yes" ]; then
    read -r -p "Make $REPO PUBLIC now? Anyone will see the code and its whole history. [y/N] " answer
    [ "$answer" = "y" ] || [ "$answer" = "Y" ] || { echo "Nothing changed."; exit 1; }
  fi
  gh repo edit "$REPO" --visibility public --accept-visibility-change-consequences
  echo "✓ $REPO is public"
else
  echo "✓ $REPO is already public"
fi

# Storybook on GitHub Pages, built by .github/workflows/storybook.yml.
if gh api "repos/$REPO/pages" >/dev/null 2>&1; then
  gh api -X PUT "repos/$REPO/pages" -f build_type=workflow >/dev/null
else
  gh api -X POST "repos/$REPO/pages" -f build_type=workflow >/dev/null
fi
echo "✓ Pages source: GitHub Actions"

# main: CI's `checks` job must pass (needs the changelog GitHub App, docs/github-app.md — otherwise the
# Changelog workflow's own commit leaves each PR's head without a result), no force pushes, no deletion. No required review: the maintainer is the only code
# owner and GitHub doesn't let anyone approve their own PR — CODEOWNERS still requests her review on
# outside contributors' PRs, which they can't merge anyway. enforce_admins=false keeps an admin bypass.
gh api -X PUT "repos/$REPO/branches/main/protection" --input - >/dev/null <<'JSON'
{
  "required_status_checks": { "strict": false, "contexts": ["checks"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
echo "✓ main protected: CI required, no force push or deletion (admins can bypass)"

# SECURITY.md points reporters at GitHub's private advisory form.
gh api -X PUT "repos/$REPO/private-vulnerability-reporting" >/dev/null
echo "✓ Private vulnerability reporting on"

gh workflow run storybook.yml --repo "$REPO" >/dev/null
echo "✓ Storybook deploy started → https://martacondedesign.github.io/helixds/ (ready in ~3 min)"
