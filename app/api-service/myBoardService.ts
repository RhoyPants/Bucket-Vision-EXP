/**
 * MyBoard Service - Types and Helpers
 * Redux controllers handle all API calls via Redux dispatch
 * This file only exports types and client-side utilities
 */

export interface SubtaskCardData {
  id: string;
  title: string;
  status: number;
  progress: number;
  priority: string;
  remarks?: string;
  budgetAllocated?: number;
  budgetPercent?: number;
  projectedStartDate?: string;
  projectedEndDate?: string;
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
}

export interface MyBoardResponse {
  success: boolean;
  total: number;
  data: SubtaskCardData[];
}

export interface FilterParams {
  projectId?: string;
  scopeId?: string;
  taskId?: string;
  search?: string;
}

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
