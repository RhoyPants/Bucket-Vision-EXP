import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface WorkSchedule {
  id: string;
  name: string;
  description?: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  includeHolidays: boolean;
  isDefault: boolean;
  isActive: boolean;
  holidays?: Array<{
    id: string;
    date: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface WorkScheduleState {
  schedules: WorkSchedule[];
  defaultSchedule: WorkSchedule | null;
  selectedSchedule: WorkSchedule | null;
  loading: boolean;
  error: string | null;
}

const initialState: WorkScheduleState = {
  schedules: [],
  defaultSchedule: null,
  selectedSchedule: null,
  loading: false,
  error: null,
};

export const workScheduleSlice = createSlice({
  name: "workSchedule",
  initialState,
  reducers: {
    setSchedules: (state, action: PayloadAction<WorkSchedule[]>) => {
      state.schedules = action.payload;
      state.error = null;
    },
    addSchedule: (state, action: PayloadAction<WorkSchedule>) => {
      state.schedules.push(action.payload);
      state.error = null;
    },
    updateScheduleLocal: (state, action: PayloadAction<WorkSchedule>) => {
      const index = state.schedules.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.schedules[index] = action.payload;
      }
      // Update default if this was the default schedule
      if (state.defaultSchedule?.id === action.payload.id) {
        state.defaultSchedule = action.payload;
      }
      state.error = null;
    },
    deleteScheduleLocal: (state, action: PayloadAction<string>) => {
      state.schedules = state.schedules.filter((s) => s.id !== action.payload);
      state.error = null;
    },
    setSelectedSchedule: (state, action: PayloadAction<WorkSchedule | null>) => {
      state.selectedSchedule = action.payload;
    },
    setDefaultScheduleLocal: (state, action: PayloadAction<WorkSchedule>) => {
      state.defaultSchedule = action.payload;
      // Update isDefault flags
      state.schedules = state.schedules.map((s) => ({
        ...s,
        isDefault: s.id === action.payload.id,
      }));
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
  setSchedules,
  addSchedule,
  updateScheduleLocal,
  deleteScheduleLocal,
  setSelectedSchedule,
  setDefaultScheduleLocal,
  setLoading,
  setError,
} = workScheduleSlice.actions;

export default workScheduleSlice.reducer;
