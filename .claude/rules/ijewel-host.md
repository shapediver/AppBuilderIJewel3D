---
paths:
    - "src/AppBuilderRoot.tsx"
    - "src/AppBuilderBase.tsx"
    - "src/webgi/**/*"
    - "**/entities/parameter/**"
    - "**/*[Ii]nteraction*"
---

Before changing files that match these paths, read `.cursor/rules/ijewel-host.mdc`. It is the master copy, shared with Cursor; edit rules there, not here.

This host does not register the selection/gumball interaction components and stubs those UIs as `ParameterStringComponent`, so the guidance about them in the shared `parameters-and-selection.md` doesn't apply here (see `.cursor/rules/parameters-and-selection.mdc`).
