"use client";

import React from "react";
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

  if (!key || !can(key, action)) return <>{fallback}</>;

  return <>{children}</>;
}
