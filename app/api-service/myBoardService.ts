/**
 * MyBoard Service - Types and Helpers
 * Redux controllers handle all API calls via Redux dispatch
 * This file only exports types and client-side utilities
 */

export interface SubtaskCardData {
  id: string;
  title: string;
  subtaskName?: string;
  taskName?: string;
  scopeName?: string;
  projectName?: string;
  projectId?: string;
  scopeId?: string;
  taskId?: string;
  assignorName?: string;
  assigneeNames?: string[];
  createdAt?: string;
  status: number;
  progress: number;
  priority?: string;
  remarks?: string;
  budgetAllocated?: number;
  budgetPercent?: number;
  projectedStartDate?: string;
  projectedEndDate?: string;
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  task: {
    id: string;
    title: string;
  };
  scope: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    name: string;
  };
  progressLogs?: Array<{
    id: string;
    date: string;
    dailyPercent: number;
    cumulativePercent: number;
    remarks?: string;
  }>;
  assignees?: Array<{
    subtaskId?: string;
    userId?: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  comments?: Array<{
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
    };
  }>;
  checklist?: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
    order: number;
  }>;
  checklists?: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
    order: number;
  }>;
  checklistCount?: number;
}

export interface MyBoardResponse {
  success: boolean;
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  data: SubtaskCardData[];
}

export interface FilterParams {
  projectId?: string;
  scopeId?: string;
  taskId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const normalizeBoardItem = (item: any): SubtaskCardData => {
  const progress = Number(item?.progress ?? 0);
  const taskId = item?.taskId ?? item?.task?.id ?? "";
  const scopeId = item?.scopeId ?? item?.scope?.id ?? item?.task?.scope?.id ?? "";
  const projectId =
    item?.projectId ?? item?.project?.id ?? item?.task?.scope?.project?.id ?? "";
  const title = item?.title ?? item?.subtaskName ?? "Untitled subtask";

  return {
    ...item,
    id: item?.id,
    title,
    subtaskName: item?.subtaskName ?? title,
    taskId,
    taskName: item?.taskName ?? item?.task?.title ?? "Untitled task",
    scopeId,
    scopeName: item?.scopeName ?? item?.scope?.name ?? item?.task?.scope?.name ?? "No scope",
    projectId,
    projectName:
      item?.projectName ??
      item?.project?.name ??
      item?.task?.scope?.project?.name ??
      "No project",
    assignorName: item?.assignorName ?? item?.creator?.name,
    assigneeNames:
      item?.assigneeNames ??
      item?.assignees?.map((assignee: any) => assignee?.user?.name).filter(Boolean) ??
      [],
    progress,
    status: item?.status ?? (progress <= 0 ? 0 : progress >= 100 ? 2 : 1),
    priority: item?.priority ?? "Medium",
    startDate: item?.startDate ?? item?.projectedStartDate ?? item?.expectedStartDate,
    endDate: item?.endDate ?? item?.projectedEndDate ?? item?.expectedEndDate,
    projectedStartDate: item?.projectedStartDate ?? item?.startDate ?? item?.expectedStartDate,
    projectedEndDate: item?.projectedEndDate ?? item?.endDate ?? item?.expectedEndDate,
    checklists: item?.checklists ?? item?.checklist ?? [],
    checklist: item?.checklist ?? item?.checklists ?? [],
    checklistCount: item?.checklistCount ?? item?.checklists?.length ?? item?.checklist?.length ?? 0,
    parentTaskId: taskId,
    task: {
      id: taskId,
      title: item?.taskName ?? item?.task?.title ?? "Untitled task",
    },
    scope: {
      id: scopeId,
      name: item?.scopeName ?? item?.scope?.name ?? item?.task?.scope?.name ?? "No scope",
    },
    Scope: {
      id: scopeId,
      name: item?.scopeName ?? item?.scope?.name ?? item?.task?.scope?.name ?? "No scope",
    },
    project: {
      id: projectId,
      name:
        item?.projectName ??
        item?.project?.name ??
        item?.task?.scope?.project?.name ??
        "No project",
    },
    assignees:
      item?.assignees ??
      item?.assigneeNames?.map((name: string) => ({
        user: { id: name, name, email: "" },
      })) ??
      [],
  } as SubtaskCardData;
};

/**
 * Filter subtasks from board data (client-side only)
 */
export const filterSubtasks = (
  subtasks: SubtaskCardData[],
  filters: {
    search?: string;
    projectId?: string;
    scopeId?: string;
    taskId?: string;
  }
): SubtaskCardData[] => {
  return subtasks.filter((subtask) => {
    // Null/undefined check
    if (!subtask || !subtask.title) return false;

    // Search filter
    if (
      filters.search &&
      !subtask.title
        .toLowerCase()
        .includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    // Project filter - Match via task.scope.project hierarchy
    if (filters.projectId) {
      const projectId = (subtask.task as any)?.scope?.project?.id;
      if (projectId !== filters.projectId) {
        return false;
      }
    }

    // Scope filter - Match via task.scope hierarchy
    if (filters.scopeId) {
      const scopeId = (subtask.task as any)?.scope?.id;
      if (scopeId !== filters.scopeId) {
        return false;
      }
    }

    // Task filter - Direct match
    if (filters.taskId && subtask.task?.id !== filters.taskId) {
      return false;
    }

    return true;
  });
};
