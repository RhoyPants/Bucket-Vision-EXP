import axiosApi from "@/app/lib/axios";
import { workflowRequest, workflowUrl, type Page } from "@/app/api-service/incidentManagementService";

export type NotificationState = "ALL" | "UNREAD" | "READ" | "UNACKNOWLEDGED" | "ARCHIVED";
export type NotificationCategory = "PROJECT" | "APPROVAL" | "PROGRESS_UPDATE" | "INCIDENT" | "CORRECTIVE_ACTION" | "SYSTEM";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface NotificationTarget {
  resourceType: string;
  projectId?: string | null;
  incidentId?: string | null;
  actionId?: string | null;
  preferredTab?: string | null;
  requestId?: string | null;
  approvalId?: string | null;
  progressUpdateRequestId?: string | null;
  url?: string | null;
}

export interface UserNotification {
  id: string;
  recipientId: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  requiresAcknowledgement: boolean;
  readAt: string | null;
  acknowledgedAt: string | null;
  acknowledgementRemarks: string | null;
  archivedAt: string | null;
  createdAt: string;
  actor: { id: string; name: string } | null;
  target: NotificationTarget | null;
  metadata: Record<string, unknown>;
  permissions: { canRead: boolean; canAcknowledge: boolean; canArchive: boolean };
}

export interface NotificationSummary {
  unreadCount: number;
  unacknowledgedCount: number;
  byCategory: Partial<Record<NotificationCategory, number>>;
}

export type AcknowledgementStatus = "AWAITING_ACKNOWLEDGEMENT" | "READ" | "ACKNOWLEDGED";
export interface NotificationAcknowledgement {
  notificationId: string;
  recipient: { id: string; name: string };
  type: string;
  sentAt: string;
  readAt: string | null;
  acknowledgedAt: string | null;
  acknowledgementRemarks: string | null;
  status: AcknowledgementStatus;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  state?: NotificationState;
  category?: NotificationCategory | "";
  priority?: NotificationPriority | "";
  search?: string;
}

const base = "/notifications";
const data = <T>(response: { data: { data: T } }) => response.data.data;

export const notificationService = {
  async acknowledgements(params: { resourceType: "INCIDENT" | "INCIDENT_ACTION" | "INCIDENT_INVESTIGATION"; incidentId: string; actionId?: string }): Promise<NotificationAcknowledgement[]> {
    return data(await axiosApi.get(workflowUrl(`${base}/acknowledgements`), { ...workflowRequest, params }));
  },
  async summary(): Promise<NotificationSummary> {
    return data(await axiosApi.get(workflowUrl(`${base}/summary`), workflowRequest));
  },
  async list(params: NotificationListParams): Promise<Page<UserNotification>> {
    return (await axiosApi.get(workflowUrl(base), { ...workflowRequest, params })).data;
  },
  async get(id: string): Promise<UserNotification> {
    return data(await axiosApi.get(workflowUrl(`${base}/${id}`), workflowRequest));
  },
  async markRead(id: string): Promise<{ id: string; readAt: string; acknowledgedAt: string | null }> {
    return data(await axiosApi.patch(workflowUrl(`${base}/${id}/read`), {}, workflowRequest));
  },
  async markAllRead(category?: NotificationCategory): Promise<{ updatedCount: number; readAt: string }> {
    return data(await axiosApi.patch(workflowUrl(`${base}/read-all`), category ? { category } : {}, workflowRequest));
  },
  async acknowledge(id: string, remarks?: string): Promise<Pick<UserNotification, "id" | "readAt" | "acknowledgedAt" | "acknowledgementRemarks">> {
    return data(await axiosApi.patch(workflowUrl(`${base}/${id}/acknowledge`), remarks?.trim() ? { remarks: remarks.trim() } : {}, workflowRequest));
  },
  async archive(id: string): Promise<{ id: string; archivedAt: string }> {
    return data(await axiosApi.patch(workflowUrl(`${base}/${id}/archive`), {}, workflowRequest));
  },
  async restore(id: string): Promise<{ id: string; archivedAt: null }> {
    return data(await axiosApi.patch(workflowUrl(`${base}/${id}/restore`), {}, workflowRequest));
  },
  async archiveAll(payload: { state?: "ALL" | "READ"; category?: NotificationCategory } = {}): Promise<{ archivedCount: number; skippedUnacknowledgedCount: number }> {
    return data(await axiosApi.patch(workflowUrl(`${base}/archive-all`), payload, workflowRequest));
  },
};
