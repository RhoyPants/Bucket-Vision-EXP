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

export type PagePermissionAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "approve";

export type PermissionAction =
  | PagePermissionAction
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "EXPORT";

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
  | "TEAM_MANAGEMENT"
  | "VERSIONING"
  | string;

export interface PagePermission {
  key: string;
  name: string;
  path: string;
  canView: 0 | 1 | boolean;
  canCreate: 0 | 1 | boolean;
  canUpdate: 0 | 1 | boolean;
  canDelete: 0 | 1 | boolean;
  canApprove?: 0 | 1 | boolean;
}

export type PermissionMap = Record<string, PagePermission>;
export type Permissions = PermissionMap;

const legacyModuleKeyMap: Record<string, string> = {
  PROJECTS: "projects",
  USERS: "settings_users",
  SCOPE: "project_setup",
  TASK: "task_board",
  SUBTASK: "task_board",
  REPORTS: "reports",
  APPROVAL: "my_approvals",
  DASHBOARD: "personal_dashboard",
  SETTINGS: "settings",
  SPRINT_MANAGEMENT: "sprint_management",
  TEAM_OVERVIEW: "team_overview",
  TEAM_MANAGEMENT: "team_management",
  VERSIONING: "versioning",
};

const actionKeyMap: Record<string, keyof PagePermission | null> = {
  view: "canView",
  read: "canView",
  READ: "canView",
  create: "canCreate",
  CREATE: "canCreate",
  update: "canUpdate",
  UPDATE: "canUpdate",
  delete: "canDelete",
  DELETE: "canDelete",
  approve: "canApprove",
  APPROVE: "canApprove",
  REJECT: "canApprove",
  EXPORT: "canView",
};

const isEnabled = (value: unknown): boolean =>
  value === 1 || value === true || value === "1";

const impliedActionKeys: Partial<Record<keyof PagePermission, Array<keyof PagePermission>>> = {
  canView: ["canView", "canCreate", "canUpdate", "canDelete"],
  canCreate: ["canCreate", "canUpdate", "canDelete"],
  canUpdate: ["canUpdate", "canDelete"],
  canDelete: ["canDelete"],
  canApprove: ["canApprove"],
};

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
  const permissionKey = legacyModuleKeyMap[module] || module;
  const actionKey = actionKeyMap[action];

  if (!actionKey) return false;

  const permission = permissions?.[permissionKey];
  const keysToCheck = impliedActionKeys[actionKey] || [actionKey];

  return keysToCheck.some((key) => isEnabled(permission?.[key]));
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
  checks: Array<{ module?: PermissionModule; key?: string; action: PermissionAction }>
): boolean {
  return checks.some(({ module, key, action }) =>
    hasPermission(permissions, key || module || "", action)
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
  checks: Array<{ module?: PermissionModule; key?: string; action: PermissionAction }>
): boolean {
  return checks.every(({ module, key, action }) =>
    hasPermission(permissions, key || module || "", action)
  );
}

export function normalizePermissions(
  pages: PagePermission[] | PermissionMap | null | undefined
): PermissionMap {
  if (!pages) return {};

  if (Array.isArray(pages)) {
    return pages.reduce<PermissionMap>((acc, page) => {
      if (page?.key) acc[page.key] = page;
      return acc;
    }, {});
  }

  return pages;
}
