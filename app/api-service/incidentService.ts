import axiosApi from "@/app/lib/axios";
import { Page, workflowRequest, workflowUrl } from "./incidentManagementService";

export interface IncidentEscalation {
  matrixId: string;
  matrixVersion: number;
  activeLevelId: string | null;
  activeLevelOrder: number | null;
  resolverRule: "ANY_ONE" | "ALL";
  eligibleResolvers?: IncidentPerson[];
  confirmedResolverIds?: string[];
  activatedAt: string | null;
  slaDeadline: string | null;
  slaCalendarSource: string;
  isFinal: boolean;
  exception?: string | null;
}
export interface IncidentWorkflowState {
  workflowId: string;
  workflowName?: string | null;
  name?: string | null;
  workflowVersion: number;
  levelCount?: number;
  levels?: IncidentWorkflowRuntimeLevel[];
  levelSnapshots?: IncidentWorkflowRuntimeLevel[];
  status?: string;
  activeLevelId: string | null;
  activeLevelOrder: number | null;
  responsiblePartyLabel?: string | null;
  completionRule: "ANY_ONE" | "ALL";
  eligibleResolvers?: IncidentPerson[];
  eligibleResolverCount?: number;
  confirmedResolverIds?: string[];
  confirmationCount?: number;
  activatedAt: string | null;
  levelSlaDeadline: string | null;
  levelSlaBreachedAt: string | null;
  isLevelOverdue: boolean;
  lateBy?: { value: number; unit: string } | null;
  isFinal: boolean;
  exception?: string | null;
  completedLevels?: IncidentWorkflowCompletedLevel[];
}
export interface IncidentWorkflowRuntimeLevel {
  id?: string;
  levelId?: string;
  order: number;
  responsiblePartyLabel?: string | null;
  completionRule?: "ANY_ONE" | "ALL";
  slaValue?: number | null;
  slaUnit?: string | null;
  isFinal?: boolean;
  eligibleResolvers?: IncidentPerson[];
  activatedAt?: string | null;
  levelSlaDeadline?: string | null;
  levelSlaBreachedAt?: string | null;
}
export interface IncidentWorkflowCompletedLevel {
  levelId?: string;
  order: number;
  completedAt?: string;
  completedById?: string;
  wasLate?: boolean;
  levelSlaBreachedAt?: string | null;
  remarks?: string | null;
}
export interface OverallIncidentSla {
  startedAt: string;
  deadline: string;
  breachedAt: string | null;
  isBreached: boolean;
  calendarSource: string;
  resolvedAt?: string | null;
}
export interface NotificationEscalationState {
  matrixId?: string;
  matrixVersion?: number;
  status: string;
  activeNotificationLevelOrder?: number | null;
  activeLevelOrder?: number | null;
  lastNotifiedAt?: string | null;
  nextNotificationAt?: string | null;
  notifiedRecipients?: NotificationRecipient[];
  notifiedLevels?: NotificationRecipient[];
  stoppedAt?: string | null;
}
export interface NotificationRecipient {
  levelOrder?: number;
  order?: number;
  recipientId?: string | null;
  name?: string;
  recipientLabel?: string;
  notifiedAt?: string | null;
}
export interface EscalationEvent {
  id: string;
  eventType: string;
  timestamp: string;
  levelId: string | null;
  actorId: string | null;
  details: Record<string, unknown>;
}

export type IncidentStatus = "PENDING" | "RESOLVED" | "CANCELLED";
export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface IncidentAttachment {
  section?: EvidenceSection;
  actionId?: string | null;
  caption?: string | null;
  displayOrder?: number;
  user?: IncidentPerson | null;
  id: string;
  incidentId: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  proxyUrl?: string;
  createdAt?: string;
}

export interface IncidentPerson {
  id: string;
  name?: string;
  email?: string;
  position?: string;
}

