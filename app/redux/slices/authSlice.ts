import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  normalizePermissions,
  PagePermission,
  PermissionMap,
} from "@/app/lib/permission";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  isActive?: boolean;
}

export type Permissions = PermissionMap;

interface AuthState {
  user: User | null;
  token: string | null;
  permissions: Permissions | null;
  permissionRole: string | null;
  permissionsBootstrapped: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  permissions: null,
  permissionRole: null,
  permissionsBootstrapped: false,
  loading: false,
  error: null,
};

const persistPermissions = (
  permissions: PagePermission[] | PermissionMap | null | undefined
) => {
  if (!permissions || typeof window === "undefined") return;

  const normalized = normalizePermissions(permissions);
  localStorage.setItem("permissions", JSON.stringify(normalized));
  localStorage.setItem("pagePermissions", JSON.stringify(normalized));
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setUser: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        permissions?: PagePermission[] | PermissionMap | null;
        pagePermissions?: PagePermission[] | PermissionMap | null;
        role?: string;
      }>
    ) => {
      const permissions =
        action.payload.pagePermissions || action.payload.permissions || null;

      state.user = action.payload.user;
      state.token = action.payload.token;
      state.permissions = permissions ? normalizePermissions(permissions) : null;
      state.permissionRole = action.payload.role || action.payload.user.role || null;
      state.permissionsBootstrapped = Boolean(permissions);
      state.error = null;

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("token", action.payload.token);
        persistPermissions(permissions);
        if (state.permissionRole) {
          localStorage.setItem("permissionRole", state.permissionRole);
        }
      }
    },

    setPagePermissions: (
      state,
      action: PayloadAction<{
        role?: string | null;
        pages: PagePermission[] | PermissionMap | null;
      }>
    ) => {
      const permissions = normalizePermissions(action.payload.pages);
      state.permissions = permissions;
      state.permissionRole = action.payload.role || state.user?.role || null;
      state.permissionsBootstrapped = true;

      if (typeof window !== "undefined") {
        localStorage.setItem("permissions", JSON.stringify(permissions));
        localStorage.setItem("pagePermissions", JSON.stringify(permissions));
        if (state.permissionRole) {
          localStorage.setItem("permissionRole", state.permissionRole);
        }
      }
    },

    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.permissions = null;
      state.permissionRole = null;
      state.permissionsBootstrapped = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("permissions");
        localStorage.removeItem("pagePermissions");
        localStorage.removeItem("permissionRole");
      }
    },

    restoreSession: (state) => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const permissionsStr =
        localStorage.getItem("pagePermissions") ||
        localStorage.getItem("permissions");
      const permissionRole = localStorage.getItem("permissionRole");

      if (token) state.token = token;
      if (userStr) {
        try {
          state.user = JSON.parse(userStr);
        } catch {
          localStorage.removeItem("user");
        }
      }
      if (permissionsStr) {
        try {
          state.permissions = normalizePermissions(JSON.parse(permissionsStr));
          state.permissionsBootstrapped = true;
        } catch {
          localStorage.removeItem("permissions");
          localStorage.removeItem("pagePermissions");
        }
      }
      state.permissionRole = permissionRole || state.user?.role || null;
    },
  },
});

export const {
  setLoading,
  setUser,
  setPagePermissions,
  setError,
  logout,
  restoreSession,
} = authSlice.actions;

export default authSlice.reducer;
