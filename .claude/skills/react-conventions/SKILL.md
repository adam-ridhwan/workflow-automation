---
name: react-conventions
description: React component structure conventions for this codebase — one component per file, props naming, export style, and where util files live. Use when creating or refactoring any React component or utility file.
---

# Components

- Maximum one JSX component per file. Helper components (list items, panel
  sections, previews) get their own file next to the parent — never defined
  inline in the same file.
- Declare components as `export function Component() {}` — no arrow-function
  consts, no default exports.
- Name the props type `{Component}Props` and declare it in the same file,
  above the component:

```tsx
type WorkflowCanvasProps = {
  canvas: WorkflowCanvasData;
};

export function WorkflowCanvas({ canvas }: WorkflowCanvasProps) {
  ...
}
```

# Type imports

- Anything imported only as a type must use `import type`, never a plain
  `import`:

```tsx
import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node, NodeProps } from '@xyflow/react';
```

- Don't mix values and types in one statement — pull types into their own
  `import type` line (prettier sorts them into the separate types group at
  the bottom of the imports).

# Util files

- A utility used by a single route segment lives in a `_lib/` directory
  inside that segment (alongside its `_components/`), e.g.
  `app/(app)/[workspaceName]/workflow/[workflowId]/_lib/`.
- A utility shared by multiple routes goes in the main `lib/` directory at
  the project root (home of `lib/cn.ts`).
- One utility (or one tight group of related helpers) per file, named
  kebab-case after what it does, e.g. `_lib/snap-center-to-cursor.ts`.
