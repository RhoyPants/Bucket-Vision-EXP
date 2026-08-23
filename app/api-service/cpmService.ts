import axiosApi from "@/app/lib/axios";

export type CpmStatus = "NOT_CONFIGURED" | "CALCULATED" | "INVALID";

export interface CpmProject {
  id: string;
  name: string;
  startDate: string;
  expectedEndDate: string;
}

export interface CpmCalendar {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  includeGlobalHolidays: boolean;
}

export interface CpmActivity {
  subtaskId: string;
  subtaskTitle: string;
  scopeId: string;
  scopeName: string;
  taskId: string;
  taskTitle: string;
  projectedStartDate: string;
  projectedEndDate: string;
  durationDays: number;
  predecessorIds: string[];
  earlyStart: number | null;
  earlyFinish: number | null;
  lateStart: number | null;
  lateFinish: number | null;
  slackDays: number | null;
  isCritical: boolean;
  calculatedStartDate: string | null;
  calculatedFinishDate: string | null;
}

export interface CpmSummary {
  status: CpmStatus;
  projectDurationDays: number | null;
  calculatedStartDate: string | null;
  calculatedFinishDate: string | null;
  expectedEndDate: string;
  deadlineVarianceDays: number | null;
  meetsDeadline: boolean | null;
  criticalActivityCount: number;
  criticalPaths: string[][];
}

export interface CpmWarning {
  code: string;
  message: string;
}

export interface CpmData {
  project: CpmProject;
  calendar: CpmCalendar;
  activities: CpmActivity[];
  summary: CpmSummary;
  warnings: CpmWarning[];
}

export interface CpmDependency {
  predecessorSubtaskId: string;
  successorSubtaskId: string;
}

interface CpmResponse {
  success: boolean;
  message?: string;
  data: CpmData;
}

export async function getProjectCpm(projectId: string): Promise<CpmData> {
  const response = await axiosApi.get<CpmResponse>(`/projects/${projectId}/cpm`);
  return response.data.data;
}

export async function saveProjectCpmDependencies(
  projectId: string,
  dependencies: CpmDependency[],
): Promise<CpmData> {
  const response = await axiosApi.put<CpmResponse>(
    `/projects/${projectId}/cpm/dependencies`,
    { dependencies },
  );
  return response.data.data;
}

export async function previewProjectCpm(
  projectId: string,
  dependencies: CpmDependency[],
): Promise<CpmData> {
  const response = await axiosApi.post<CpmResponse>(
    `/projects/${projectId}/cpm/preview`,
    { dependencies },
  );
  return response.data.data;
}
