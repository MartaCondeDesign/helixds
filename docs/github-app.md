# The changelog GitHub App

`main` requires CI's `checks` job to pass on a pull request's latest commit. The Changelog workflow
(`.github/workflows/changelog.yml`) adds a commit to every pull request (its CHANGELOG.md entry), and that
commit becomes the latest one. If the workflow pushes it with its own `GITHUB_TOKEN`, GitHub holds the CI run
it triggers for approval, so the pull request never gets a `checks` result and can't be merged.

A push made with a **GitHub App's** token triggers CI normally. That's all this app is for: it can write to
this one repository, and the Changelog workflow uses it to push the CHANGELOG.md commit. Set it up once.

> **Status:** set up on 2026-10-22 — app `helix-changelog`, installed on this repository only, with Contents
> read/write and Pull requests read-only. Both secrets are in the repository.

## 1. Create the app (github.com, 2 min)

Go to **https://github.com/settings/apps/new** and fill in:

| Field | Value |
|---|---|
| GitHub App name | `helix-changelog` (any free name) |
| Homepage URL | `https://github.com/MartaCondeDesign/helixds` |
| Webhook → Active | **unchecked** |
| Repository permissions → Contents | **Read and write** |
| Repository permissions → Pull requests | **Read-only** |
| Where can this GitHub App be installed? | **Only on this account** |

Click **Create GitHub App**. On the page that opens:

- Note the **App ID** (a number near the top).
- Scroll to **Private keys** → **Generate a private key**. A `.pem` file downloads.

## 2. Install it on the repository

In the app's left menu, **Install App** → **Install** next to your account → **Only select repositories** →
`helixds` → **Install**.

## 3. Save its two secrets (terminal, 1 min)

From the repository folder:

```bash
gh secret set CHANGELOG_APP_ID --repo MartaCondeDesign/helixds --body "<the App ID>"
gh secret set CHANGELOG_APP_KEY --repo MartaCondeDesign/helixds < ~/Downloads/<the-file>.pem
```

Then delete the `.pem` file from Downloads: GitHub keeps the secret encrypted, and nothing else needs it.

## 4. Check

Open any pull request (or push to one). The Changelog workflow's commit should get a green `checks` run
without anyone approving it. From then on `main` can require CI:

```bash
scripts/launch-github.sh   # the protection part is idempotent; it only re-applies the settings
```

If the secrets are missing or the key is revoked, the workflow falls back to `GITHUB_TOKEN` and prints a
warning: pull requests then wait for someone to approve the held CI run.
