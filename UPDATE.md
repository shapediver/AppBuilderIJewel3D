# Updating from upstream (AppBuilderSdk)

This project is derived from [shapediver/AppBuilderSdk](https://github.com/shapediver/AppBuilderSdk). Use the `upstream` remote to pull changes from the original repository.

## One-time setup

Add the upstream remote (run once per clone):

```bash
git remote add upstream git@github.com:shapediver/AppBuilderSdk.git
```

Verify remotes:

```bash
git remote -v
```

You should see both `origin` (your fork or copy) and `upstream` (the ShapeDiver repository).

## Fetch upstream

Download the latest branches and commits from upstream:

```bash
git fetch upstream
```

## Merge upstream `development` into your branch

The canonical integration branch in the original project is `development`. Typical workflow:

1. Check out the branch you want to update (for example your main development branch):

   ```bash
   git checkout development
   ```

   Or use your local branch name if it differs.

2. Merge upstream `development` into it:

   ```bash
   git merge upstream/development
   ```

   Alternatively, rebase for a linear history (only if your team agrees on rebasing shared branches):

   ```bash
   git rebase upstream/development
   ```

3. Resolve any merge conflicts, run tests, then push to your `origin` when ready:

   ```bash
   git push origin development
   ```

## Summary

| Step | Command |
|------|---------|
| Add upstream (once) | `git remote add upstream git@github.com:shapediver/AppBuilderSdk.git` |
| Refresh refs | `git fetch upstream` |
| Integrate changes | `git merge upstream/development` (on your target branch) |

Repeat `git fetch upstream` and merge (or rebase) whenever you want to sync with the latest upstream `development` branch.
