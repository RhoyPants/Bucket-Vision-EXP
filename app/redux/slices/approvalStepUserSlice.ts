import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ApprovalStepUser {
  id: string;
  stepId: string;
  userId: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
}

interface ApprovalStepUserState {
  usersByRole: Record<string, any[]>; // role -> users mapping for dropdowns
  stepAssignments: Record<string, ApprovalStepUser[]>; // stepId -> assigned users
  loading: boolean;
  error: string | null;
}

const initialState: ApprovalStepUserState = {
  usersByRole: {},
  stepAssignments: {},
  loading: false,
  error: null,
};

export const approvalStepUserSlice = createSlice({
  name: "approvalStepUser",
  initialState,
  reducers: {
    setUsersByRole: (state, action: PayloadAction<{ role: string; users: any[] }>) => {
      state.usersByRole[action.payload.role] = action.payload.users;
      state.error = null;
    },
    setStepAssignments: (state, action: PayloadAction<{ stepId: string; users: ApprovalStepUser[] }>) => {
      state.stepAssignments[action.payload.stepId] = action.payload.users;
      state.error = null;
    },
    addStepAssignment: (state, action: PayloadAction<{ stepId: string; user: ApprovalStepUser }>) => {
      if (!state.stepAssignments[action.payload.stepId]) {
        state.stepAssignments[action.payload.stepId] = [];
      }
      state.stepAssignments[action.payload.stepId].push(action.payload.user);
      state.error = null;
    },
    removeStepAssignment: (state, action: PayloadAction<{ stepId: string; userId: string }>) => {
      if (state.stepAssignments[action.payload.stepId]) {
        state.stepAssignments[action.payload.stepId] = state.stepAssignments[action.payload.stepId].filter(
          (u) => u.userId !== action.payload.userId
        );
      }
      state.error = null;
    },
    clearStepAssignments: (state, action: PayloadAction<string>) => {
      state.stepAssignments[action.payload] = [];
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setUsersByRole,
  setStepAssignments,
  addStepAssignment,
  removeStepAssignment,
  clearStepAssignments,
  setLoading,
  setError,
} = approvalStepUserSlice.actions;

export default approvalStepUserSlice.reducer;
