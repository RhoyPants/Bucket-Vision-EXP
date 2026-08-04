import axiosApi from "@/app/lib/axios";

export type ProgressReportType = "DAILY" | "WEEKLY";
export type ReportHealth =
  | "HEALTHY"
  | "AT_RISK"
  | "DELAYED"
  | "UNCLASSIFIED";
export type ProgressPaceStatus =
  | "ON_OR_ABOVE_PLAN"
  | "BELOW_PLAN"
  | "UNCLASSIFIED";
export type ProgressAuditAssessment = "CONSISTENT" | "REVIEW_REQUIRED";
export type ProgressAuditCheck =
  | "CUMULATIVE_MISMATCH"
  | "PROGRESS_DECREASED"
  | "BEFORE_PLANNED_START"
  | "AFTER_PLANNED_END_INCOMPLETE"
  | string;

export interface ReportCalendarDate {
  date: string;
  hasProgress: boolean;
  progressUpdates: number;
  photos: number;
  incidents: number;
  reportGenerated: boolean;
}

export interface ReportCalendarData {
  project: {
    id: string;
    name: string;
    startDate?: string | null;
  };
  month: string;
  timezone: string;
  dates: ReportCalendarDate[];
}

export interface ReportMetrics {
  expectedProgress: number;
  actualProgress: number;
  variance: number;
  health: ReportHealth;
  periodProgress: number;
}

export interface ReportSubtask {
  id: string;
  title: string;
  description?: string | null;
  projectedStartDate?: string | null;
  projectedEndDate?: string | null;
  metrics: ReportMetrics;
}

export interface ReportTask {
  id: string;
  title: string;
  description?: string | null;
  metrics: ReportMetrics;
  subtasks: ReportSubtask[];
}

export interface ReportScope {
  id: string;
  name: string;
  description?: string | null;
  metrics: ReportMetrics;
  tasks: ReportTask[];
}

export interface ProjectReportPreview {
  report: {
    type: ProgressReportType;
    timezone: string;
    periodStart: string;
    periodEnd: string;
    generatedAt: string;
  };
  project: {
    id: string;
    name: string;
    pin?: string | null;
    description?: string | null;
    location?: { address?: string | null } | null;
    startDate?: string | null;
    expectedEndDate?: string | null;
    owner?: {
      id: string;
      name: string;
      email?: string | null;
    } | null;
  };
  summary: {
    expectedProgress: number;
    actualProgress: number;
    openingProgress: number | null;
    periodProgress: number;
    totalProjectProgress: number;
    variance: number;
    health: ReportHealth;
  };
  sCurve: Array<{
    date: string;
    planned: number;
    actual: number | null;
  }>;
  incidents: Array<{
    id: string;
    incidentNumber: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    dateRaised: string;
    dateAddressed?: string | null;
    remarks?: string | null;
    scope?: { id: string; name: string } | null;
    task?: { id: string; title: string } | null;
    subtask?: { id: string; title: string } | null;
  }>;
  photos: Array<{
    progressLogId: string;
    date: string;
    caption?: string | null;
    uploadedBy?: { id: string; name: string } | null;
    scope?: { id: string; name: string } | null;
    task?: { id: string; title: string } | null;
    subtask?: { id: string; title: string } | null;
    url: string;
    name?: string | null;
  }>;
  detailedProgress: ReportScope[];
  progressAudit?: {
    summary: {
      totalEntries: number;
      contributors: number;
      subtasksUpdated: number;
      deliveredDuringPeriod: number;
      plannedDuringPeriod: number;
      paceVariance: number;
      paceStatus: ProgressPaceStatus;
      reviewRequiredEntries: number;
    };
    entries: Array<{
      progressLogId: string;
      date: string;
      submittedAt: string;
      lastUpdatedAt: string;
      submittedBy: {
        id: string;
        name: string;
        email?: string | null;
      };
      scope: { id: string; name: string };
      task: { id: string; title: string };
      subtask: { id: string; title: string };
      dailyProgress: number;
      previousProgress: number;
      progressAfter: number;
      subtaskStatusAfter: "PENDING" | "ONGOING" | "DONE";
      expectedProgressAfter: number;
      varianceAfter: number;
      healthAfter: ReportHealth;
      paceStatus: ProgressPaceStatus;
      assessment: ProgressAuditAssessment;
      checks: ProgressAuditCheck[];
      remarks?: string | null;
      location?: string | null;
      coordinates?: {
        latitude: number;
        longitude: number;
      } | null;
      photoCount: number;
    }>;
    assessmentNote: string;
  };
  calculationRules: {
    actual: string;
    expected: string;
    aggregation: string;
    healthThresholds: {
      delayedBelowVariance: number;
      healthyAtOrAboveVariance: number;
    };
    limitations: string[];
  };
  emptyStates: {
    noIncidents: boolean;
    noPhotos: boolean;
    noProgressUpdates: boolean;
  };
}

type DailyReportParams = {
  type: "DAILY";
  date: string;
  timezone?: "Asia/Manila";
};

type WeeklyReportParams = {
  type: "WEEKLY";
  dateFrom: string;
  dateTo: string;
  timezone?: "Asia/Manila";
};

export type ReportPreviewParams = DailyReportParams | WeeklyReportParams;

const unwrap = <T>(response: { data?: { data?: T } | T }): T => {
  const body = response.data;
  return (body && typeof body === "object" && "data" in body
    ? body.data
    : body) as T;
};

export async function getReportCalendar(projectId: string, month: string) {
  return unwrap<ReportCalendarData>(
    await axiosApi.get(`/reports/projects/${projectId}/calendar`, {
      params: { month },
    }),
  );
}

export async function getProjectReportPreview(
  projectId: string,
  params: ReportPreviewParams,
) {
  return unwrap<ProjectReportPreview>(
    await axiosApi.get(`/reports/projects/${projectId}/preview`, {
      params: { ...params, timezone: params.timezone ?? "Asia/Manila" },
    }),
  );
}

export async function downloadProjectReportPdf(
  projectId: string,
  params: ReportPreviewParams,
  mode?: "download",
) {
  return axiosApi.get(`/reports/projects/${projectId}/pdf`, {
    params: {
      ...params,
      timezone: params.timezone ?? "Asia/Manila",
      ...(mode ? { mode } : {}),
    },
    responseType: "blob",
    timeout: 60_000,
  });
}

export async function downloadProjectReportExcel(
  projectId: string,
  params: ReportPreviewParams,
) {
  return axiosApi.get(`/reports/projects/${projectId}/excel`, {
    params: {
      ...params,
      timezone: params.timezone ?? "Asia/Manila",
    },
    responseType: "blob",
    timeout: 60_000,
  });
}
