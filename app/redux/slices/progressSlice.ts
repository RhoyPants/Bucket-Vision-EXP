import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ProgressLog {
  id?: string;
  subtaskId: string;
  date: string;

  dailyPercent: number;
  cumulativePercent?: number;

  photoUrl?: string;
  latitude?: number;
  longitude?: number;

  remarks?: string;
}

interface ProgressState {
  logsBySubtask: Record<string, ProgressLog[]>;

  // 🔥 NEW
  selectedDateBySubtask: Record<string, string | null>;
  currentProgressBySubtask: Record<string, number>;

  loading: boolean;
}

const initialState: ProgressState = {
  logsBySubtask: {},

  selectedDateBySubtask: {},
  currentProgressBySubtask: {},

  loading: false,
};

const progressSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {
    setLogs(
      state,
      action: PayloadAction<{
        subtaskId: string;
        logs: ProgressLog[];
      }>
    ) {
      state.logsBySubtask[action.payload.subtaskId] =
        action.payload.logs;
    },

    // 🔥 NEW: track selected date
    setSelectedDate(
      state,
      action: PayloadAction<{
        subtaskId: string;
        date: string | null;
      }>
    ) {
      state.selectedDateBySubtask[action.payload.subtaskId] =
        action.payload.date;
    },

    // 🔥 NEW: store current progress
    setCurrentProgress(
      state,
      action: PayloadAction<{
        subtaskId: string;
        progress: number;
      }>
    ) {
      state.currentProgressBySubtask[action.payload.subtaskId] =
        action.payload.progress;
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    clearLogs(state, action: PayloadAction<string>) {
      delete state.logsBySubtask[action.payload];
      delete state.selectedDateBySubtask[action.payload];
      delete state.currentProgressBySubtask[action.payload];
    },
  },
});

export const {
  setLogs,
  setLoading,
  clearLogs,
  setSelectedDate,
  setCurrentProgress,
} = progressSlice.actions;

export default progressSlice.reducer;