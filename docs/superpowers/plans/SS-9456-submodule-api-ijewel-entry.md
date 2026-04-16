# SS-9456: Submodule public API and IJewel entry mapping

> **Full implementation plan:** [2026-04-15-SS-9456-shared-exports-and-narrow-imports.md](./2026-04-15-SS-9456-shared-exports-and-narrow-imports.md) (direct imports off public barrels; no slim `core.ts` barrel).

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Optional follow-up: use `superpowers:subagent-driven-development` or `superpowers:executing-plans` for task-by-task execution.

**Goal:** Keep IJewel’s main entry free of optional `@shapediver/viewer.features.*` bundles while ensuring `src/shared` (AppBuilderShared submodule) changes do not break other applications that depend on the same public exports.

**Architecture:** Heavy UI for drawing and interaction is **not** registered in `AppBuilderRoot.tsx`; `PARAMETER_TYPE.DRAWING` and `PARAMETER_TYPE.INTERACTION` use `ParameterStringComponent` as intentional stubs. The host avoids pulling optional bundles by importing parameter UI from **concrete module paths** (e.g. `entities/parameter/ui/ParameterStringComponent`), **not** from the `entities/parameter` or `entities/parameter/ui` barrel indexes. Full components stay in shared for consumers that add the matching dependencies and wire them in **their** entry. Barrel files are **not** removed—backward compatibility for other apps; FSD “public API only” rules may be relaxed later in favor of deep imports where the bundle boundary requires it.

**Tech stack:** React, Vite, TypeScript, `@shapediver/viewer.session`, AppBuilderShared under `src/shared`.

---

## File map

| Area | Role |
|------|------|
| `src/AppBuilderRoot.tsx` | Host `IComponentContext`: stubs + **direct** imports to `.../parameter/ui/<Component>` (not barrel indexes). |
| `src/shared/entities/parameter/model/index.ts` | Public barrel for parameter model hooks/utilities. |
| `src/shared/entities/parameter/ui/index.ts` | Public barrel for parameter UI components. |
| `src/shared/features/appbuilder/model/index.ts` | Public barrel for appbuilder model hooks. |

---

### Task 1: Confirm IJewel entry stubs and imports

**Files:**

- Read / modify: `src/AppBuilderRoot.tsx`

- [ ] **Step 1:** Verify `parameters[PARAMETER_TYPE.DRAWING]` uses `ParameterStringComponent` (not `ParameterDrawingComponent` or related).

- [ ] **Step 2:** Verify `parameters[PARAMETER_TYPE.INTERACTION]` sub-keys (`selection`, `gumball`, `dragging`, `rectangleTransform`) all use `ParameterStringComponent`.

- [ ] **Step 3:** Confirm there are **no** top-level imports from `ParameterDrawingComponent`, `ParameterSelectionComponent`, `ParameterGumballComponent`, `ParameterDraggingComponent`, or `ParameterRectangleTransformComponent`.

- [ ] **Step 4:** Import each needed parameter UI component from its **file path** (e.g. `@AppBuilderLib/entities/parameter/ui/ParameterStringComponent`), not from `~/shared/entities/parameter` or `.../parameter/ui` index barrels.

**Expected:** Stubs only; no heavy parameter components; no barrel imports on the hot path.

---

### Task 2: Submodule barrels — do not shrink the public API casually

**Files:**

- Modify only when needed for fixes, not drive-by cleanup:  
  - `src/shared/entities/parameter/model/index.ts`  
  - `src/shared/entities/parameter/ui/index.ts`  
  - `src/shared/features/appbuilder/model/index.ts`

- [ ] **Step 1:** When changing barrels, prefer **additive** exports. Avoid removing `export * from "./<slice>"` or named exports that downstream apps may import, unless you add a deprecation note and migration path in the submodule changelog or release notes.

- [ ] **Step 2:** Consumers that need a smaller bundle should use **deep imports** to concrete modules and **host-level** mapping (Task 1), not removal of symbols from shared barrels. Do **not** introduce a separate slim barrel file (e.g. `core.ts`)—see the full plan linked above.

---

### Task 3: Consumer applications (outside this repo)

- [ ] **Document for integrators:** Apps that need full drawing/gumball/rectangle UI must (1) declare the corresponding `@shapediver/viewer.features.*` packages in **their** `package.json` with versions aligned to `@shapediver/viewer.session`, and (2) register the real shared components in **their** `AppBuilderRoot` (or equivalent) `IComponentContext`. Apps **without** those packages should import from **concrete paths** under `entities/parameter/...` where needed to avoid pulling optional code through barrel indexes.

---

### Task 4: Verification (this repository)

- [ ] **Step 1:** From the repo root, run:

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 2:** If TypeScript reports missing modules under `@shapediver/viewer.features.*`, that reflects **shared** source importing those packages; narrowing **host** imports (Task 1) and internal imports (full plan) reduces what the host resolves. To get a green `tsc` in the host, align with team policy: optional deps, or further narrow imports in shared.

- [ ] **Step 3:** Run a production build when applicable:

```bash
pnpm run build
```

Resolve any errors tied to files changed under SS-9456 only.

---

### Task 5: Commit (when work is ready)

```bash
git add -A
git commit -m "SS-9456: submodule API compatibility and IJewel parameter stubs"
```

Adjust the message if the commit scope is narrower.

---

## Self-check

- **Spec coverage:** IJewel stubs + direct imports + submodule barrel stability + integrator notes; detailed steps in [2026-04-15-SS-9456-shared-exports-and-narrow-imports.md](./2026-04-15-SS-9456-shared-exports-and-narrow-imports.md).
- **Placeholders:** None intentional; optional viewer features / `tsc` policy remains team-dependent.