export interface Incident {
  revision?: number;
  occurredAt?: string | null;
  location?: string | null;
  immediateActionTaken?: string | null;
  reportRecipient?: string | null;
  investigationSummary?: { hasContent: boolean; updatedAt: string | null };
  actionSummary?: { total: number; completed: number; requiredOpen: number; overdue: number };
  incidentTypeId?: string | null;
  incidentType?: { id: string; name: string } | null;
  escalation?: IncidentEscalation | null;
  workflow?: IncidentWorkflowState | null;
  overallSla?: OverallIncidentSla | null;
  overallSlaSnapshot?: { value: number; unit: string; calendarSource: string } | null;
  overallSlaDeadline?: string | null;
  overallSlaBreachedAt?: string | null;
  notificationEscalation?: NotificationEscalationState | null;
  slaDeadline?: string | null;
  permissions?: { canView?: boolean; canResolve: boolean; resolveBlockedReason?: string | null; canCompleteLevel?: boolean; canCompleteCurrentLevel?: boolean; completeLevelBlockedReason?: string | null; canEditOverview?: boolean; canEditInvestigation?: boolean; canCreateAction?: boolean; canManageEvidence?: boolean; canExportReport?: boolean };
  id: string;
  incidentNumber: string;
  projectId: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  dateRaised: string;
  dateAddressed?: string | null;
  remarks?: string | null;
  cancellationReason?: string | null;
  reportedBy?: IncidentPerson | null;
  resolvedBy?: IncidentPerson | null;
  cancelledBy?: IncidentPerson | null;
  scopeId?: string | null;
  taskId?: string | null;
  subtaskId?: string | null;
  scope?: { id: string; name: string } | null;
  task?: { id: string; title: string } | null;
  subtask?: { id: string; title: string } | null;
  attachments?: IncidentAttachment[];
}

export interface IncidentPayload {
  revision?: number;
  occurredAt?: string;
  location?: string;
  immediateActionTaken?: string;
  reportRecipient?: string;
  incidentTypeId?: string;
  projectId?: string;
  title: string;
  description: string;
  severity?: IncidentSeverity;
  dateRaised?: string;
  remarks?: string | null;
  scopeId?: string | null;
  taskId?: string | null;
  subtaskId?: string | null;
}

const data = <T>(response: { data?: { data?: T } | T }): T => {
  const body = response.data;
  return ((body && typeof body === "object" && "data" in body ? body.data : body) ?? null) as T;
};

const uniqueFiles = (files: File[]) =>
  files.filter(
    (file, index, list) =>
      list.findIndex(
        (item) =>
          item.name === file.name &&
          item.size === file.size &&
          item.lastModified === file.lastModified,
      ) === index,
  );

