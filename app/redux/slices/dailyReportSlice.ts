import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface DailyReportAttachment {
  url: string;
  name: string;
}

export interface DailyReportUser {
  id: string;
  name: string;
  email: string;
}

export interface DailyReportProject {
  id: string;
  name: string;
}

export interface DailyReportReceiver {
  user: {
    id: string;
    name: string;
    email: string;
  };
  read?: boolean;
}

export interface DailyReport {
  id: string;
  userId: string;
  projectId: string;
  dayNumber: number;
  date: string;
  location: string;
  remarks: string;
  attachments: string[];
  createdAt: string;
  updatedAt?: string;
  user: DailyReportUser;
  project: DailyReportProject;
  receivers: DailyReportReceiver[];
}

export interface DailyReportCreatePayload {
  projectId: string;
  dayNumber: number;
  date: string;
  location: string;
  remarks: string;
  attachments?: string[];
  receiverIds: string[];  // Array of user IDs who will receive this report
}

export interface DailyReportUpdatePayload {
  dayNumber?: number;
  date?: string;
  location?: string;
  remarks?: string;
  attachments?: string[];
  receiverIds?: string[];  // Array of user IDs to update receivers
}

export interface DailyReportFilters {
  projectId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface DailyReportSummary {
  totalSubmitted: number;
  totalPending: number;
  totalReviewed: number;
  lateReports: number;
  todayHighlights: {
    submittedCount: number;
    lateCount: number;
    onTimeCount: number;
  };
}

interface DailyReportState {
  reports: DailyReport[];
  projectReports: DailyReport[];
  inboxReports: DailyReport[];
  submittedReports: DailyReport[];
  currentReport: DailyReport | null;
  loading: boolean;
  summaryLoading: boolean;
  error: string | null;
  summary: DailyReportSummary | null;
  total: number;
  filters: DailyReportFilters;
}

const initialState: DailyReportState = {
  reports: [],
  projectReports: [],
  inboxReports: [],
  submittedReports: [],
  currentReport: null,
  loading: false,
  summaryLoading: false,
  error: null,
  summary: null,
  total: 0,
  filters: {},
};

const dailyReportSlice = createSlice({
  name: "dailyReport",
  initialState,
  reducers: {
    // Get all reports
    getDailyReportsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getDailyReportsSuccess: (
      state,
      action: PayloadAction<{ data: DailyReport[]; total: number }>
    ) => {
      state.loading = false;
      state.reports = action.payload.data;
      state.total = action.payload.total;
    },
    getDailyReportsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Get reports by project
    getProjectReportsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getProjectReportsSuccess: (
      state,
      action: PayloadAction<{ data: DailyReport[]; total: number }>
    ) => {
      state.loading = false;
      state.projectReports = action.payload.data;
      state.total = action.payload.total;
    },
    getProjectReportsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Get single report
    getSingleReportStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getSingleReportSuccess: (state, action: PayloadAction<DailyReport>) => {
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
    createReportSuccess: (state, action: PayloadAction<DailyReport>) => {
      state.loading = false;
      state.reports.unshift(action.payload);
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
    updateReportSuccess: (state, action: PayloadAction<DailyReport>) => {
      state.loading = false;
      const index = state.reports.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.reports[index] = action.payload;
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
      action: PayloadAction<{ data: DailyReport[]; total: number }>
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
      action: PayloadAction<{ data: DailyReport[]; total: number }>
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

    // Get summary
    getDailyReportsSummaryStart: (state) => {
      state.summaryLoading = true;
      state.error = null;
    },
    getDailyReportsSummarySuccess: (state, action: PayloadAction<DailyReportSummary>) => {
      state.summaryLoading = false;
      state.summary = action.payload;
    },
    getDailyReportsSummaryFailure: (state, action: PayloadAction<string>) => {
      state.summaryLoading = false;
      state.error = action.payload;
    },

    // Set filters
    setFilters: (state, action: PayloadAction<DailyReportFilters>) => {
      state.filters = action.payload;
    },

    // Clear state
    clearDailyReports: (state) => {
      state.reports = [];
      state.projectReports = [];
      state.inboxReports = [];
      state.submittedReports = [];
      state.currentReport = null;
      state.error = null;
      state.total = 0;
    },
  },
});

export const {
  getDailyReportsStart,
  getDailyReportsSuccess,
  getDailyReportsFailure,
  getProjectReportsStart,
  getProjectReportsSuccess,
  getProjectReportsFailure,
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
  getDailyReportsSummaryStart,
  getDailyReportsSummarySuccess,
  getDailyReportsSummaryFailure,
  setFilters,
  clearDailyReports,
} = dailyReportSlice.actions;

export default dailyReportSlice.reducer;
