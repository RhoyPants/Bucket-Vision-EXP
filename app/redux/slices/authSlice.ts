import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
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
    setUser: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },

    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
    },

    restoreSession: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) state.token = token;
      }
    },
  },
});

export const { setLoading, setUser, setError, logout, restoreSession } =
  authSlice.actions;

export default authSlice.reducer;