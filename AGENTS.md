# AppBuilder IJewel 3D

This is the **iJewel3D / WebGI host** of ShapeDiver App Builder (GitHub: [AppBuilderWebGI](https://github.com/shapediver/AppBuilderWebGI)), not the main [AppBuilderSdk](https://github.com/shapediver/AppBuilderSdk) product.

- **Upstream:** `upstream` remote → AppBuilderSdk. Merge SDK releases; keep host-specific code out of the shared submodule.
- **Shared:** `src/shared` is a Git submodule → [AppBuilderShared](https://github.com/shapediver/AppBuilderShared). Same library as SDK. Use `git -C src/shared ...`.
- **Renderer:** Pixotronics **WebGI** (`webgi` package, host code in `src/webgi/`). Session still uses `@shapediver/viewer.session`.
- **Tests:** Jest in `src/shared` only (`tests/jest/` holds mocks). **No e2e.**

## Unused on this host

Do not add or assume these **ShapeDiver viewer** packages unless the product explicitly gains them:

- `@shapediver/viewer.viewport`
- `@shapediver/viewer.features.*` (drawing, interaction, transformation-tools, attribute-visualization)

They exist in **shared source** for other hosts. This app stubs DRAWING/INTERACTION UI and omits AR, anchors, attribute visualization, and scene-tree widgets. Import shared modules via **concrete file paths**, never parameter/appbuilder barrels, so those optional packages are not pulled into the host bundle.

**WebGI is used** — do not treat `webgi` as unused.

## Language

All **code comments** and **project documentation** must be written in **English**.

## Git workflow

- **Branches:** `task/SS-{task_number}` or `task/SS-{task_number}-{kebab-name}`.
- **Commits:** `SS-{task_number}: {commit_name}`.
- **Pull requests:** The user creates pull requests. Do not open PRs unless explicitly asked.

Durable agent context lives in `.cursor/rules/` (`ijewel-repo`, `ijewel-host`, `git-and-checks`, `worktree-shared-repo`). Update those files when you learn facts that should persist.
