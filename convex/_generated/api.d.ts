/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as canvas from "../canvas.js";
import type * as crons from "../crons.js";
import type * as files from "../files.js";
import type * as folders from "../folders.js";
import type * as http from "../http.js";
import type * as maintenance from "../maintenance.js";
import type * as model_secretCrypto from "../model/secretCrypto.js";
import type * as overview from "../overview.js";
import type * as runHistory from "../runHistory.js";
import type * as runWorkflow from "../runWorkflow.js";
import type * as runs from "../runs.js";
import type * as scheduleDispatch from "../scheduleDispatch.js";
import type * as schedules from "../schedules.js";
import type * as secrets from "../secrets.js";
import type * as users from "../users.js";
import type * as workflows from "../workflows.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  canvas: typeof canvas;
  crons: typeof crons;
  files: typeof files;
  folders: typeof folders;
  http: typeof http;
  maintenance: typeof maintenance;
  "model/secretCrypto": typeof model_secretCrypto;
  overview: typeof overview;
  runHistory: typeof runHistory;
  runWorkflow: typeof runWorkflow;
  runs: typeof runs;
  scheduleDispatch: typeof scheduleDispatch;
  schedules: typeof schedules;
  secrets: typeof secrets;
  users: typeof users;
  workflows: typeof workflows;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
