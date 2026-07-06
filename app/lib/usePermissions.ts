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
  const permissionsBootstrapped = useAppSelector(
    (s) => s.auth.permissionsBootstrapped
  );
  const permissionRole = useAppSelector((s) => s.auth.permissionRole);
  const user = useAppSelector((s) => s.auth.user);

  const can = (key: PermissionModule, action: PermissionAction): boolean =>
    hasPermission(permissions, key, action);

  const canView = (key: string): boolean => can(key, "view");
  const canCreate = (key: string): boolean => can(key, "create");
  const canUpdate = (key: string): boolean => can(key, "update");
  const canDelete = (key: string): boolean => can(key, "delete");
  const canApprove = (key: string): boolean => can(key, "approve");

  const canAny = (
    checks: Array<{ module?: PermissionModule; key?: string; action: PermissionAction }>
  ): boolean => hasAnyPermission(permissions, checks);

  const canAll = (
    checks: Array<{ module?: PermissionModule; key?: string; action: PermissionAction }>
  ): boolean => hasAllPermissions(permissions, checks);

  return {
    can,
    canView,
    canCreate,
    canUpdate,
    canDelete,
    canApprove,
    canAny,
    canAll,
    role: permissionRole || user?.role,
    user,
    permissions,
    permissionsBootstrapped,
  };
}
