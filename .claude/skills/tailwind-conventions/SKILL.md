---
name: tailwind-conventions
description: Tailwind CSS conventions for this codebase — design tokens, spacing scale, class ordering, cn() usage, dark mode, and when to extract components. Use when writing or reviewing any component with Tailwind classes.
---

This project uses Tailwind v4 (CSS-first config in `app/globals.css`) with
shadcn base-nova components.

# Design tokens

- Scale values only: `p-4`, not `p-[17px]`. If an arbitrary pixel value has
  a canonical utility, use it (`h-[52px]` → `h-13`, `w-[224px]` → `w-56`).
- Colors come from theme tokens, never hex/oklch literals in classes:
  `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `text-foreground`,
  `text-muted-foreground`, `border-border`, `ring-ring`, `bg-destructive`.
- If a value genuinely isn't in the scale, extend the theme in
  `app/globals.css` under `@theme` instead of scattering arbitrary values.

# Class ordering

Don't hand-order. `prettier-plugin-tailwindcss` (with
`prettier-plugin-classnames` wrapping long strings) owns ordering —
`pnpm run format` after edits and accept its output.

# Conditional classes

Use `cn()` from `@/lib/cn` (clsx + tailwind-merge). Never build class
strings with template literals or string concatenation.

```tsx
<div className={cn('rounded-md px-2', isActive && 'bg-accent', className)} />
```

# Extraction

Same class string repeated more than twice → extract a component (or a
module-level `const xxxClass` within the file). Never `@apply` — it is not
used anywhere in this codebase.

# Dark mode

Class strategy (`.dark` on `<html>` via next-themes). Style with theme
tokens first — they flip automatically and most components need zero
`dark:` variants. Reach for `dark:` only when the two modes genuinely need
different treatment (e.g. `dark:bg-input/30` on form controls).

# Off-limits

- Arbitrary values when a scale value exists.
- Inline `style` props, except values computed at runtime (drag transforms,
  measured positions).
- The `!` important suffix, except to override third-party stylesheets
  (e.g. React Flow's `.react-flow__handle`) — never to fight our own CSS.
- Custom CSS files; everything goes through Tailwind or `app/globals.css`.

# Example

```tsx
// ❌ Wrong: arbitrary values, hex color, template-literal conditional
<div
  className={`h-[52px] w-[224px] rounded-[6px] bg-[#18181b] ${active ? 'ring-1' : ''}`}
/>

// ✅ Right: scale values, theme tokens, cn()
<div className={cn('bg-card h-13 w-56 rounded-md', active && 'ring-1')} />
```
