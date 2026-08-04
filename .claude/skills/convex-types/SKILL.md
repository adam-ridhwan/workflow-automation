---
name: convex-types
description: How to import Convex-derived types — never re-export them from app-level type files. Use when writing or reviewing TypeScript that imports types from convex/ or adds types to a _types folder.
---

Types inferred from Convex validators (`Infer<typeof ...>`, `Doc<...>`,
`Id<...>`) have exactly one home: the `convex/` module that defines them
(e.g. `WorkflowCanvasData` in `@/convex/canvas`, `Id` from
`@/convex/_generated/dataModel`).

# Rules

- Import Convex types directly from their `convex/` source at every use
  site. Do not re-export them from `_types/index.ts` or any other app-level
  barrel — a second import path for the same type hides where it comes from
  and drifts from the validator that defines it.
- `_types/` folders are for frontend-only types (node specs, UI props,
  registry shapes) that have no Convex counterpart.
- Never hand-write a duplicate of a Convex type in the frontend. If the
  shape is wrong or incomplete, change the validator in `convex/` — the
  type follows.

# Example

```text
❌ Wrong — _types/index.ts re-exporting a Convex type:
    import type { WorkflowCanvasData } from '@/convex/canvas';
    export type { WorkflowCanvasData };
and a consumer importing it with the real origin hidden:
    import type { WorkflowCanvasData } from '../_types';

✅ Right — every consumer imports from the source:
    import type { WorkflowCanvasData } from '@/convex/canvas';
```
