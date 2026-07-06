import axios from "@/app/lib/axios";
import { AxiosResponse } from "axios";
import { AppDispatch } from "@/app/redux/store";
import { uploadAttachments } from "@/app/api-service/attachmentService";
import {
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
  DailyReportCreatePayload,
  DailyReportUpdatePayload,
  DailyReportFilters,
  DailyReport,
} from "@/app/redux/slices/dailyReportSlice";

type DailyReportListResponse = {
  data: DailyReport[];
  total: number;
};

const inboxReportsInFlight = new Map<
  string,
  Promise<AxiosResponse<DailyReportListResponse>>
>();

/**
 * Get all daily reports with optional filters
 */
export const getDailyReports =
  (filters?: DailyReportFilters) => async (dispatch: AppDispatch) => {
    dispatch(getDailyReportsStart());
    try {
      const params = new URLSearchParams();
      if (filters?.projectId) params.append("projectId", filters.projectId);
      if (filters?.userId) params.append("userId", filters.userId);
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.append("dateTo", filters.dateTo);
      if (filters?.search) params.append("search", filters.search);

      const response = await axios.get(
        `/daily-reports?${params.toString()}`
      );
      dispatch(
        getDailyReportsSuccess({
          data: response.data.data,
          total: response.data.total,
        })
      );
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch reports";
      dispatch(getDailyReportsFailure(message));
      throw error;
    }
  };

/**
 * Get daily reports for a specific project
 */
export const getProjectDailyReports =
  (projectId: string, dateFrom?: string, dateTo?: string) =>
  async (dispatch: AppDispatch) => {
    dispatch(getProjectReportsStart());
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await axios.get(
        `/daily-reports/project/${projectId}?${params.toString()}`
      );
      dispatch(
        getProjectReportsSuccess({
          data: response.data.data,
          total: response.data.total,
        })
      );
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch project reports";
      dispatch(getProjectReportsFailure(message));
      throw error;
    }
  };

/**
 * Get a single daily report by ID
 */
export const getSingleDailyReport =
  (reportId: string) => async (dispatch: AppDispatch) => {
    dispatch(getSingleReportStart());
    try {
      const response = await axios.get(`/daily-reports/${reportId}`);
      dispatch(getSingleReportSuccess(response.data));
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch report";
      dispatch(getSingleReportFailure(message));
      throw error;
    }
  };

/**
 * Create a new daily report
 */
export const createDailyReport =
  (payload: DailyReportCreatePayload) => async (dispatch: AppDispatch) => {
    dispatch(createReportStart());
    try {
      const { files, attachments, ...restPayload } = payload as DailyReportCreatePayload & {
        files?: File[];
        attachments?: any[];
      };
      const reportPayload = {
        ...restPayload,
        ...(Array.isArray(attachments) && attachments.length > 0 && !(attachments[0] instanceof File)
          ? { attachments }
          : {}),
      };
      const response = await axios.post("/daily-reports", reportPayload);

      let created = response.data?.data || response.data;

      if (files?.length && created?.id) {
        const uploaded = await uploadAttachments("daily-reports", created.id, files);
        created = {
          ...created,
          attachments: uploaded,
        };
      }

      dispatch(createReportSuccess(created));
      return created;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to create report";
      dispatch(createReportFailure(message));
      throw error;
    }
  };

/**
 * Update a daily report
 */
export const updateDailyReport =
  (reportId: string, payload: DailyReportUpdatePayload) =>
  async (dispatch: AppDispatch) => {
    dispatch(updateReportStart());
    try {
      const { files, attachments, ...restPayload } = payload as DailyReportUpdatePayload & {
        files?: File[];
        attachments?: any[];
      };
      const reportPayload = {
        ...restPayload,
        ...(Array.isArray(attachments) && attachments.length > 0 && !(attachments[0] instanceof File)
          ? { attachments }
          : {}),
      };
      const response = await axios.put(`/daily-reports/${reportId}`, reportPayload);

      let updated = response.data?.data || response.data;

      if (files?.length) {
        const uploaded = await uploadAttachments("daily-reports", reportId, files);
        const existing = Array.isArray(updated?.attachments) ? updated.attachments : [];
        updated = {
          ...updated,
          attachments: [...existing, ...uploaded],
        };
      }

      dispatch(updateReportSuccess(updated));
      return updated;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update report";
      dispatch(updateReportFailure(message));
      throw error;
    }
  };

/**
 * Delete a daily report
 */
export const deleteDailyReport =
  (reportId: string) => async (dispatch: AppDispatch) => {
    dispatch(deleteReportStart());
    try {
      await axios.delete(`/daily-reports/${reportId}`);
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
export const getInboxReports =
  (filters?: DailyReportFilters) => async (dispatch: AppDispatch) => {
    dispatch(getInboxReportsStart());
    try {
      const params = new URLSearchParams();
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.append("dateTo", filters.dateTo);
      if (filters?.search) params.append("search", filters.search);

      const url = `/daily-reports/inbox?${params.toString()}`;
      const request =
        inboxReportsInFlight.get(url) ||
        axios.get(url).finally(() => {
          inboxReportsInFlight.delete(url);
        });
      inboxReportsInFlight.set(url, request);

      const response = await request;
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
export const getSubmittedReports =
  (filters?: DailyReportFilters) => async (dispatch: AppDispatch) => {
    dispatch(getSubmittedReportsStart());
    try {
      const params = new URLSearchParams();
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.append("dateTo", filters.dateTo);
      if (filters?.search) params.append("search", filters.search);

      const response = await axios.get(
        `/daily-reports/my-submitted?${params.toString()}`
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
export const markDailyReportAsRead =
  (reportId: string) => async (dispatch: AppDispatch) => {
    dispatch(markReportAsReadStart());
    try {
      await axios.put(`/daily-reports/${reportId}/mark-read`);
      dispatch(markReportAsReadSuccess(reportId));
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to mark report as read";
      dispatch(markReportAsReadFailure(message));
      throw error;
    }
  };

/**
 * Get daily reports summary/dashboard
 */
export const getDailyReportsSummary = () => async (dispatch: AppDispatch) => {
  dispatch(getDailyReportsSummaryStart());
  try {
    const response = await axios.get("/daily-reports/summary");
    dispatch(getDailyReportsSummarySuccess(response.data.data));
    return response.data.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch summary";
    dispatch(getDailyReportsSummaryFailure(message));
    throw error;
  }
};
