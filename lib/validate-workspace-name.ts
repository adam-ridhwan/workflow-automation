export const WORKSPACE_NAME_REQUIREMENTS =
  'Workspace name can only contain letters, numbers, and spaces.';

/** Validates an already-slugified workspace name. */
export function validateWorkspaceName(name: string): boolean {
  return /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/.test(name);
}
