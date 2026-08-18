# Workflow Automation

A visual, node-based **AI workflow automation builder**. Assemble workflows on a
drag-and-drop canvas by wiring together **Input → Model (LLM) → Output** nodes;
the backend executes the graph in topological order, calling LLM providers
(Anthropic Claude by default, plus OpenAI and DeepSeek) at each Model node and
passing text between nodes.

Workflows live inside **workspaces** and **folders**, can be run manually, on a
**cron schedule**, via an inbound **webhook**, or **chained** into one another —
and each workflow can be fronted by a custom drag-and-drop **Page**: a mini-app UI
whose inputs and outputs bind to the workflow's nodes and can be published at a
standalone URL.

> Built on **Next.js (App Router)** + **Convex** (database, functions, auth,
> scheduling, file storage) with a **React Flow** canvas.

---

## Features

| Area                     | What it does                                                                                                                                                                                                 | Route                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| **Workspaces**           | Multi-tenant workspaces with members and roles (owner / editor / viewer). Overview dashboard with run stats and a runs-over-time chart.                                                                      | `/workspace/[workspaceId]`                                          |
| **Folders**              | Nested organization, scoped per resource kind (`workflow` / `file` / `page`), with drag-and-drop.                                                                                                            | —                                                                   |
| **Workflow canvas**      | Visual node editor (React Flow) with a node palette, auto-layout (Dagre), undo/redo, client-side validation, and version history (auto / manual / restored snapshots).                                       | `/workspace/[workspaceId]/workflow/[workflowId]/canvas`             |
| **Nodes**                | **Input:** Text, File (picks a workspace file), Webhook. **Model:** LLM (provider + model + prompt/system + max tokens). **Output:** File, Display, Log.                                                     | see `lib/node-specs.ts`                                             |
| **Runs & history**       | Live per-node run state streamed onto the canvas as it executes, plus a permanent snapshot per run. Runs can be stopped mid-flight.                                                                          | `/workspace/[workspaceId]/workflow/[workflowId]/run-history/[id]`   |
| **AI / LLM nodes**       | Prompt templating substitutes `{{text_input}}`, `{{file}}`, `{{webhook}}`, `{{input}}` tokens with upstream node outputs, then calls the provider.                                                           | `convex/runWorkflow.ts`                                             |
| **Pages (page builder)** | Free-positioned drag-and-drop UI (inputs, button, output, text/heading/image, etc.) bound to a single workflow's input/output nodes. Fill inputs + press the button to run. Publishable at a standalone URL. | `/workspace/[workspaceId]/page/[pageId]` · published: `/p/[pageId]` |
| **Files**                | Chunked uploads reassembled in Convex storage with a status pipeline (`uploading → assembling → processing → indexed`). Feed `FILE_INPUT` nodes and produced by `FILE_OUTPUT` nodes.                         | `/workspace/[workspaceId]/files`                                    |
| **Schedules (cron)**     | Per-workflow cron + IANA timezone. A single every-minute Convex cron dispatches all due schedules.                                                                                                           | `/workspace/[workspaceId]/schedules`                                |
| **Templates**            | Ready-to-run starter workflows: Summarize text, Translate to French, Sentiment analysis, Draft & refine, CSV → JSON, Extract action items.                                                                   | `lib/workflow-templates.ts`                                         |
| **Secrets**              | Per-workspace, AES-256-GCM encrypted API keys (only name + last-4 exposed).                                                                                                                                  | `/workspace/[workspaceId]/settings`                                 |
| **Auth**                 | Email/password + Google sign-in, one account per email.                                                                                                                                                      | `/signin` · `/signup`                                               |

### How a run works

`convex/runWorkflow.ts` walks the canvas DAG in topological order:

1. **Input** nodes produce their configured value (text, a file's contents, or a
   webhook payload).
2. **Model** nodes join their upstream outputs, substitute `{{…}}` tokens into the
   prompt/system text, and call the selected provider (default
   `anthropic` / `claude-sonnet-5`).
