/**
 * usePermissions.ts
 *
 * React hook — reads permissions from Redux and exposes `can()`, `canAny()`, `canAll()`.
 *
 * Usage:
 *   const { can, canAny, role } = usePermissions();
 *   {can("PROJECTS", "DELETE") && <DeleteButton />}
 */

"use client";

import { useAppSelector } from "@/app/redux/hook";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  PermissionModule,
  PermissionAction,
} from "./permission";

export function usePermissions() {
  const permissions = useAppSelector((s) => s.auth.permissions);
  const user = useAppSelector((s) => s.auth.user);

  /**
   * Check single permission.
   * Returns false automatically if module or action is absent.
   *
   * @example can("PROJECTS", "DELETE")
   */
  const can = (module: PermissionModule, action: PermissionAction): boolean =>
    hasPermission(permissions, module, action);

  /**
   * Returns true if user has AT LEAST ONE of the given permissions.
   *
   * @example
   * canAny([
   *   { module: "PROJECTS", action: "READ" },
   *   { module: "APPROVAL", action: "READ" },
   * ])
   */
  const canAny = (
    checks: Array<{ module: PermissionModule; action: PermissionAction }>
  ): boolean => hasAnyPermission(permissions, checks);

  /**
   * Returns true only if user has ALL of the given permissions.
   *
   * @example
   * canAll([
   *   { module: "PROJECTS", action: "UPDATE" },
   *   { module: "APPROVAL", action: "APPROVE" },
   * ])
   */
  const canAll = (
    checks: Array<{ module: PermissionModule; action: PermissionAction }>
  ): boolean => hasAllPermissions(permissions, checks);

  return {
    can,
    canAny,
    canAll,
    role: user?.role,
    user,
    permissions,
  };
}
