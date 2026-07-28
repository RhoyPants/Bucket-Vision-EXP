import axiosApi from "@/app/lib/axios";

export type SubtaskHealthStatus = "CRITICAL" | "ONFLOW" | "HEALTHY" | "UNCLASSIFIED";

export interface SubtaskKpiConfig {
  projectId?: string;
  criticalBelow: number;
  healthyAtOrAbove: number;
  isCustom: boolean;
  updatedAt?: string | null;
  updatedBy?: { id: string; name: string; email?: string } | null;
}

export interface ComputedSubtaskKpi {
  project: { id: string; name: string };
  config: SubtaskKpiConfig;
  summary: {
    total: number;
    critical: number;
    onflow: number;
    healthy: number;
    unclassified: number;
    subtasks: {
      total: number;
      critical: number;
      onflow: number;
      healthy: number;
      unclassified: number;
    };
    configuredKpis: {
      total: number;
      critical: number;
      onflow: number;
      healthy: number;
      unclassified: number;
    };
  };
  subtasks: Array<{
    id: string;
    title: string;
    scope: { id: string; name: string };
    task: { id: string; title: string };
    actualProgress: number;
    expectedProgress: number;
    variance: number;
    projectedStartDate?: string | null;
    projectedEndDate?: string | null;
    status: SubtaskHealthStatus;
  }>;
  generatedAt: string;
}

const unwrap = <T>(response: { data?: { data?: T } | T }): T => {
  const body = response.data;
  return ((body && typeof body === "object" && "data" in body ? body.data : body) ?? null) as T;
};

export const SUBTASK_KPI_REFRESH_EVENT = "project-dashboard:subtask-kpi-refresh";

export const notifySubtaskKpiRefresh = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SUBTASK_KPI_REFRESH_EVENT));
  }
};

const computedRequests = new Map<string, Promise<ComputedSubtaskKpi>>();

export const subtaskKpiService = {
  async get(projectId: string) {
    const existing = computedRequests.get(projectId);
    if (existing) return existing;
    const request = axiosApi
      .get(`/project-dashboards/${projectId}/subtask-kpi`)
      .then((response) => unwrap<ComputedSubtaskKpi>(response))
      .finally(() => computedRequests.delete(projectId));
    computedRequests.set(projectId, request);
    return request;
  },
  async getConfig(projectId: string) {
    return unwrap<SubtaskKpiConfig>(
      await axiosApi.get(`/project-dashboards/${projectId}/subtask-kpi/config`),
    );
  },
  async updateConfig(projectId: string, criticalBelow: number, healthyAtOrAbove: number) {
    return unwrap<SubtaskKpiConfig>(
      await axiosApi.put(`/project-dashboards/${projectId}/subtask-kpi/config`, {
        criticalBelow,
        healthyAtOrAbove,
      }),
    );
  },
  async resetConfig(projectId: string) {
    return unwrap<SubtaskKpiConfig>(
      await axiosApi.delete(`/project-dashboards/${projectId}/subtask-kpi/config`),
    );
  },
};