3. **Output** nodes display, log, or write a file back into the workspace.

Per-node status and output are streamed to the live `runs` document so the canvas
lights up as it executes. **Triggers:** manual, rerun, inbound webhook
(`POST /webhooks/<token>`), cron schedule, or chain (one workflow queues others).

LLM API keys are resolved from **per-workspace encrypted secrets** first, falling
back to a Convex-deployment env var of the same name.

---

## Tech stack

- **Framework:** Next.js `16.2.12` (App Router), React `19.2.4`
- **Backend / DB / auth:** Convex `^1.42.3`, `@convex-dev/auth` (Password + Google)
- **Canvas & layout:** `@xyflow/react` (React Flow), `@dagrejs/dagre`
- **Drag & drop:** `@dnd-kit/core` (node palette + page builder)
- **UI:** `@base-ui/react`, shadcn components (`components/ui/`), Tailwind CSS v4,
  `lucide-react`, `next-themes` (dark mode)
- **AI:** `@anthropic-ai/sdk` (default) and `openai` (OpenAI + DeepSeek-compatible)
- **State:** `zustand` (canvas + page stores)
- **Also:** `recharts` (charts), `react-markdown` + `remark-gfm` (output),
  `react-day-picker` + `date-fns` + `cron-parser` (schedules)
- **Tooling:** TypeScript, ESLint 9, Prettier
- **Package manager:** **pnpm** (`pnpm-lock.yaml`)

---

## Getting started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/)
- A [Convex](https://convex.dev) account (the `convex dev` CLI provisions a dev
  deployment for you)

### 1. Install

```bash
pnpm install
```

### 2. Start Convex (backend) and Next.js (frontend)

You need **two processes** running side by side. Convex is not part of the
`dev` script, so run it separately:

```bash
# Terminal 1 — Convex backend, codegen, and function watcher
npx convex dev

# Terminal 2 — Next.js frontend
pnpm dev
```

The app runs at **http://localhost:3000**.

The first `npx convex dev` will prompt you to log in and create/select a
deployment, then write your local Convex vars into `.env.local`:

```
CONVEX_DEPLOYMENT=...
NEXT_PUBLIC_CONVEX_URL=...
NEXT_PUBLIC_CONVEX_SITE_URL=...
```

### 3. Configure deployment environment variables

These live in the **Convex deployment** (set with `npx convex env set KEY value`),
not in `.env.local`:

| Variable                                                    | Purpose                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`                     | Google OAuth sign-in (optional — email/password works without it)                                                              |
| `SECRETS_KEY`                                               | AES-256-GCM master key used to encrypt workspace secrets (required to store LLM keys)                                          |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `DEEPSEEK_API_KEY` | Optional deployment-level fallback LLM keys. Normally provided **per workspace** via **Settings → Secrets** in the UI instead. |

`CONVEX_SITE_URL` is set automatically by the Convex deployment and is read by
`convex/auth.config.ts`.

### 4. Add an LLM key and build something

Sign up, create a workspace, open **Settings → Secrets** and add an
`ANTHROPIC_API_KEY` (or use a workflow template to start), then open the workflow
canvas and run it.

---

## Project structure

```
app/
  (auth)/                      Sign in / sign up
  (app)/create-workspace/      Workspace creation
  (app)/workspace/[workspaceId]/
    page.tsx                   Overview dashboard (stats + runs chart)
    workflows/ · workflow/[workflowId]/   Workflow list + canvas editor, run history
    pages/ · page/[pageId]/    Page list + drag-and-drop page builder
    files/ · file/[fileId]/    File manager + single-file view
    schedules/                 Cron schedules calendar
    _components/ _hooks/ _lib/  Shared workspace UI (sidebar, tables, dnd)
  (settings)/workspace/[workspaceId]/settings/   Members + secrets
  (published)/p/[pageId]/      Standalone published page view
convex/                        Convex backend (schema, queries, mutations, actions, crons, http)
  _generated/  model/          Codegen + secretCrypto helper
