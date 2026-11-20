# This is not AppBuilderSdk

GitHub origin is **[AppBuilderWebGI](https://github.com/shapediver/AppBuilderWebGI)**. Local folder is `AppBuilderIJewel3D`. It is a **host fork** of AppBuilderSdk that renders with **iJewel3D / Pixotronics WebGI**.

|                      | This repo                                  | Sibling `../AppBuilderSdk`          |
| -------------------- | ------------------------------------------ | ----------------------------------- |
| Origin               | `shapediver/AppBuilderWebGI`               | `shapediver/AppBuilderSdk`          |
| Upstream remote      | `upstream` → AppBuilderSdk                 | (is upstream)                       |
| Viewport             | WebGI (`webgi` + `src/webgi/`)             | `@shapediver/viewer.viewport`       |
| Deploy               | `v1/ijewel3d`                              | `v1/main`                           |
| Entries              | `index.html` → `AppBuilderRoot.tsx` only   | also `example.html`, `library.html` |
| `tsconfig` `include` | `src/AppBuilderRoot.tsx` (entry + imports) | all of `src`                        |
| E2E                  | **none**                                   | Playwright smoke/visual/API specs   |

Do **not** copy SDK `AppBuilderRoot` wiring (anchors, AR/camera/fullscreen, drawing/gumball/selection UI, attribute visualization, scene tree, interaction slot listeners). Those need `@shapediver/viewer.features.*` and `@shapediver/viewer.viewport`, which this host **does not depend on**. Wiring details: `.agents/rules/ijewel-host.md`.

## Where to change what

- **Host-only:** `src/webgi/**`, `src/AppBuilderRoot.tsx`, `src/AppBuilderBase.tsx` (session → WebGI scene), `@webgi` alias, `webgi` / `@types/webgi` in `package.json`, Vite `ijewel3d` chunk, publish scripts `v1/ijewel3d`. Host code is not FSD.
- **Shared:** `src/shared/**` is consumed by SDK and other hosts. No `webgi` imports. No iJewel-only hacks. Do not shrink parameter/appbuilder barrels; the host uses **deep imports**. Prefer additive shared APIs.
- **Root repo** records the host app, `public/`, Jest mocks in `tests/jest/`, and the submodule pointer.

## Host capabilities (intentional gaps)

No ShapeDiver AR, selection/hover/drag/gumball/drawing UI, attribute visualization, or HTML viewport anchors. DRAWING and INTERACTION parameters are stubbed as `ParameterStringComponent`.

Materials: Grasshopper **material name** → iJewel static DB (`src/webgi/utils/staticMaterialDatabase.ts`) then dynamic `MaterialDatabase` output. See README.
