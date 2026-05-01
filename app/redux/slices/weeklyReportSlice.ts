import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface WeeklyReportUser {
  id: string;
  name: string;
  email: string;
}

export interface WeeklyReportReceiver {
  user: {
    id: string;
    name: string;
    email: string;
  };
  read?: boolean;
}

export interface WeeklyReport {
  id: string;
  userId: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  remarks: string;
  attachments: string[];
  createdAt: string;
  updatedAt?: string;
  user: WeeklyReportUser;
  receivers: WeeklyReportReceiver[];
}

export interface WeeklyReportCreatePayload {
  title: string;
  dateFrom: string;
  dateTo: string;
  remarks: string;
  attachments?: string[];
  receiverIds: string[];  // Array of user IDs who will receive this report
}

export interface WeeklyReportUpdatePayload {
  title?: string;
  dateFrom?: string;
  dateTo?: string;
  remarks?: string;
  attachments?: string[];
  receiverIds?: string[];  // Array of user IDs to update receivers
}

export interface WeeklyReportFilters {
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface WeeklyReportSummary {
  totalSubmitted: number;
  totalPending: number;
  totalReviewed: number;
  lateReports: number;
  thisWeekHighlights: {
    submittedCount: number;
    lateCount: number;
    onTimeCount: number;
  };
}

interface WeeklyReportState {
  reports: WeeklyReport[];
  myReports: WeeklyReport[];
  inboxReports: WeeklyReport[];
  submittedReports: WeeklyReport[];
  currentReport: WeeklyReport | null;
  summary: WeeklyReportSummary | null;
  loading: boolean;
  summaryLoading: boolean;
  error: string | null;
  total: number;
  filters: WeeklyReportFilters;
}

const initialState: WeeklyReportState = {
  reports: [],
  myReports: [],
  inboxReports: [],
  submittedReports: [],
  currentReport: null,
  summary: null,
  loading: false,
  summaryLoading: false,
  error: null,
  total: 0,
  filters: {},
};

const weeklyReportSlice = createSlice({
  name: "weeklyReport",
  initialState,
  reducers: {
    // Get all reports
    getWeeklyReportsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getWeeklyReportsSuccess: (
      state,
      action: PayloadAction<{ data: WeeklyReport[]; total: number }>
    ) => {
      state.loading = false;
      state.reports = action.payload.data;
      state.total = action.payload.total;
    },
    getWeeklyReportsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Get my reports
    getMyReportsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getMyReportsSuccess: (
      state,
      action: PayloadAction<{ data: WeeklyReport[]; total: number }>
    ) => {
      state.loading = false;
      state.myReports = action.payload.data;
      state.total = action.payload.total;
    },
    getMyReportsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Get reports by date range
    getReportsByRangeStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getReportsByRangeSuccess: (
      state,
      action: PayloadAction<{ data: WeeklyReport[]; total: number }>
    ) => {
      state.loading = false;
      state.reports = action.payload.data;
      state.total = action.payload.total;
    },
    getReportsByRangeFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Get summary
    getSummaryStart: (state) => {
      state.summaryLoading = true;
      state.error = null;
    },
    getSummarySuccess: (state, action: PayloadAction<WeeklyReportSummary>) => {
      state.summaryLoading = false;
      state.summary = action.payload;
    },
    getSummaryFailure: (state, action: PayloadAction<string>) => {
      state.summaryLoading = false;
      state.error = action.payload;
    },

    // Get single report
    getSingleReportStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getSingleReportSuccess: (state, action: PayloadAction<WeeklyReport>) => {
      state.loading = false;
      state.currentReport = action.payload;
    },
    getSingleReportFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Create report
    createReportStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    createReportSuccess: (state, action: PayloadAction<WeeklyReport>) => {
      state.loading = false;
      state.reports.unshift(action.payload);
      state.myReports.unshift(action.payload);
      state.total += 1;
    },
    createReportFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Update report
    updateReportStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateReportSuccess: (state, action: PayloadAction<WeeklyReport>) => {
      state.loading = false;
      const indexAllReports = state.reports.findIndex(
        (r) => r.id === action.payload.id
      );
      if (indexAllReports !== -1) {
        state.reports[indexAllReports] = action.payload;
      }

      const indexMyReports = state.myReports.findIndex(
        (r) => r.id === action.payload.id
      );
      if (indexMyReports !== -1) {
        state.myReports[indexMyReports] = action.payload;
      }

      if (state.currentReport?.id === action.payload.id) {
        state.currentReport = action.payload;
      }
    },
    updateReportFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Delete report
    deleteReportStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    deleteReportSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.reports = state.reports.filter((r) => r.id !== action.payload);
      state.myReports = state.myReports.filter((r) => r.id !== action.payload);
      state.total -= 1;
    },
    deleteReportFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Get inbox reports (reports sent to you)
    getInboxReportsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getInboxReportsSuccess: (
      state,
      action: PayloadAction<{ data: WeeklyReport[]; total: number }>
    ) => {
      state.loading = false;
      state.inboxReports = action.payload.data;
      state.total = action.payload.total;
    },
    getInboxReportsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Get submitted reports (reports you created)
    getSubmittedReportsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getSubmittedReportsSuccess: (
      state,
      action: PayloadAction<{ data: WeeklyReport[]; total: number }>
    ) => {
      state.loading = false;
      state.submittedReports = action.payload.data;
      state.total = action.payload.total;
    },
    getSubmittedReportsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Mark report as read
    markReportAsReadStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    markReportAsReadSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      const report = state.inboxReports.find((r) => r.id === action.payload);
      if (report && report.receivers[0]) {
        report.receivers[0] = { ...report.receivers[0], read: true };
      }
    },
    markReportAsReadFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Set filters
    setFilters: (state, action: PayloadAction<WeeklyReportFilters>) => {
      state.filters = action.payload;
    },

    // Clear state
    clearWeeklyReports: (state) => {
      state.reports = [];
      state.myReports = [];
      state.inboxReports = [];
      state.submittedReports = [];
      state.currentReport = null;
      state.summary = null;
      state.error = null;
      state.total = 0;
    },
  },
});

export const {
  getWeeklyReportsStart,
  getWeeklyReportsSuccess,
  getWeeklyReportsFailure,
  getMyReportsStart,
  getMyReportsSuccess,
  getMyReportsFailure,
  getReportsByRangeStart,
  getReportsByRangeSuccess,
  getReportsByRangeFailure,
  getSummaryStart,
  getSummarySuccess,
  getSummaryFailure,
  getSingleReportStart,
  getSingleReportSuccess,
  getSingleReportFailure,
  createReportStart,
  createReportSuccess,
  createReportFailure,
  updateReportStart,
  updateReportSuccess,
  updateReportFailure,
  deleteReportStart,
  deleteReportSuccess,
  deleteReportFailure,
  getInboxReportsStart,
  getInboxReportsSuccess,
  getInboxReportsFailure,
  getSubmittedReportsStart,
  getSubmittedReportsSuccess,
  getSubmittedReportsFailure,
  markReportAsReadStart,
  markReportAsReadSuccess,
  markReportAsReadFailure,
  setFilters,
  clearWeeklyReports,
} = weeklyReportSlice.actions;

export default weeklyReportSlice.reducer;
