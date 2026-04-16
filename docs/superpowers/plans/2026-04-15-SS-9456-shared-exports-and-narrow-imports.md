# SS-9456: Direct imports vs public API barrels — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the IJewel host bundle free of `@shapediver/viewer.features.*` (do not add those packages to this project’s `package.json`) while preserving backward compatibility for other apps: **do not remove** symbols from existing barrel files (`entities/parameter/index.ts`, `entities/parameter/ui/index.ts`, etc.). Where the bundle graph requires it, **replace imports from the public API (barrel `index.ts`) with direct imports** to the underlying module (full file paths under `entities/parameter/...`). That substitution is intentional and preferred over adding a second slim barrel.

**Architecture:** The problem is resolving the **public API** entry (`export *` chains) which pulls slices that depend on `@shapediver/viewer.features.*`. The fix is **changing imports off the public barrel** into **direct imports** to the defining file (UI component, hook, config). No new `core.ts` or other slim re-export file — that would be another public entry to maintain. **FSD public API** (barrel `index.ts` as the only allowed import path) may be relaxed or disabled in the future for this codebase; this plan assumes **deep imports are allowed** where needed for bundle boundaries.

**Tech stack:** React, Vite, TypeScript, `@shapediver/viewer.session`, `src/shared` (AppBuilderShared submodule). Path alias: `@AppBuilderLib/*` → `src/shared/*` (see `tsconfig.json`).

---

## File map

| Path | Role |
|------|------|
| `src/AppBuilderRoot.tsx` | Host `IComponentContext`: stubs + parameter UI imported from **concrete** `.../ui/<Component>.tsx` paths, **not** from `.../parameter/ui` or `.../parameter` index. |
| `src/shared/entities/parameter/index.ts` | Root public barrel — **keep** for external consumers and legacy code. |
| `src/shared/entities/parameter/ui/index.ts` | UI public barrel — **keep** unchanged. |
| `src/shared/entities/parameter/model/index.ts` | Model barrel includes drawing/interaction — prefer **direct** `model/<file>.ts` imports when those slices are not needed. |
| `src/shared/features/appbuilder/model/index.ts` | Same idea: avoid this barrel from the host if it pulls attribute-visualization; use direct file paths if required. |

---

### Task 1: Audit UI modules for viewer.features (reference only)

**Files:** `src/shared/entities/parameter/ui/**/*.{ts,tsx}`

- [ ] **Step 1:** List files that import `@shapediver/viewer.features`:

```bash
rg "@shapediver/viewer\.features" src/shared/entities/parameter/ui --glob "*.{ts,tsx}"
```

- [ ] **Step 2:** When choosing **direct** imports for the host or for refactors, only import from files that are **not** in that list (unless the product feature requires them and the app adds the matching packages).

**Expected:** Mental map of “safe” component files vs feature-heavy files; no new barrel file.

---

### Task 2: Host `AppBuilderRoot.tsx` — stubs and direct imports

**Files:** `src/AppBuilderRoot.tsx`

- [ ] **Step 1:** Ensure `parameters[PARAMETER_TYPE.DRAWING]` and all `parameters[PARAMETER_TYPE.INTERACTION]` sub-keys use `ParameterStringComponent` only.

- [ ] **Step 2:** Import each parameter UI component from its **module file**, for example:

`@AppBuilderLib/entities/parameter/ui/ParameterStringComponent`

not from `@AppBuilderLib/entities/parameter/ui` or `@AppBuilderLib/entities/parameter`.

- [ ] **Step 3:** Remove unused imports (e.g. `ParameterRectangleTransformComponent`) and any import that only served the old barrel path.

- [ ] **Step 4:** Apply the same rule to other imports from shared in this file (e.g. `entities/export`, `features/appbuilder`) if the bundle still pulls viewer.features — use **direct paths** to the files the host actually needs.

**Expected:** No `from ".../entities/parameter/ui"` or `from ".../entities/parameter"` for the hot path; only concrete paths.

---

### Task 3: Narrow imports inside `src/shared` (phased)

**Files:** Any file under `src/shared` that imports from `@AppBuilderLib/entities/parameter` (root) or from sub-barrels unnecessarily.

- [ ] **Step 1:** List call sites:

```bash
rg 'from ["'\'']@AppBuilderLib/entities/parameter["'\'']' src/shared --glob "*.{ts,tsx}"
rg 'from ["'\'']@AppBuilderLib/entities/parameter/ui["'\'']' src/shared --glob "*.{ts,tsx}"
```

- [ ] **Step 2:** Replace with **direct** imports to the defining module:

- Types: `@AppBuilderLib/entities/parameter/config/...`
- Hooks: `@AppBuilderLib/entities/parameter/model/useParameter` (specific file)
- UI: `@AppBuilderLib/entities/parameter/ui/ParameterSliderComponent`

- [ ] **Step 3:** Leave barrel imports in place where the file genuinely needs many symbols from a slice or where refactor risk is high; prioritize hot paths and the host-facing graph first.

- [ ] **Step 4:** After each batch: `pnpm exec tsc --noEmit`; fix cycles with minimal moves (e.g. shared types in `config`).

**Expected:** Fewer public-barrel imports in leaf modules; behavior unchanged.

---

### Task 4: Attribute-visualization / appbuilder model (optional)

**Files:** `src/shared/features/appbuilder/model/**`, host / root import chain.

- [ ] **Step 1:** If the bundle still contains `viewer.features.attribute-visualization`, trace from `AppBuilderRoot` / `AppBuilderBase` with `rg attribute-visualization` and narrow those imports to concrete files.

- [ ] **Step 2:** Do **not** add a slim barrel; only direct imports or architectural splits agreed separately.

---

### Task 5: Verification

- [ ] **Step 1:** `pnpm exec tsc --noEmit`

- [ ] **Step 2:** `pnpm run build`

- [ ] **Step 3:** `rg "viewer\.features" dist --glob "*.{js,css}" || true` — document any remaining hits.

---

### Task 6: Submodule and parent repo commits

- [ ] **Step 1:** Commit shared changes in the **AppBuilderShared** repo (`SS-9456: ...`).

- [ ] **Step 2:** Update submodule pointer and host commits in **AppBuilderIJewel3D**.

---

### Task 7: Integrator note (short)

- [ ] **Step 1:** Document that apps **without** `@shapediver/viewer.features.*` should import parameter UI and hooks via **concrete paths** under `entities/parameter/...`, not only via root `entities/parameter` public API, if they need to avoid pulling optional bundles. Apps with full features can keep using barrels for convenience.

---

## Self-check

- **Spec coverage:** Direct imports (no slim barrel), host stubs, internal narrow imports, verification, commits, integrator note.
- **FSD:** Plan aligns with possibly disabling the “public API only” rule later; deep imports are the intended fix here.

---

## Plan execution handoff

**Plan saved to** `docs/superpowers/plans/2026-04-15-SS-9456-shared-exports-and-narrow-imports.md`.

1. **Subagent-driven (recommended)** — superpowers:subagent-driven-development  
2. **Inline** — superpowers:executing-plans  

**Which approach?** (Choose when starting implementation.)
