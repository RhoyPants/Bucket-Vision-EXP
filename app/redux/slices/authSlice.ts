import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  isActive?: boolean;
}

export type Permissions = Record<string, string[]>;

interface AuthState {
  user: User | null;
  token: string | null;
  permissions: Permissions | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  permissions: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // 🔥 FIXED
    setUser: (state, action: PayloadAction<{ user: User; token: string; permissions?: Permissions }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.permissions = action.payload.permissions || null;
      state.error = null;

      // 🔥 PERSIST USER DATA TO LOCAL STORAGE
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("token", action.payload.token);
        if (action.payload.permissions) {
          localStorage.setItem("permissions", JSON.stringify(action.payload.permissions));
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
      // 🔥 CLEAR ALL AUTH DATA FROM LOCAL STORAGE
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("permissions");
      }
    },

    restoreSession: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        const permissionsStr = localStorage.getItem("permissions");

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
            state.permissions = JSON.parse(permissionsStr);
          } catch {
            localStorage.removeItem("permissions");
          }
        }
      }
    },
  },
});

export const { setLoading, setUser, setError, logout, restoreSession } =
  authSlice.actions;

export default authSlice.reducer;