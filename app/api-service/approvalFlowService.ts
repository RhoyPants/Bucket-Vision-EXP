import axiosApi from "@/app/lib/axios";

// ============ TYPES ============
export interface ApprovalStep {
  id?: string;
  order: number;
  role: string;
  requiresAll: 0 | 1;
  canReject: boolean;
}

export interface ApprovalFlow {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  steps: ApprovalStep[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectApprovalConfig {
  projectId: string;
  projectName: string;
  approvalEnabled: boolean;
  approvalFlowId: string | null;
  currentApprovalFlow?: ApprovalFlow;
}

// ============ APPROVAL FLOWS ============

export async function createApprovalFlow(data: {
  name: string;
  description?: string;
  isDefault?: boolean;
  steps: ApprovalStep[];
}) {
  const response = await axiosApi.post("/admin/approval-flows", data);
  return response.data;
}

export async function getAllApprovalFlows(onlyActive?: boolean) {
  const url = onlyActive ? "/admin/approval-flows?active=true" : "/admin/approval-flows";
  const response = await axiosApi.get(url);
  return response.data;
}

export async function getApprovalFlow(flowId: string) {
  const response = await axiosApi.get(`/admin/approval-flows/${flowId}`);
  return response.data;
}

export async function updateApprovalFlow(
  flowId: string,
  data: Partial<{
    name: string;
    description: string;
    isDefault: boolean;
    isActive: boolean;
    steps: ApprovalStep[];
  }>
) {
  const response = await axiosApi.patch(`/admin/approval-flows/${flowId}`, data);
  return response.data;
}

export async function deleteApprovalFlow(flowId: string) {
  const response = await axiosApi.delete(`/admin/approval-flows/${flowId}`);
  return response.data;
}

export async function setDefaultFlow(flowId: string) {
  const response = await axiosApi.post(`/admin/approval-flows/${flowId}/set-default`);
  return response.data;
}

export async function getDefaultFlow() {
  const response = await axiosApi.get("/admin/approval-flows/default");
  return response.data;
}

export async function configureProjectApproval(
  projectId: string,
  data: {
    approvalFlowId?: string | null;
    approvalEnabled: boolean;
  }
) {
  const response = await axiosApi.patch(
    `/admin/projects/${projectId}/approval-config`,
    data
  );
  return response.data;
}

export async function getProjectApprovalConfig(projectId: string) {
  const response = await axiosApi.get(`/admin/projects/${projectId}/approval-config`);
  return response.data;
}
