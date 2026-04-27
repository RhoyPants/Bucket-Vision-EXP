import axios from "@/app/lib/axios";
import { AppDispatch } from "@/app/redux/store";
import {
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
  WeeklyReportCreatePayload,
  WeeklyReportUpdatePayload,
  WeeklyReportFilters,
} from "@/app/redux/slices/weeklyReportSlice";

/**
 * Get all weekly reports with optional filters
 */
export const getWeeklyReports =
  (filters?: WeeklyReportFilters) => async (dispatch: AppDispatch) => {
    dispatch(getWeeklyReportsStart());
    try {
      const params = new URLSearchParams();
      if (filters?.userId) params.append("userId", filters.userId);
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.append("dateTo", filters.dateTo);
      if (filters?.search) params.append("search", filters.search);

      const response = await axios.get(
        `/weekly-reports?${params.toString()}`
      );
      dispatch(
        getWeeklyReportsSuccess({
          data: response.data.data,
          total: response.data.total,
        })
      );
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch reports";
      dispatch(getWeeklyReportsFailure(message));
      throw error;
    }
  };

/**
 * Get current user's weekly reports
 */
export const getMyWeeklyReports =
  (dateFrom?: string, dateTo?: string) => async (dispatch: AppDispatch) => {
    dispatch(getMyReportsStart());
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await axios.get(`/weekly-reports/my?${params.toString()}`);
      dispatch(
        getMyReportsSuccess({
          data: response.data.data,
          total: response.data.total,
        })
      );
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch your reports";
      dispatch(getMyReportsFailure(message));
      throw error;
    }
  };

/**
 * Get weekly reports by date range
 */
export const getReportsByDateRange =
  (dateFrom: string, dateTo: string) => async (dispatch: AppDispatch) => {
    dispatch(getReportsByRangeStart());
    try {
      const params = new URLSearchParams();
      params.append("dateFrom", dateFrom);
      params.append("dateTo", dateTo);

      const response = await axios.get(
        `/weekly-reports/range?${params.toString()}`
      );
      dispatch(
        getReportsByRangeSuccess({
          data: response.data.data,
          total: response.data.total,
        })
      );
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch reports for date range";
      dispatch(getReportsByRangeFailure(message));
      throw error;
    }
  };

/**
 * Get weekly reports summary/dashboard
 */
export const getWeeklyReportsSummary = () => async (dispatch: AppDispatch) => {
  dispatch(getSummaryStart());
  try {
    const response = await axios.get("/weekly-reports/summary");
    dispatch(getSummarySuccess(response.data.data));
    return response.data.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch summary";
    dispatch(getSummaryFailure(message));
    throw error;
  }
};

/**
 * Get a single weekly report by ID
 */
export const getSingleWeeklyReport =
  (reportId: string) => async (dispatch: AppDispatch) => {
    dispatch(getSingleReportStart());
    try {
      const response = await axios.get(`/weekly-reports/${reportId}`);
      dispatch(getSingleReportSuccess(response.data));
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch report";
      dispatch(getSingleReportFailure(message));
      throw error;
    }
  };

/**
 * Create a new weekly report
 */
export const createWeeklyReport =
  (payload: WeeklyReportCreatePayload) => async (dispatch: AppDispatch) => {
    dispatch(createReportStart());
    try {
      const response = await axios.post("/weekly-reports", payload);
      dispatch(createReportSuccess(response.data));
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to create report";
      dispatch(createReportFailure(message));
      throw error;
    }
  };

/**
 * Update a weekly report
 */
export const updateWeeklyReport =
  (reportId: string, payload: WeeklyReportUpdatePayload) =>
  async (dispatch: AppDispatch) => {
    dispatch(updateReportStart());
    try {
      const response = await axios.put(`/weekly-reports/${reportId}`, payload);
      dispatch(updateReportSuccess(response.data));
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update report";
      dispatch(updateReportFailure(message));
      throw error;
    }
  };

/**
 * Delete a weekly report
 */
export const deleteWeeklyReport =
  (reportId: string) => async (dispatch: AppDispatch) => {
    dispatch(deleteReportStart());
    try {
      await axios.delete(`/weekly-reports/${reportId}`);
      dispatch(deleteReportSuccess(reportId));
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to delete report";
      dispatch(deleteReportFailure(message));
      throw error;
    }
  };

/**
 * Get inbox reports (reports sent to you)
 */
export const getInboxWeeklyReports =
  (filters?: WeeklyReportFilters) => async (dispatch: AppDispatch) => {
    dispatch(getInboxReportsStart());
    try {
      const params = new URLSearchParams();
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.append("dateTo", filters.dateTo);
      if (filters?.search) params.append("search", filters.search);

      const response = await axios.get(
        `/weekly-reports/inbox?${params.toString()}`
      );
      dispatch(
        getInboxReportsSuccess({
          data: response.data.data,
          total: response.data.total,
        })
      );
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch inbox reports";
      dispatch(getInboxReportsFailure(message));
      throw error;
    }
  };

/**
 * Get submitted reports (reports you created)
 */
export const getSubmittedWeeklyReports =
  (filters?: WeeklyReportFilters) => async (dispatch: AppDispatch) => {
    dispatch(getSubmittedReportsStart());
    try {
      const params = new URLSearchParams();
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.append("dateTo", filters.dateTo);
      if (filters?.search) params.append("search", filters.search);

      const response = await axios.get(
        `/weekly-reports/my-submitted?${params.toString()}`
      );
      dispatch(
        getSubmittedReportsSuccess({
          data: response.data.data,
          total: response.data.total,
        })
      );
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch submitted reports";
      dispatch(getSubmittedReportsFailure(message));
      throw error;
    }
  };

/**
 * Mark a report as read
 */
export const markWeeklyReportAsRead =
  (reportId: string) => async (dispatch: AppDispatch) => {
    dispatch(markReportAsReadStart());
    try {
      await axios.put(`/weekly-reports/${reportId}/mark-read`);
      dispatch(markReportAsReadSuccess(reportId));
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to mark report as read";
      dispatch(markReportAsReadFailure(message));
      throw error;
    }
  };
