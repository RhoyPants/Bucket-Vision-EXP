/**
 * Guard.tsx
 *
 * Wraps any child component and hides it if the user lacks permission.
 * Returns null (nothing rendered) when permission is absent.
 *
 * Usage:
 *   <Guard module="PROJECTS" action="DELETE">
 *     <DeleteButton />
 *   </Guard>
 *
 *   // Show custom fallback instead of hiding:
 *   <Guard module="PROJECTS" action="DELETE" fallback={<NoAccessAlert />}>
 *     <DeleteButton />
 *   </Guard>
 */

"use client";

import React from "react";
import { usePermissions } from "@/app/lib/usePermissions";
import { PermissionModule, PermissionAction } from "@/app/lib/permission";

export interface GuardProps {
  module: PermissionModule;
  action: PermissionAction;
  children: React.ReactNode;

  /**
   * Optional: what to render when permission is denied.
   * Default: null (nothing rendered).
   */
  fallback?: React.ReactNode;
}

export default function Guard({
  module,
  action,
  children,
  fallback = null,
}: GuardProps) {
  const { can } = usePermissions();

  if (!can(module, action)) return <>{fallback}</>;

  return <>{children}</>;
}
