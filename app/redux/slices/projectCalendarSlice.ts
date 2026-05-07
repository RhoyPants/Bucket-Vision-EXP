"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SubtaskBarData {
  id: string;
  title: string;
  progress: number;
  startDate: string;
  endDate: string;
  scopeId?: string;
  scopeName?: string;
}

export interface CalendarDayData {
  day: number;
  subtasks: SubtaskBarData[];
}

interface ProjectCalendarState {
  currentMonth: number;
  currentYear: number;
  projectId: string | null;
  scopes: Array<{ id: string; name: string }>;
  selectedScopeId: string | null;
  subtasks: SubtaskBarData[];
  loading: boolean;
  error: string | null;
}

const initialState: ProjectCalendarState = {
  currentMonth: new Date().getMonth() + 1,
  currentYear: new Date().getFullYear(),
  projectId: null,
  scopes: [],
  selectedScopeId: null,
  subtasks: [],
  loading: false,
  error: null,
};

const projectCalendarSlice = createSlice({
  name: "projectCalendar",
  initialState,
  reducers: {
    // ✅ Set project calendar data
    setSubtasks(state, action: PayloadAction<SubtaskBarData[]>) {
      state.subtasks = action.payload;
    },

    // ✅ Set scopes for filtering
    setScopes(state, action: PayloadAction<Array<{ id: string; name: string }>>) {
      state.scopes = action.payload;
    },

    // ✅ Set selected scope
    setSelectedScope(state, action: PayloadAction<string | null>) {
      state.selectedScopeId = action.payload;
    },

    // ✅ Set month and year
    setMonth(state, action: PayloadAction<{ month: number; year: number }>) {
      state.currentMonth = action.payload.month;
      state.currentYear = action.payload.year;
    },

    // ✅ Set project ID
    setProjectId(state, action: PayloadAction<string>) {
      state.projectId = action.payload;
    },

    // ✅ Set loading state
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    // ✅ Set error
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    // ✅ Reset calendar
    reset(state) {
      return initialState;
    },
  },
});

export const {
  setSubtasks,
  setScopes,
  setSelectedScope,
  setMonth,
  setProjectId,
  setLoading,
  setError,
  reset,
} = projectCalendarSlice.actions;

export default projectCalendarSlice.reducer;
