import axiosApi from "@/app/lib/axios";

export type MaintenanceKind = "scope" | "task" | "subtask";

export interface MaintenanceRelation {
  id: string;
  code?: string;
  name?: string;
}

export interface MaintenanceRecord {
  id: string;
  maintenanceTableId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  order?: number;
  isActive: boolean;
  scopeMaintenanceIds?: string[];
  taskMaintenanceIds?: string[];
  scopes?: MaintenanceRelation[];
  scopeMaintenances?: MaintenanceRelation[];
  allowedScopes?: MaintenanceRelation[];
  tasks?: MaintenanceRelation[];
  taskMaintenances?: MaintenanceRelation[];
  allowedTasks?: MaintenanceRelation[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceHierarchyTask extends MaintenanceRecord {
  subtasks?: MaintenanceRecord[];
}

export interface MaintenanceHierarchyScope extends MaintenanceRecord {
  tasks?: MaintenanceHierarchyTask[];
}

export type ProjectMaintenanceHierarchyStatus =
  | "NO_ASSIGNED_WBS"
  | "EMPTY_ASSIGNED_WBS"
  | "AVAILABLE";

export interface ProjectMaintenanceHierarchyMeta {
  status: ProjectMaintenanceHierarchyStatus;
  message: string | null;
  counts: {
    templates: number;
    scopes: number;
    tasks: number;
    subtasks: number;
  };
}

export interface ProjectMaintenanceHierarchyResult {
  data: MaintenanceHierarchyScope[];
  meta?: ProjectMaintenanceHierarchyMeta;
}

export interface MaintenancePayload {
  maintenanceTableId?: string;
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  scopeMaintenanceIds?: string[];
  taskMaintenanceIds?: string[];
}

export interface MaintenanceTableBusinessUnit {
  businessUnitId: string;
  businessUnit?: { id: string; code?: string; name?: string; isActive?: boolean };
}

export interface MaintenanceTable {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  businessUnits: MaintenanceTableBusinessUnit[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceTablePayload {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  businessUnitIds?: string[];
}

export interface BulkMaintenanceStatusPayload {
  scopeIds: string[];
  taskIds: string[];
  subtaskIds: string[];
  isActive: boolean;
  cascade?: boolean;
}

export interface BulkMaintenanceStatusResult {
  scopeIds: string[];
  taskIds: string[];
  subtaskIds: string[];
}

const baseRoute = "/admin/work-breakdown-maintenance";

const pluralPath: Record<MaintenanceKind, string> = {
  scope: "scopes",
  task: "tasks",
  subtask: "subtasks",
};

const maintenanceListInFlight = new Map<MaintenanceKind, Promise<MaintenanceRecord[]>>();
const relatedListInFlight = new Map<string, Promise<MaintenanceRecord[]>>();
let hierarchyInFlight: Promise<MaintenanceHierarchyScope[]> | null = null;
const projectHierarchyInFlight = new Map<string, Promise<ProjectMaintenanceHierarchyResult>>();

const dedupeRelatedRequest = (key: string, request: () => Promise<MaintenanceRecord[]>) => {
  const existing = relatedListInFlight.get(key);
  if (existing) return existing;
  const pending = request().finally(() => relatedListInFlight.delete(key));
  relatedListInFlight.set(key, pending);
  return pending;
};

const unwrapList = (payload: unknown): MaintenanceRecord[] => {
  if (Array.isArray(payload)) return payload as MaintenanceRecord[];
  if (!payload || typeof payload !== "object") return [];

  const record = payload as {
    data?: unknown;
    items?: unknown;
    records?: unknown;
  };

  if (Array.isArray(record.data)) return record.data as MaintenanceRecord[];
  if (Array.isArray(record.items)) return record.items as MaintenanceRecord[];
  if (Array.isArray(record.records)) return record.records as MaintenanceRecord[];
  if (record.data && typeof record.data === "object") {
    return unwrapList(record.data);
  }
  return [];
};

export async function getMaintenanceRecords(kind: MaintenanceKind) {
  const existing = maintenanceListInFlight.get(kind);
  if (existing) return existing;

  const request = axiosApi
    .get(`${baseRoute}/${pluralPath[kind]}?active=false`)
    .then((response) => unwrapList(response.data))
    .finally(() => maintenanceListInFlight.delete(kind));
  maintenanceListInFlight.set(kind, request);
  return request;
}

export async function getMaintenanceHierarchy() {
  if (hierarchyInFlight) return hierarchyInFlight;
  hierarchyInFlight = axiosApi
    .get(`${baseRoute}/hierarchy?active=false`)
    .then((response) => unwrapList(response.data) as MaintenanceHierarchyScope[])
    .finally(() => {
      hierarchyInFlight = null;
    });
  return hierarchyInFlight;
}

export async function getProjectMaintenanceHierarchyResult(projectId: string) {
  const existing = projectHierarchyInFlight.get(projectId);
  if (existing) return existing;
  const request = axiosApi
    .get(`${baseRoute}/hierarchy`, { params: { projectId } })
    .then((response) => ({
      data: unwrapList(response.data) as MaintenanceHierarchyScope[],
      meta: response.data?.meta as ProjectMaintenanceHierarchyMeta | undefined,
    }))
    .finally(() => projectHierarchyInFlight.delete(projectId));
  projectHierarchyInFlight.set(projectId, request);
  return request;
}

export async function getProjectMaintenanceHierarchy(projectId: string) {
  return (await getProjectMaintenanceHierarchyResult(projectId)).data;
}

export async function getMaintenanceTables() {
  const response = await axiosApi.get(`${baseRoute}/tables`);
  return unwrapList(response.data) as unknown as MaintenanceTable[];
}

export async function createMaintenanceTable(payload: MaintenanceTablePayload) {
  const response = await axiosApi.post(`${baseRoute}/tables`, payload);
  return (response.data?.data ?? response.data) as MaintenanceTable;
}

export async function updateMaintenanceTable(id: string, payload: MaintenanceTablePayload) {
  const response = await axiosApi.patch(`${baseRoute}/tables/${id}`, payload);
  return (response.data?.data ?? response.data) as MaintenanceTable;
}

export async function getTasksForScope(scopeMaintenanceId: string) {
  return dedupeRelatedRequest(`scope:${scopeMaintenanceId}`, async () => {
    const response = await axiosApi.get(`${baseRoute}/tasks`, {
      params: { scopeMaintenanceId, active: false },
    });
    return unwrapList(response.data);
  });
}

export async function getSubtasksForTask(taskMaintenanceId: string) {
  return dedupeRelatedRequest(`task:${taskMaintenanceId}`, async () => {
    const response = await axiosApi.get(`${baseRoute}/subtasks`, {
      params: { taskMaintenanceId, active: false },
    });
    return unwrapList(response.data);
  });
}

export async function createMaintenanceRecord(
  kind: MaintenanceKind,
  payload: MaintenancePayload,
) {
  const response = await axiosApi.post(
    `${baseRoute}/${pluralPath[kind]}`,
    payload,
  );
  return response.data?.data ?? response.data;
}

export async function updateMaintenanceRecord(
  kind: MaintenanceKind,
  id: string,
  payload: MaintenancePayload,
) {
  const response = await axiosApi.patch(
    `${baseRoute}/${pluralPath[kind]}/${id}`,
    payload,
  );
  return response.data?.data ?? response.data;
}

export async function bulkUpdateMaintenanceStatus(
  payload: BulkMaintenanceStatusPayload,
): Promise<BulkMaintenanceStatusResult> {
  const response = await axiosApi.patch(`${baseRoute}/bulk-status`, payload);
  const body = response.data?.data ?? response.data;
  const affected = body?.affected ?? body?.affectedIds ?? body;
  const ids = (value: unknown): string[] =>
    Array.isArray(value)
      ? value
          .map((item) =>
            typeof item === "string"
              ? item
              : item && typeof item === "object" && "id" in item
                ? String(item.id)
                : "",
          )
          .filter(Boolean)
      : [];

  return {
    scopeIds: ids(
      affected?.scopeIds ?? affected?.affectedScopeIds ?? affected?.scopes,
    ),
    taskIds: ids(
      affected?.taskIds ?? affected?.affectedTaskIds ?? affected?.tasks,
    ),
    subtaskIds: ids(
      affected?.subtaskIds ??
        affected?.affectedSubtaskIds ??
        affected?.subtasks,
    ),
  };
}

export async function reorderScopes(orderedIds: string[]) {
  const response = await axiosApi.patch(`${baseRoute}/scopes/reorder`, {
    orderedIds,
  });
  return response.data?.data ?? response.data;
}

export async function reorderTasksForScope(
  scopeId: string,
  orderedIds: string[],
) {
  const response = await axiosApi.patch(
    `${baseRoute}/scopes/${scopeId}/tasks/reorder`,
    { orderedIds },
  );
  return response.data?.data ?? response.data;
}

export async function reorderSubtasksForTask(
  taskId: string,
  orderedIds: string[],
) {
  const response = await axiosApi.patch(
    `${baseRoute}/tasks/${taskId}/subtasks/reorder`,
    { orderedIds },
  );
  return response.data?.data ?? response.data;
}
