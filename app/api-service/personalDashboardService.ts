import { AxiosResponse } from "axios";
import axiosApi from "@/app/lib/axios";

export type KpiStatus = "CRITICAL" | "ONFLOW" | "HEALTHY" | "UNCLASSIFIED";
export type KpiRuleStatus = "CRITICAL" | "ONFLOW" | "HEALTHY";
export type ThresholdOperator = "LT" | "LTE" | "EQ" | "GTE" | "GT" | "BETWEEN";
export type SourceType = "PROJECT" | "SCOPE" | "TASK" | "SUBTASK";

export interface DashboardSummary {
  totalKpis: number;
  criticalKpis: number;
  onflowKpis: number;
  healthyKpis: number;
  unclassifiedKpis: number;
}

export interface PersonalDashboard {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  project?: {
    id: string;
    name: string;
    progress?: number;
  };
  summary?: DashboardSummary;
  kpis?: PersonalDashboardKpi[];
  charts?: DashboardChartConfig[];
}

export interface DashboardChartConfig {
  chartType: string;
  isEnabled: boolean;
  sortOrder: number;
}

export interface PersonalDashboardKpi {
  id: string;
  dashboardId?: string;
  name: string;
  description?: string;
  unit?: string;
  field?: string;
  sourceType?: SourceType;
  projectId?: string;
  scopeId?: string | null;
  taskId?: string | null;
  subtaskId?: string | null;
  currentValue?: number;
  preview?: SourcePreview | null;
  status?: KpiStatus;
  thresholds?: KpiThreshold[];
  sourceDetails?: {
    title?: string;
    expectedStartDate?: string | null;
    expectedEndDate?: string | null;
  } | null;
}

export interface KpiThreshold {
  id?: string;
  kpiId?: string;
  status: KpiRuleStatus;
  operator: ThresholdOperator | "";
  value1: number | "";
  value2?: number | "" | null;
  dateOperator?: ThresholdOperator | "" | null;
  dateValue1?: string | null;
  dateValue2?: string | null;
}

export interface SourceOptions {
  project: {
    id: string;
    name: string;
    progress?: number;
    expectedStartDate?: string | null;
    expectedEndDate?: string | null;
  };
  fieldOptions: {
    field: string;
    unit: string;
    label: string;
  }[];
  scopes: {
    id: string;
    name: string;
    progress?: number;
    expectedStartDate?: string | null;
    expectedEndDate?: string | null;
    tasks?: {
      id: string;
      title: string;
      progress?: number;
      expectedStartDate?: string | null;
      expectedEndDate?: string | null;
      subtasks?: {
        id: string;
        title: string;
        progress?: number;
        expectedStartDate?: string | null;
        expectedEndDate?: string | null;
      }[];
    }[];
  }[];
}

export interface SourcePreview {
  sourceType: SourceType;
  field: string;
  unit: string;
  currentProgress?: number;
  currentValue?: number;
  startDate?: string | null;
  endDate?: string | null;
  expectedStartDate?: string | null;
  expectedEndDate?: string | null;
  duration?: number;
  daysRemaining?: number;
  slaStatus?: string;
  completionPercentage?: number;
  delayIndicator?: string;
}

export interface ChartData {
  summary?: DashboardSummary;
  scurve?: {
    status?: string;
    data?: { date: string; planned: number; actual: number }[];
  };
  progressTrend?: { date: string; planned?: number; actual?: number }[];
  kpiStatusDistribution?: DashboardSummary;
  taskCompletion?: {
    completed: number;
    pending: number;
    total: number;
  };
}

const unwrapData = <T>(response: AxiosResponse): T => response.data?.data ?? response.data;

export async function getPersonalDashboards() {
  const response = await axiosApi.get("/personal-dashboards");
  return {
    count: response.data?.count ?? 0,
    data: (response.data?.data ?? []) as PersonalDashboard[],
  };
}

export async function createPersonalDashboard(data: {
  name: string;
  description?: string;
  projectId: string;
}) {
  const response = await axiosApi.post("/personal-dashboards", data);
  return unwrapData<PersonalDashboard>(response);
}

export async function getPersonalDashboardDetail(id: string) {
  const response = await axiosApi.get(`/personal-dashboards/${id}`);
  return unwrapData<PersonalDashboard>(response);
}

export async function updatePersonalDashboard(
  id: string,
  data: { name: string; description?: string }
) {
  const response = await axiosApi.put(`/personal-dashboards/${id}`, data);
  return unwrapData<PersonalDashboard>(response);
}

export async function deletePersonalDashboard(id: string) {
  const response = await axiosApi.delete(`/personal-dashboards/${id}`);
  return unwrapData<{ id: string }>(response);
}

export async function getKpiSourceOptions(id: string) {
  const response = await axiosApi.get(`/personal-dashboards/${id}/source-options`);
  return unwrapData<SourceOptions>(response);
}

export async function previewKpiSource(
  id: string,
  params: { scopeId?: string; taskId?: string; subtaskId?: string }
) {
  const response = await axiosApi.get(`/personal-dashboards/${id}/source-preview`, {
    params,
  });
  return unwrapData<SourcePreview>(response);
}

export async function createDashboardKpi(
  id: string,
  data: {
    name: string;
    description?: string;
    scopeId?: string;
    taskId?: string;
    subtaskId?: string;
    thresholds: KpiThreshold[];
  }
) {
  const response = await axiosApi.post(`/personal-dashboards/${id}/kpis`, data);
  return unwrapData<PersonalDashboardKpi>(response);
}

export async function updateDashboardKpi(
  id: string,
  kpiId: string,
  data: {
    name: string;
    description?: string;
    thresholds: KpiThreshold[];
  }
) {
  const response = await axiosApi.put(`/personal-dashboards/${id}/kpis/${kpiId}`, data);
  return unwrapData<PersonalDashboardKpi>(response);
}

export async function deleteDashboardKpi(id: string, kpiId: string) {
  const response = await axiosApi.delete(`/personal-dashboards/${id}/kpis/${kpiId}`);
  return unwrapData<{ id: string }>(response);
}

export async function updateDashboardCharts(id: string, charts: DashboardChartConfig[]) {
  const response = await axiosApi.put(`/personal-dashboards/${id}/charts`, { charts });
  return unwrapData<{ id: string; charts: DashboardChartConfig[] }>(response);
}

export async function getDashboardChartData(id: string) {
  const response = await axiosApi.get(`/personal-dashboards/${id}/charts/data`);
  return unwrapData<ChartData>(response);
}