components/  ui/                Shared React + shadcn/base-ui primitives, theme, Convex provider
lib/                           Helpers: node-specs, workflow-templates, cron, provider-secrets, cn
proxy.ts                       Convex-auth middleware + bare-id → /p/[pageId] rewrite
```

---

## Convex backend

### Tables (`convex/schema.ts`)

| Table               | Represents                                                                  |
| ------------------- | --------------------------------------------------------------------------- |
| `users`             | Account profile (name, email, avatar)                                       |
| `workspaces`        | Top-level tenant, owned by a user                                           |
| `workspaceMembers`  | Membership + role (`editor` / `viewer`)                                     |
| `folders`           | Nested organization, `kind` = workflow / file / page                        |
| `workflows`         | Canvas (nodes/edges), publish flag, webhook token, chain targets, run stats |
| `workflowVersions`  | Canvas snapshots for version history                                        |
| `runs`              | Latest live run per workflow (per-node status/output), streamed to clients  |
| `runHistory`        | One permanent record per run (snapshot, status, trigger, timings)           |
| `workflowSchedules` | Per-workflow cron + timezone + next-run time                                |
| `workspaceSecrets`  | AES-256-GCM encrypted API keys (name + last-4 only)                         |
| `pages`             | Page-builder layout bound to a workflow                                     |
| `files`             | Uploaded files with chunked-upload status pipeline                          |

### Notable function files

- **`workflows.ts`** — workflow CRUD, publish, duplicate, canvas save, webhook token, chaining
- **`runWorkflow.ts`** — the executor (`executeCanvas`): topological run, node handlers, LLM calls, prompt token substitution, chaining
- **`runs.ts` / `runHistory.ts`** — live run state and permanent history
- **`pages.ts` / `pageLayout.ts`** — page CRUD + published view; page layout validators
- **`canvas.ts`** — Convex validators/types for the workflow canvas (shared by schema, runner, UI)
- **`files.ts`** — chunked upload assembly, run read/write helpers
- **`folders.ts` / `workspaces.ts`** — folder + workspace CRUD and auth gates
- **`schedules.ts` / `scheduleDispatch.ts` / `crons.ts`** — cron storage, due-schedule dispatch, the every-minute cron
- **`http.ts`** — auth routes + `POST /webhooks/<token>` inbound webhook
- **`secrets.ts` / `model/secretCrypto.ts`** — workspace secret CRUD + AES-256-GCM crypto
- **`overview.ts`** — dashboard aggregate stats + daily runs time-series
- **`auth.ts` / `auth.config.ts`** — Convex Auth (Password + Google)

---

## Scripts

| Command                             | Description                                            |
| ----------------------------------- | ------------------------------------------------------ |
| `pnpm dev`                          | Next.js dev server (run `npx convex dev` alongside it) |
| `pnpm build`                        | Production build                                       |
| `pnpm start`                        | Serve the production build                             |
| `pnpm lint`                         | ESLint                                                 |
| `pnpm lint:fix`                     | ESLint `--fix` + Prettier write                        |
| `pnpm format` / `pnpm format:check` | Prettier write / check                                 |

---

## Deployment

Configured for Vercel (`vercel.json`). The build command deploys the Convex
backend and then builds Next.js:

```bash
npx convex deploy --cmd 'npm run build'
```

Set the deployment environment variables above in both the Convex production
deployment and your Vercel project.

---

## Notes

- **This is a modified Next.js.** Per `AGENTS.md`, APIs and file conventions may
  differ from upstream — middleware lives in `proxy.ts` (not `middleware.ts`), and
  the app uses parallel routes (`@breadcrumb`, `@headerActions`). Consult
  `node_modules/next/dist/docs/` before relying on stock Next.js behavior.
- **Models available:** Anthropic (`claude-sonnet-5`, `claude-haiku-4-5`,
  `claude-opus-4-8`, `claude-fable-5`), OpenAI (`gpt-4o`, `gpt-4o-mini`, `o1`),
  and DeepSeek (`deepseek-chat`, `deepseek-reasoner`).
