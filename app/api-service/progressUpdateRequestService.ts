import axiosApi from "@/app/lib/axios";

export type ProgressUpdateRequestStatus =
  | "PENDING"
  | "APPLIED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface ProgressUpdateRequest {
  id: string;
  progressLogId: string;
  requestedById: string;
  reviewedById?: string | null;
  currentPercent: string | number;
  requestedPercent: string | number;
  difference: string | number;
  remarks?: string | null;
  reviewRemarks?: string | null;
  status: ProgressUpdateRequestStatus;
  reviewedAt?: string | null;
  cancelledAt?: string | null;
  appliedAt?: string | null;
  createdAt?: string;
  date?: string;
  progressDate?: string;
  entryDate?: string;
  requestedBy?: { id: string; name?: string; email?: string };
  reviewedBy?: { id: string; name?: string; email?: string } | null;
  assignedApprover?: { id?: string; name?: string; email?: string } | null;
  assignedBuHead?: { id?: string; name?: string; email?: string } | null;
  canReview?: boolean;
  canCancel?: boolean;
  project?: { id?: string; name?: string } | null;
  scope?: { id?: string; name?: string } | null;
  task?: { id?: string; title?: string; name?: string } | null;
  subtask?: { id?: string; title?: string } | null;
  businessUnit?: { id?: string; name?: string } | null;
  progressLog?: {
    id: string;
    subtaskId: string;
    date?: string;
    dailyPercent: string | number;
    cumulativePercent?: string | number;
    subtask?: {
      id?: string;
      title?: string;
      taskId?: string;
      task?: {
        id?: string;
        title?: string;
        scopeId?: string;
        scope?: {
          id?: string;
          name?: string;
          projectId?: string;
          project?: { id?: string; name?: string };
        };
      };
    };
  };
  context?: {
    projectId?: string;
    projectName?: string;
    scopeId?: string;
    scopeName?: string;
    taskId?: string;
    taskName?: string;
  };
}

const normalizeRequest = (request: ProgressUpdateRequest): ProgressUpdateRequest => {
  const progressDate =
    request.progressLog?.date ||
    request.progressDate ||
    request.entryDate ||
    request.date;

  return {
    ...request,
    progressLog: request.progressLog
      ? { ...request.progressLog, date: progressDate }
      : request.progressLog,
  };
};

const unwrapList = (payload: any): ProgressUpdateRequest[] =>
  (Array.isArray(payload?.data) ? payload.data : []).map(normalizeRequest);

const list = async (
  path: string,
  status?: ProgressUpdateRequestStatus,
) => {
  const response = await axiosApi.get(path, {
    params: status ? { status } : undefined,
  });
  return unwrapList(response.data);
};

export const getMyProgressUpdateRequests = (status?: ProgressUpdateRequestStatus) =>
  list("/progress/update-requests/mine", status);

export const getProgressUpdateRequestInbox = (status?: ProgressUpdateRequestStatus) =>
  list("/progress/update-requests/inbox", status);

export async function getProgressUpdateRequestInboxPage(
  status: ProgressUpdateRequestStatus,
  page: number = 1,
  limit: number = 10,
  search?: string,
) {
  const response = await axiosApi.get("/progress/update-requests/inbox", {
    params: {
      status,
      page,
      limit,
      search: search?.trim() || undefined,
    },
  });
  const data = unwrapList(response.data);
  return {
    data,
    pagination: response.data?.pagination || {
      page,
      limit,
      total: data.length,
      totalPages: Math.max(1, Math.ceil(data.length / limit)),
    },
  };
}

export const getSubtaskProgressUpdateRequests = (
  subtaskId: string,
  status?: ProgressUpdateRequestStatus,
) => list(`/progress/subtask/${subtaskId}/update-requests`, status);

export async function approveProgressUpdateRequest(id: string, remarks?: string) {
  const response = await axiosApi.post(
    `/progress/update-requests/${id}/approve`,
    remarks?.trim() ? { remarks: remarks.trim() } : {},
  );
  return response.data;
}

export async function rejectProgressUpdateRequest(id: string, remarks: string) {
  const response = await axiosApi.post(`/progress/update-requests/${id}/reject`, {
    remarks: remarks.trim(),
  });
  return response.data;
}

export async function cancelProgressUpdateRequest(id: string) {
  const response = await axiosApi.post(`/progress/update-requests/${id}/cancel`);
  return response.data;
}

export interface ProgressHistoryEvent {
  type: "PROGRESS_CREATED" | "PROGRESS_UPDATED" | "DECREASE_REQUESTED" | "DECREASE_APPROVED" | "DECREASE_REJECTED" | "DECREASE_CANCELLED";
  timestamp: string;
  date: string;
  id: string;
  logId?: string;
  requestId?: string;
  value?: number;
  currentPercent?: number | string;
  requestedPercent?: number | string;
  difference?: number | string;
  cumulativePercent?: number | string;
  remarks?: string;
  reviewRemarks?: string;
  performedBy?: { id: string; name?: string; email?: string };
  requestedBy?: { id: string; name?: string; email?: string };
  approvedBy?: { id: string; name?: string; email?: string };
  rejectedBy?: { id: string; name?: string; email?: string };
  cancelledBy?: { id: string; name?: string; email?: string };
  businessUnit?: { id: string; name?: string };
  assignedApprover?: { id?: string; name?: string; email?: string };
  appliedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
}

export interface ProgressHistoryResponse {
  success: boolean;
  data: ProgressHistoryEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getProgressHistory(
  subtaskId: string,
  page: number = 1,
  limit: number = 20,
): Promise<ProgressHistoryResponse> {
  const response = await axiosApi.get(
    `/progress/subtask/${subtaskId}/history`,
    {
      params: { page, limit },
    },
  );
  return response.data;
}
