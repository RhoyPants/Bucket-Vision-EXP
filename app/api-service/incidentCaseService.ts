import axiosApi from "@/app/lib/axios";
import { allPages, LookupOption, Page, workflowRequest, workflowUrl } from "./incidentManagementService";
import type { EscalationEvent, EvidenceSection, IncidentAttachment, IncidentPerson } from "./incidentService";

export interface Investigation {
  incidentId: string;
  revision: number;
  siteFindings: string | null;
  rootCause: string | null;
  contributingFactors: string | null;
  mitigation: string | null;
  recommendations: string | null;
  updatedBy: IncidentPerson | null;
  updatedAt: string | null;
  evidence: IncidentAttachment[];
  permissions: { canEdit: boolean; canManageEvidence: boolean };
}
export type InvestigationFields = Pick<Investigation, "siteFindings" | "rootCause" | "contributingFactors" | "mitigation" | "recommendations">;
export interface ActionPayload {
  title: string;
  description: string;
  actionType: "CORRECTIVE" | "PREVENTIVE";
  ownerId: string;
  dueDate: string;
  requiredForResolution: boolean;
}
export interface IncidentAction extends ActionPayload {
  id: string;
  incidentId: string;
  revision: number;
  owner: IncidentPerson;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  isOverdue: boolean;
  completionRemarks?: string | null;
  cancellationReason?: string | null;
  completedAt?: string | null;
  evidence?: IncidentAttachment[];
  permissions: { canEdit: boolean; canUpdateProgress: boolean; canComplete: boolean; canCancel: boolean; canManageEvidence?: boolean };
}
export interface ActionUpdate extends Partial<ActionPayload> {
  revision: number;
  status?: IncidentAction["status"];
  completionRemarks?: string;
  cancellationReason?: string;
  requirementChangeReason?: string;
}
export interface ResolutionReadiness {
  activeLevelId?: string | null;
  canResolve: boolean;
  resolverRule?: "ANY_ONE" | "ALL";
  confirmedCount?: number;
  eligibleResolverCount?: number;
  requiredOpenActionCount: number;
  blockers: { code: string; message: string; actionIds?: string[] }[];
  classificationOptions?: { value: string; label: string }[];
}
export interface CaseEvent extends EscalationEvent { actor?: IncidentPerson | null; summary?: string }
const url = (id: string, part: string) => workflowUrl(`/incidents/${id}/${part}`);
export const incidentCaseService = {
  async investigation(id: string): Promise<Investigation> {
    return (await axiosApi.get(url(id, "investigation"), workflowRequest)).data.data;
  },
  async saveInvestigation(id: string, payload: Partial<InvestigationFields> & { revision: number }): Promise<Investigation> {
    return (await axiosApi.patch(url(id, "investigation"), payload, workflowRequest)).data.data;
  },
  async actions(id: string, page = 1): Promise<Page<IncidentAction>> {
    return (await axiosApi.get(url(id, "actions"), { ...workflowRequest, params: { page, limit: 20 } })).data;
  },
  owners(id: string): Promise<LookupOption[]> {
    return allPages(async (page) => (await axiosApi.get(url(id, "action-owner-options"), { ...workflowRequest, params: { page, limit: 100 } })).data);
  },
  async createAction(id: string, payload: ActionPayload): Promise<IncidentAction> {
    return (await axiosApi.post(url(id, "actions"), payload, workflowRequest)).data.data;
  },
  async updateAction(id: string, actionId: string, payload: ActionUpdate): Promise<IncidentAction> {
    return (await axiosApi.patch(url(id, `actions/${actionId}`), payload, workflowRequest)).data.data;
  },
  async readiness(id: string): Promise<ResolutionReadiness> {
    return (await axiosApi.get(url(id, "resolution-readiness"), workflowRequest)).data.data;
  },
  async history(id: string, page = 1): Promise<Page<CaseEvent>> {
    return (await axiosApi.get(url(id, "history"), { ...workflowRequest, params: { page, limit: 20 } })).data;
  },
  async updateEvidence(id: string, payload: { section?: EvidenceSection; actionId?: string; caption?: string; displayOrder?: number }): Promise<IncidentAttachment> {
    return (await axiosApi.patch(workflowUrl(`/incidents/attachments/${id}`), payload, workflowRequest)).data.data;
  },
  async exportPdf(id: string, incidentNumber: string) {
    try {
      const response = await axiosApi.get(url(id, "report.pdf"), { ...workflowRequest, responseType: "blob" });
      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${incidentNumber}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      // JSON API failures arrive as blobs when requesting a PDF.
      const response = (error as { response?: { data?: unknown } }).response;
      if (response?.data instanceof Blob) {
        try { response.data = JSON.parse(await response.data.text()); } catch { /* Retain the original HTTP error. */ }
      }
      throw error;
    }
  },
};