export const incidentService = {
  async list(projectId: string, filters?: { status?: string; severity?: string }) {
    const response = await axiosApi.get(workflowUrl("/incidents"), { ...workflowRequest, params: { projectId, ...filters, limit: 100 } });
    const body = response.data;
    return {
      incidents: (body?.data ?? []) as Incident[],
      pagination: body?.pagination,
    };
  },
  async get(id: string) {
    return data<Incident>(await axiosApi.get(workflowUrl(`/incidents/${id}`), workflowRequest));
  },
  async history(id: string, page = 1): Promise<Page<EscalationEvent>> {
    return (await axiosApi.get(workflowUrl(`/incidents/${id}/escalation-history`), { ...workflowRequest, params: { page, limit: 20 } })).data;
  },
  async create(payload: Omit<IncidentPayload, "severity"> & { projectId: string; incidentTypeId: string; occurredAt: string; location: string }, files: File[] = []) {
    if (!files.length) return data<Incident>(await axiosApi.post(workflowUrl("/incidents"), payload, workflowRequest));
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") form.append(key, String(value));
    });
    uniqueFiles(files).forEach((file) => form.append("attachments", file));
    return data<Incident>(
      await axiosApi.post(workflowUrl("/incidents"), form, {
        ...workflowRequest, headers: { "Content-Type": undefined },
      }),
    );
  },
  async update(id: string, payload: Partial<Omit<IncidentPayload, "projectId" | "incidentTypeId" | "severity">>) {
    return data<Incident>(await axiosApi.put(workflowUrl(`/incidents/${id}`), payload, workflowRequest));
  },
  async resolve(id: string, payload: { activeLevelId?: string; remarks?: string; dateAddressed?: string; resolutionClassification?: string; finalEvidenceIds?: string[]; confirmRequiredActionsCompleted?: boolean }) {
    return data<Incident>(await axiosApi.patch(workflowUrl(`/incidents/${id}/resolve`), payload, workflowRequest));
  },
  async completeWorkflowLevel(id: string, payload: { activeLevelId: string; remarks: string; resolutionClassification?: string; finalEvidenceIds?: string[]; confirmRequiredActionsCompleted?: boolean }) {
    return data<Incident>(await axiosApi.patch(workflowUrl(`/incidents/${id}/workflow/complete-level`), payload, workflowRequest));
  },
  async workflowHistory(id: string, page = 1): Promise<Page<EscalationEvent>> {
    return (await axiosApi.get(workflowUrl(`/incidents/${id}/workflow/history`), { ...workflowRequest, params: { page, limit: 20 } })).data;
  },
  async notificationHistory(id: string, page = 1): Promise<Page<EscalationEvent>> {
    return (await axiosApi.get(workflowUrl(`/incidents/${id}/notification-escalation/history`), { ...workflowRequest, params: { page, limit: 20 } })).data;
  },
  async cancel(id: string, reason: string) {
    return data<Incident>(await axiosApi.patch(workflowUrl(`/incidents/${id}/cancel`), { reason }, workflowRequest));
  },
  async remove(id: string) {
    await axiosApi.delete(workflowUrl(`/incidents/${id}`), workflowRequest);
  },
  async upload(id: string, files: File[], metadata: { section?: EvidenceSection; actionId?: string; caption?: string } = {}) {
    const form = new FormData();
    Object.entries(metadata).forEach(([key, value]) => { if (value) form.append(key, value); });
    uniqueFiles(files).forEach((file) => form.append("attachments", file));
    return data<IncidentAttachment[]>(
      await axiosApi.post(workflowUrl(`/incidents/${id}/attachments`), form, {
        ...workflowRequest, headers: { "Content-Type": undefined },
      }),
    );
  },
  async removeAttachment(id: string) {
    await axiosApi.delete(workflowUrl(`/incidents/attachments/${id}`), workflowRequest);
  },
  async fileBlob(id: string): Promise<Blob> {
    return (await axiosApi.get(workflowUrl(`/incidents/attachments/${id}/file`), { ...workflowRequest, responseType: "blob" })).data;
  },
  async downloadAttachment(attachment: IncidentAttachment) {
    const response = await axiosApi.get(workflowUrl(`/incidents/attachments/${attachment.id}/file`), { ...workflowRequest, responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = attachment.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  },
  async viewAttachment(attachment: IncidentAttachment) {
    const previewWindow = window.open("", "_blank");
    try {
      const response = await axiosApi.get(workflowUrl(`/incidents/attachments/${attachment.id}/file`), { ...workflowRequest, responseType: "blob" });
      const blob = new Blob([response.data], {
        type: attachment.mimeType || response.headers["content-type"] || "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      if (previewWindow) {
        previewWindow.location.href = url;
      } else {
        window.open(url, "_blank");
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      previewWindow?.close();
      throw error;
    }
  },
};

export type EvidenceSection = "INITIAL_REPORT" | "SITE_FINDINGS" | "IMMEDIATE_ACTION" | "ROOT_CAUSE" | "CONTRIBUTING_FACTORS" | "MITIGATION" | "RECOMMENDATIONS" | "ACTION" | "RESOLUTION";
