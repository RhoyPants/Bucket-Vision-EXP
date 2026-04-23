import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  name: string;
  email: string;
  role?: {
    id: string;
    name: string;
  };
}

interface UserState {
  members: User[];
  loading: boolean;
}

const initialState: UserState = {
  members: [],
  loading: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // ✅ SET MEMBERS
    setMembers(state, action: PayloadAction<User[]>) {
      state.members = action.payload;
    },

    // ✅ LOADING
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setMembers, setLoading } = userSlice.actions;
export default userSlice.reducer;