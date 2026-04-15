# AppBuilder IJewel 3D

## Project origin

This repository is a **fork** of [AppBuilderSdk](https://github.com/shapediver/AppBuilderSdk) (`git@github.com:shapediver/AppBuilderSdk.git`). It is a **client-specific customization** built on top of that upstream codebase.

The directory `src/shared` is a **Git submodule** pointing at [AppBuilderShared](https://github.com/shapediver/AppBuilderShared) (`git@github.com:shapediver/AppBuilderShared.git`).

## Unused / excluded functionality

The following upstream-related pieces are **not used** in this project:

- Packages under `@shapediver/viewer.features.*`
- The **WebGI** package (`webgi`)

Agents and contributors should not assume those dependencies or features are available unless explicitly reintroduced.

## Language

All **code comments** and **project documentation** (Markdown in this repo, design notes, and similar) must be written in **English**.

## Git workflow

- **Branches:** Create work for each task on a branch named `task/SS-{task_number}-{task_name}` (replace `{task_number}` and `{task_name}` with the real values; use a short, kebab-case task name).
- **Commits:** Use messages in the form `SS-{task_number}: {commit_name}` (a concise description after the colon).
- **Pull requests:** The user creates pull requests. Do not open PRs unless explicitly asked.
