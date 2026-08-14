import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type NotificationCounts = {
  approvals: number;
  needsRevision: number;
};

type NotificationCountState = NotificationCounts & {
  initialized: boolean;
};

const initialState: NotificationCountState = {
  approvals: 0,
  needsRevision: 0,
  initialized: false,
};

const notificationCountSlice = createSlice({
  name: "notificationCounts",
  initialState,
  reducers: {
    setNotificationCounts(state, action: PayloadAction<NotificationCounts>) {
      state.approvals = Math.max(0, action.payload.approvals);
      state.needsRevision = Math.max(0, action.payload.needsRevision);
      state.initialized = true;
    },
    setApprovalCount(state, action: PayloadAction<number>) {
      state.approvals = Math.max(0, action.payload);
    },
    setNeedsRevisionCount(state, action: PayloadAction<number>) {
      state.needsRevision = Math.max(0, action.payload);
    },
    decrementApprovalCount(state) {
      state.approvals = Math.max(0, state.approvals - 1);
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
  setNeedsRevisionCount,
  decrementApprovalCount,
  decrementNeedsRevisionCount,
  resetNotificationCounts,
} = notificationCountSlice.actions;

export default notificationCountSlice.reducer;
