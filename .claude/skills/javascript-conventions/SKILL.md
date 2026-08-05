---
name: javascript-conventions
description: JavaScript/TypeScript style conventions for this codebase — no `void` operator on promises, fire-and-forget calls stay bare. Use when writing or reviewing any TypeScript code.
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
