---
name: merge-upstream
description: Merge shapediver/AppBuilderSdk upstream/development into this repo, dropping SDK-only pieces (e2e, ShapeDiver viewport UI, extra entries) and keeping the WebGI host. Use when asked to sync, update or merge from upstream.
---

# Merge upstream AppBuilderSdk into IJewel3D

1. Start from a clean tree on `development` (or the branch the user names). Run `git fetch origin upstream` and fast-forward to `origin/development`. In `src/shared`, fetch and fast-forward `development` to `origin/development` (`git -C src/shared ...`). Stop and report if either can't fast-forward.
2. Run `git -c merge.directoryRenames=false merge upstream/development`. Without the flag, git's rename detection can move this repo's own `.agents/` files into upstream folders. Don't rebase shared branches.
3. Delete the incoming SDK-only files (this host has no e2e tests and one entry, `index.html`):
    - `tests/`, except `tests/jest/` (Jest mocks)
    - `playwright.config.ts`, `scripts/deploy-e2e.ts`, `scripts/pick-coords.ts`, `example.html`, `library.html`
    - `.github/workflows/playwright-shards.yml`, `full-tests.yml`, and the e2e steps in development/staging/release/task-branch-release
    - `.agents/rules/e2e-playwright.md`
    - Upstream's `.agents/skills/browser-diagnosis/` changes: it diagnoses the ShapeDiver viewport. Keep this repo's WebGI version.
4. In `package.json`, drop the `test-e2e*` and `postinstall` scripts, `@playwright/test`, `@shapediver/viewer.viewport` and `@shapediver/viewer.features.*`. Take upstream's version bumps for the viewer packages this host keeps. Keep `webgi`, `@types/webgi` and the `v1/ijewel3d` script targets. Resolve `pnpm-lock.yaml` by taking this repo's version and running `pnpm install`.
5. Keep this repo's version of:
    - `AGENTS.md`, `CLAUDE.md`, `tsconfig.json` (`include: ["src/AppBuilderRoot.tsx"]`), the Vite `ijewel3d` chunk
    - `src/AppBuilderRoot.tsx` and `src/AppBuilderBase.tsx`: don't take the SDK registrations that `.agents/rules/ijewel-host.md` lists under "Omit"
    - `.agents/rules/ijewel-*.md`, `.agents/skills/browser-diagnosis/`, `.agents/skills/merge-upstream/`
    - `scripts/agents/setup-worktree.mjs` and `.worktreeinclude`: merge upstream's logic changes, keep this host's session text and comments
6. Take upstream's shared rules and skills unchanged: `.agents/rules/*` (except the files above), `.agents/skills/custom-component`, `.agents/skills/fsd-migrate`, and the hook adapters `.claude/settings.json`, `.cursor/hooks.json`, `.cursor/worktrees.json`, `.codex/hooks.json`.
7. Update `AGENTS.md`: diff upstream's `AGENTS.md` (`git diff <merge-base> upstream/development -- AGENTS.md`) and copy new or changed lines of the "Skills" and "Topic rules" lists, and of shared sections (Line endings, Checks, Agent config), into this repo's `AGENTS.md`. Skip lines for files step 3 deletes.
8. Resolve the `src/shared` pointer to the commit from step 1 and run `git submodule update` so `src/shared` matches it.
9. Verify: `pnpm install`, `pnpm run build`, `pnpm test`.
10. Don't commit or push unless asked. Suggested message: `Merge upstream/development into development`.
