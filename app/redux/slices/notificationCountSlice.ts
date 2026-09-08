import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type NotificationCounts = {
  approvals: number;
  projectApprovals: number;
  progressUpdates: number;
  needsRevision: number;
};

type NotificationCountState = NotificationCounts & {
  initialized: boolean;
};

const initialState: NotificationCountState = {
  approvals: 0,
  projectApprovals: 0,
  progressUpdates: 0,
  needsRevision: 0,
  initialized: false,
};

const notificationCountSlice = createSlice({
  name: "notificationCounts",
  initialState,
  reducers: {
    setNotificationCounts(state, action: PayloadAction<NotificationCounts>) {
      state.approvals = Math.max(0, action.payload.approvals);
      state.projectApprovals = Math.max(0, action.payload.projectApprovals);
      state.progressUpdates = Math.max(0, action.payload.progressUpdates);
      state.needsRevision = Math.max(0, action.payload.needsRevision);
      state.initialized = true;
    },
    setApprovalCount(state, action: PayloadAction<number>) {
      state.projectApprovals = Math.max(0, action.payload);
      state.approvals = state.projectApprovals + state.progressUpdates;
    },
    setApprovalCounts(
      state,
      action: PayloadAction<{ projectApprovals: number; progressUpdates: number; total: number }>,
    ) {
      state.projectApprovals = Math.max(0, action.payload.projectApprovals);
      state.progressUpdates = Math.max(0, action.payload.progressUpdates);
      state.approvals = Math.max(0, action.payload.total);
      state.initialized = true;
    },
    setNeedsRevisionCount(state, action: PayloadAction<number>) {
      state.needsRevision = Math.max(0, action.payload);
    },
    decrementApprovalCount(state) {
      state.projectApprovals = Math.max(0, state.projectApprovals - 1);
      state.approvals = state.projectApprovals + state.progressUpdates;
    },
    decrementProgressUpdateCount(state) {
      state.progressUpdates = Math.max(0, state.progressUpdates - 1);
      state.approvals = state.projectApprovals + state.progressUpdates;
    },
    decrementNeedsRevisionCount(state) {
      state.needsRevision = Math.max(0, state.needsRevision - 1);
    },
    resetNotificationCounts() {
      return initialState;
    },
  },
});

export const {
  setNotificationCounts,
  setApprovalCount,
  setApprovalCounts,
  setNeedsRevisionCount,
  decrementApprovalCount,
  decrementProgressUpdateCount,
  decrementNeedsRevisionCount,
  resetNotificationCounts,
} = notificationCountSlice.actions;

export default notificationCountSlice.reducer;
