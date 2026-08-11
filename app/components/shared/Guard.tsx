"use client";

import React, { useSyncExternalStore } from "react";
import { usePermissions } from "@/app/lib/usePermissions";
import { PermissionModule, PermissionAction } from "@/app/lib/permission";

export interface GuardProps {
  permissionKey?: string;
  module?: PermissionModule;
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function Guard({
  permissionKey,
  module,
  action,
  children,
  fallback = null,
}: GuardProps) {
  const { can } = usePermissions();
  const key = permissionKey || module;
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  // Permissions are restored from browser storage. Keep SSR and the first
  // browser render identical, then reveal authorized content after hydration.
  if (!hydrated || !key || !can(key, action)) return <>{fallback}</>;

  return <>{children}</>;
}
