---
name: merge-upstream
description: Merge shapediver/AppBuilderSdk upstream/development into AppBuilderIJewel3D, dropping SDK-only pieces (e2e, ShapeDiver viewport UI, extra entries) and keeping the WebGI host. Use when asked to sync, update or merge from upstream.
---

# Merge upstream AppBuilderSdk into IJewel3D

1. Start from a clean tree on `development` (or the branch the user names). Run `git fetch upstream`.
2. Run `git merge upstream/development`. Don't rebase shared branches.
3. Delete the incoming SDK-only files (this host has no e2e tests and one entry, `index.html`):
    - `tests/`, except `tests/jest/` (Jest mocks)
    - `playwright.config.ts`, `scripts/deploy-e2e.ts`, `scripts/pick-coords.ts`, `example.html`, `library.html`
    - `.github/workflows/playwright-shards.yml`, `full-tests.yml`, and the e2e steps in development/staging/release/task-branch-release
    - `.cursor/rules/e2e-playwright.mdc`, `.cursor/rules/appbuilder-sdk.mdc`, `.claude/rules/e2e-playwright.md`
    - `.claude/skills/browser-diagnosis/` (diagnoses the ShapeDiver viewport; this host uses `.cursor/rules/browser-diagnosis.mdc`)
4. In `package.json`, drop the `test-e2e*` and `postinstall` scripts, `@playwright/test`, `@shapediver/viewer.viewport` and `@shapediver/viewer.features.*`. Keep `webgi`, `@types/webgi` and the `v1/ijewel3d` script targets.
5. Keep this repo's version of:
    - `CLAUDE.md`, `tsconfig.json` (`include: ["src/AppBuilderRoot.tsx"]`), the Vite `ijewel3d` chunk
    - `src/AppBuilderRoot.tsx` and `src/AppBuilderBase.tsx`: don't take the SDK registrations that `.cursor/rules/ijewel-host.mdc` lists under "Omit"
    - `.cursor/rules/ijewel-*.mdc`, `.cursor/rules/git-and-checks.mdc`, `.claude/rules/ijewel-host.md`
6. Take upstream's shared rules and skills unchanged: `.claude/rules/*` (except the files above), `.claude/skills/custom-component`, `.claude/skills/fsd-migrate`, `.claude/settings.json`.
7. Run `git submodule update` so `src/shared` matches the merged pointer.
8. Verify: `pnpm install`, `pnpm run build`, `pnpm test`.
9. Don't commit or push unless asked. Suggested message: `Merge upstream/development into development`.
