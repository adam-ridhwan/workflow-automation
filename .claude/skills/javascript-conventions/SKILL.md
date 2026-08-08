---
name: javascript-conventions
description: JavaScript/TypeScript style conventions for this codebase — no `void` operator on promises, fire-and-forget calls stay bare, blank line between switch case arms. Use when writing or reviewing any TypeScript code.
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
