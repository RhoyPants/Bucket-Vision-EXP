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
  task: {
    id: string;
    title: string;
  };
  category: {
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
    id: string;
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
  categoryId?: string;
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
    categoryId?: string;
    taskId?: string;
  }
): SubtaskCardData[] => {
  return subtasks.filter((subtask) => {
    // Search filter
    if (
      filters.search &&
      !subtask.title
        .toLowerCase()
        .includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    // Project filter
    if (filters.projectId && subtask.project.id !== filters.projectId) {
      return false;
    }

    // Category filter
    if (filters.categoryId && subtask.category.id !== filters.categoryId) {
      return false;
    }

    // Task filter
    if (filters.taskId && subtask.task.id !== filters.taskId) {
      return false;
    }

    return true;
  });
};
