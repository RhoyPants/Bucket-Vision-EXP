import axiosApi from "@/app/lib/axios";
import { Incident } from "./incidentService";
import { IncidentAction } from "./incidentCaseService";
import { Page, workflowRequest, workflowUrl } from "./incidentManagementService";

export type InboxTab = "my-reports" | "for-my-action" | "corrective-actions" | "all";
export interface IncidentInboxSummary {
  myReports: number;
  forMyAction: number;
  myCorrectiveActions: number;
  allIncidents: number;
  overdueWorkflowLevels: number;
  overdueCorrectiveActions: number;
  permissions?: { canViewAllIncidents?: boolean; canCreateIncident?: boolean };
}
export interface IncidentInboxItem extends Incident {
  project?: { id: string; name: string } | null;
  workflow?: Incident["workflow"] & { workflowName?: string | null; currentUserConfirmed?: boolean };
}
export interface CorrectiveActionInboxItem extends IncidentAction {
  evidenceCount?: number;
  incident?: Pick<Incident, "id" | "incidentNumber" | "title" | "severity" | "status">;
  incidentReport?: Pick<Incident, "id" | "incidentNumber" | "title" | "severity" | "status">;
  incidentNumber?: string;
  incidentTitle?: string;
  project?: { id: string; name: string };
  projectId?: string;
  projectName?: string;
  permissions: IncidentAction["permissions"] & { canViewIncident?: boolean };
}
export interface InboxFilters {
  page?: number;
  limit?: number;
  search?: string;
  projectId?: string;
  status?: string;
  severity?: string;
  overdue?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const get = async <T>(path: string, params?: object): Promise<T> =>
  (await axiosApi.get(workflowUrl(path), { ...workflowRequest, params })).data;

export const incidentInboxService = {
  summary: () => get<{ success: true; data: IncidentInboxSummary }>("/incidents/inbox-summary"),
  myReports: (params: InboxFilters) => get<Page<IncidentInboxItem>>("/incidents/my-reports", params),
  forMyAction: (params: InboxFilters) => get<Page<IncidentInboxItem>>("/incidents/for-my-action", params),
  correctiveActions: (params: InboxFilters & { actionType?: string; requiredForResolution?: boolean }) => get<Page<CorrectiveActionInboxItem>>("/incidents/my-corrective-actions", params),
  allIncidents: (params: InboxFilters) => get<Page<IncidentInboxItem>>("/incidents", params),
  projects: (search = "") => get<Page<{ id: string; name: string }>>("/incidents/filter-options/projects", { search, page: 1, limit: 100 }),
};
