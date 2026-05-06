import axiosApi from "@/app/lib/axios";

// ============ TYPES ============

export interface VersionSummary {
  scopesCloned: number;
  tasksCloned: number;
  subtasksCloned: number;
  teamMembersCloned: number;
  attachmentsCloned: number;
  reportsCloned: number;
  timelinesCloned: number;
}

export interface ProjectVersion {
  id: string;
  name: string;
  versionNumber: number;
  versionLabel: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "FOR_REVIEW" | "FOR_APPROVAL" | "NEEDS_REVISION" | "REJECTED";
  isActive: boolean;
  isLatestVersion: boolean;
  pin: string;
  totalBudget: number;
  expectedEndDate: string;
  projectEndDate?: string;
  progress: number;
  createdAt: string;
  updatedAt?: string;
  isLocked?: boolean;
  description?: string;
}

export interface CreateVersionPayload {
  projectedEndDate: string;
  startDate: string;
  totalBudget: number;
  remarks?: string;
}

export interface CreateVersionResponse {
  success: boolean;
  data: {
    newProject: ProjectVersion;
    summary: VersionSummary;
  };
  message: string;
}

export interface VersionHistoryItem {
  id: string;
  versionNumber: number;
  versionLabel: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "FOR_REVIEW" | "FOR_APPROVAL" | "NEEDS_REVISION" | "REJECTED";
  isActive: boolean;
  isLocked: boolean;
  totalBudget: number;
  expectedEndDate: string;
  progress: number;
  description?: string;
  createdAt: string;
  _count: {
    scopes: number;
    approvals: number;
  };
}

export interface VersionComparison {
  success: boolean;
  data: {
    v1: {
      versionNumber: number;
      progress: number;
      totalBudget: number;
      expectedEndDate: string;
      status: string;
    };
    v2: {
      versionNumber: number;
      progress: number;
      totalBudget: number;
      expectedEndDate: string;
      status: string;
    };
    changes: {
      budgetDiff: number;
      endDateDiff: number;
      progressSame: boolean;
    };
  };
}

export interface ActiveVersionResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    versionNumber: number;
    pin: string;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    isActive: boolean;
    progress: number;
    totalBudget: number;
    expectedEndDate: string;
    scopes: any[];
    owner: {
      id: string;
      name: string;
      email: string;
    };
    approvals: any[];
  };
}

// ============ VERSION ENDPOINTS ============

/**
 * Create a new version of a project
 */
export async function createNewVersion(projectId: string, payload: CreateVersionPayload) {
  const response = await axiosApi.post(`/versioning/${projectId}/create`, payload);
  return response.data;
}

/**
 * Get all versions by PIN
 */
export async function getVersionsByPin(pin: string) {
  const response = await axiosApi.get(`/versioning/pin/${pin}`);
  return response.data;
}

/**
 * Get version history for a specific version
 */
export async function getVersionHistory(projectId: string) {
  const response = await axiosApi.get(`/versioning/${projectId}/history`);
  return response.data;
}

/**
 * Compare two versions
 */
export async function compareVersions(v1: string, v2: string) {
  const response = await axiosApi.get(`/versioning/compare/${v1}/${v2}`);
  return response.data;
}

/**
 * Get active version by PIN
 */
export async function getActiveVersionByPin(pin: string) {
  const response = await axiosApi.get(`/versioning/active/pin/${pin}`);
  return response.data;
}

/**
 * Delete a draft version
 */
export async function deleteDraftVersion(projectId: string) {
  const response = await axiosApi.delete(`/versioning/${projectId}/delete-draft`);
  return response.data;
}

/**
 * Get full version detail with all nested relations (scopes, tasks, subtasks, etc.)
 */
export async function getVersionDetail(projectId: string) {
  const response = await axiosApi.get(`/versioning/${projectId}/detail`);
  return response.data;
}
