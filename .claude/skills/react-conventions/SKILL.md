---
name: react-conventions
description: React component structure conventions for this codebase — one component per file, props naming, export style, where util files live, and blank line between switch case arms. Use when creating or refactoring any React component or utility file.
---

# Components

- Maximum one JSX component per file. Helper components (list items, panel
  sections, previews) get their own file next to the parent — never defined
  inline in the same file.
- Declare components as `export function Component() {}` — no arrow-function
  consts, no default exports.
- Component names (and their kebab-case file names) start with the feature,
  then the component's role: `arguments-panel.tsx` (`ArgumentsPanel`),
  `arguments-panel-body.tsx` (`ArgumentsPanelBody`),
  `arguments-panel-footer.tsx` (`ArgumentsPanelFooter`) — never role-only
  names like `panel-body.tsx` or `PanelBody`. When a feature spans several
  files, group them in a directory named after the feature
  (`_components/arguments-panel/`).
- Exception inside a feature directory: variant sub-components may drop the
  feature prefix and use `{variant}-{role}.tsx`, since the directory carries
  the feature context — e.g. `arguments-panel/text-field.tsx` (`TextField`),
  `boolean-field.tsx` (`BooleanField`), `select-field.tsx` (`SelectField`).
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

# Store selectors

- A variable holding a store selection is named exactly after the selected
  property — never prefixed or renamed:

```tsx
// ❌ const storeOnConnect = useCanvasStore((s) => s.onConnect);
const onConnect = useCanvasStore((s) => s.onConnect);
```

- If a local wrapper around the selected value is needed (binding args,
  adding logic), the wrapper takes a different name (`handleConnect`) and
  the selector keeps the property name.

# UI elements

- Interactive/styled UI is built from the shadcn components in
  `@/components/ui/` — never from native HTML elements. `<button>` →
  `<Button>`, `<input>` → `<Input>`, `<select>` → `<Select>`, `<label>` →
  `<Label>`, `<hr>` → `<Separator>`, `<table>` → `<Table>`, container
  panels → `<Card>`, status pills / chips / tags → `<Badge>`.
- This applies to styled divs/spans too: if the markup reproduces what an
  existing shadcn component renders (a pill, a card, a separator), compose
  that component with className overrides instead of rebuilding it.
- If the needed component isn't in `components/ui/` yet, add it with
  `pnpm dlx shadcn@latest add <name>` instead of hand-rolling a native
  element.
- Plain non-interactive layout wrappers (`div`, `span`, semantic tags like
  `nav`/`main`) are fine.
- To render a shadcn component as another element (e.g. a Button that is a
  link), use the Base UI `render` prop, not a bare `<a>`/`<Link>` styled by
  hand: `<Button render={<Link href=... />} nativeButton={false}>`.

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

# Switch statements

- Separate every `case` arm with a blank line, including before `default` —
  this applies to the render/dispatch switches inside components (e.g. a
  field `renderControl`), not just plain modules:

```tsx
switch (argument.argument_type) {
  case 'NUMBER':
    return <NumberField {...fieldProps} />;

  case 'BOOLEAN':
    return <BooleanField {...fieldProps} />;

  case 'TEXT':
    return <TextField {...fieldProps} />;

  default:
    return <div>Not implemented</div>;
}
```

# Util files

- A utility used by a single route segment lives in a `_lib/` directory
  inside that segment (alongside its `_components/`), e.g.
  `app/(app)/[workspaceName]/workflow/[workflowId]/_lib/`.
- A utility shared by multiple routes goes in the main `lib/` directory at
  the project root (home of `lib/cn.ts`).
- One utility (or one tight group of related helpers) per file, named
  kebab-case after what it does, e.g. `_lib/snap-center-to-cursor.ts`.
