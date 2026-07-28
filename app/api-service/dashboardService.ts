import axiosApi from "@/app/lib/axios";

export type DashboardHealthStatus = "CRITICAL" | "ONFLOW" | "HEALTHY" | "UNCLASSIFIED";

export interface GlobalDashboardSummary {
  critical: number;
  onflow: number;
  healthy: number;
  unclassified: number;
  totalKpis: number;
  incidentReports: number;
  activeProjects: number;
  totalProjects: number;
}

export interface DashboardTrendMetric {
  value: number;
  change: number;
  changePercentage: number;
  direction: "UP" | "DOWN" | "FLAT";
  points: Array<{ date: string; value: number | null }>;
}

export interface GlobalDashboardTrends {
  period: string;
  dateFrom: string;
  dateTo: string;
  isComplete: boolean;
  note?: string | null;
  critical: DashboardTrendMetric;
  onflow: DashboardTrendMetric;
  healthy: DashboardTrendMetric;
  incidentReports: DashboardTrendMetric;
  activeProjects: DashboardTrendMetric;
  averageProjectProgress: DashboardTrendMetric;
}

export interface GlobalDashboardProject {
  id: string;
  name: string;
  description?: string | null;
  progress?: number;
  version?: string | number | null;
  versionLabel?: string | null;
  versionNumber?: number;
  status?: string;
  healthStatus?: DashboardHealthStatus;
  health?: DashboardHealthStatus;
  kpiStatus?: DashboardHealthStatus;
  expectedStartDate?: string | null;
  expectedEndDate?: string | null;
  businessUnit?: string | { code?: string; name?: string } | null;
  location?: string | { cityName?: string; provinceName?: string; regionName?: string; barangayName?: string } | null;
  kpiSummary?: {
    total: number;
    critical: number;
    onflow: number;
    healthy: number;
    unclassified: number;
    subtasks?: { total: number; critical: number; onflow: number; healthy: number; unclassified: number };
    configuredKpis?: { total: number; critical: number; onflow: number; healthy: number; unclassified: number };
  };
  topSubtasks?: GlobalDashboardSubtask[];
}

export interface GlobalDashboardSubtask {
  id: string;
  projectId?: string;
  title: string;
  status?: DashboardHealthStatus;
  health?: DashboardHealthStatus;
  actualProgress?: number;
  expectedProgress?: number;
  variance?: number;
  project?: { id?: string; name?: string } | null;
  scope?: { id?: string; name?: string } | null;
  task?: { id?: string; title?: string } | null;
}

export interface GlobalDashboardIncident {
  id: string;
  incidentNumber?: string;
  title: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status?: string;
  dateRaised?: string | null;
  project?: { id?: string; name?: string } | null;
  reportedBy?: { name?: string } | null;
}

export interface GlobalDashboardReview {
  id?: string;
  projectId?: string;
  name?: string;
  projectName?: string;
  status?: string;
  progress?: number;
  submittedAt?: string | null;
  updatedAt?: string | null;
  project?: { id?: string; name?: string; status?: string } | null;
}

export interface GlobalDashboardData {
  summary: GlobalDashboardSummary;
  trends?: GlobalDashboardTrends;
  topProjects: GlobalDashboardProject[];
  topSubtasks: GlobalDashboardSubtask[];
  topIncidents: GlobalDashboardIncident[];
  overallProjects: {
    total: number;
    statusDistribution: Array<{ status?: string; label?: string; count?: number; value?: number }>;
    progress: {
      average: number;
      distribution: Array<{ range?: string; label?: string; count?: number; value?: number }>;
    };
  };
  pendingReviewAndApproval: GlobalDashboardReview[];
  generatedAt: string;
}

export const dashboardService = {
  async get(): Promise<GlobalDashboardData> {
    const response = await axiosApi.get("/dashboard");
    return response.data?.data ?? response.data;
  },
};
