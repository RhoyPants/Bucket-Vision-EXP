import { createSlice } from "@reduxjs/toolkit";

interface AuthState {
  user: any;
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
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.error = null;
      state.token = action.payload?.Token;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },

    logout: (state) => {
      state.user = null;
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

export const { setLoading, setUser, setError, logout, restoreSession } = authSlice.actions;

export default authSlice.reducer;
