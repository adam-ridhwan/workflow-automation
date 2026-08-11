---
name: javascript-conventions
description: JavaScript/TypeScript style conventions for this codebase — no `void` operator on promises, fire-and-forget calls stay bare, blank line between switch case arms, name event params `e` not `event`, no nested ternaries. Use when writing or reviewing any TypeScript code.
---

# Promises

- Never prefix a call with the `void` operator to discard a promise.
  Fire-and-forget calls are written bare:

```ts
// ❌ void runWorkflow();
// ❌ void instance.setCenter(x, y, options);
runWorkflow();
instance.setCenter(x, y, options);
```

- If the result or completion matters, `await` it (or chain `.then`) —
  otherwise just call it. There is no lint rule here that requires marking
  ignored promises, so `void` is pure noise.

# Switch statements

- Separate every `case` arm with a blank line, including before `default`,
  so the arms read as distinct blocks:

```ts
switch (spec?.node_info.node_type) {
  case 'TEXT_INPUT':
    output = String(getArgumentValue(node, 'text_input') ?? '');
    break;

  case 'FILE_INPUT':
    output = String(getArgumentValue(node, 'content') ?? '');
    break;

  case 'WEBHOOK':
    output = String(getArgumentValue(node, 'payload') ?? '');
    break;

  case 'LLM':
    output = await runLlmNode(node, input);
    break;

  default:
    // Output nodes (and unknown nodes) pass their input through.
    break;
}
```

# Event handlers

- Name the event parameter `e`, never `event` — an `id-denylist` lint rule
  enforces this (`event` also shadows the deprecated global `event`). Applies to
  every handler, React or DOM:

```ts
// ❌ onChange={(event) => setName(event.target.value)}
// ❌ function handleSubmit(event: React.FormEvent<HTMLFormElement>) {}
onChange={(e) => setName(e.target.value)}
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {}
```

- Only the *name* is banned. Longer identifiers (`DragStartEvent`,
  `activatorEvent`, `PointerEvent`) and `"event"` inside a data payload/string
  are untouched.

# Ternaries

- No nested ternaries — a `no-nested-ternary` lint rule forbids a ternary in
  another ternary's branches (including `a ? b : c ? d : e` chains). Use
  `if`/`else`, an early return, or a small helper/lookup instead. A single,
  non-nested ternary is fine.

```ts
// ❌ const phase = local ? 'idle' : scheduled ? 'scheduled' : 'running';
let phase = 'running';
if (local) {
  phase = 'idle';
} else if (scheduled) {
  phase = 'scheduled';
}
```
