/**
 * permission.ts
 *
 * Core permission utility functions.
 * These are PURE functions — no React, no Redux dependency.
 * They receive permissions as a plain object and return boolean.
 *
 * Comes directly from backend `auth/me` response:
 * permissions: { "PROJECTS": ["READ", "CREATE", "DELETE"], ... }
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type PermissionModule =
  | "PROJECTS"
  | "USERS"
  | "SCOPE"
  | "TASK"
  | "SUBTASK"
  | "REPORTS"
  | "APPROVAL"
  | "DASHBOARD"
  | "SETTINGS"
  | "SPRINT_MANAGEMENT"
  | "TEAM_OVERVIEW"
  | "VERSIONING";

export type PermissionAction =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "EXPORT";

export type Permissions = Record<string, string[]>;

// ─── Core Helpers ─────────────────────────────────────────────────────────────

/**
 * Check if a single module+action pair is permitted.
 *
 * @example
 * hasPermission(permissions, "PROJECTS", "DELETE") // false if not in list
 */
export function hasPermission(
  permissions: Permissions | null | undefined,
  module: PermissionModule,
  action: PermissionAction
): boolean {
  return permissions?.[module]?.includes(action) ?? false;
}

/**
 * Check if at least ONE of the given pairs is permitted (OR logic).
 *
 * @example
 * hasAnyPermission(permissions, [
 *   { module: "PROJECTS", action: "READ" },
 *   { module: "REPORTS", action: "READ" }
 * ])
 */
export function hasAnyPermission(
  permissions: Permissions | null | undefined,
  checks: Array<{ module: PermissionModule; action: PermissionAction }>
): boolean {
  return checks.some(({ module, action }) =>
    hasPermission(permissions, module, action)
  );
}

/**
 * Check if ALL of the given pairs are permitted (AND logic).
 *
 * @example
 * hasAllPermissions(permissions, [
 *   { module: "PROJECTS", action: "UPDATE" },
 *   { module: "APPROVAL", action: "APPROVE" }
 * ])
 */
export function hasAllPermissions(
  permissions: Permissions | null | undefined,
  checks: Array<{ module: PermissionModule; action: PermissionAction }>
): boolean {
  return checks.every(({ module, action }) =>
    hasPermission(permissions, module, action)
  );
}
