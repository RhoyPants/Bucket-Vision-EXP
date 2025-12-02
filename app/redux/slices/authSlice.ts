"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }: { email: string; password: string }) => {
    // We will add logic later
  }
);


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
  reducers: {},
});

export default authSlice.reducer;
