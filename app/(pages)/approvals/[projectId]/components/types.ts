export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type ChangeStatus = "ADDED" | "REMOVED" | "MODIFIED" | "UNCHANGED";

export interface CompareTheme {
  border: string;
  background: string;
  accent: string;
  text: string;
}

export const getCompareTheme = (status?: ChangeStatus | string): CompareTheme => {
  switch (status) {
    case "ADDED":
      return { border: "#bbf7d0", background: "#f0fdf4", accent: "#22c55e", text: "#166534" };
    case "REMOVED":
      return { border: "#fecaca", background: "#fef2f2", accent: "#ef4444", text: "#991b1b" };
    case "MODIFIED":
      return { border: "#bfdbfe", background: "#ffffff", accent: "#3b82f6", text: "#1e40af" };
    default:
      return { border: "#e5e7eb", background: "#ffffff", accent: "#6366f1", text: "#111827" };
  }
};

export interface Subtask {
  id: string;
  title: string;
  priority?: Priority;
  progress: number;
  changeStatus?: ChangeStatus;
  projectedStartDate?: string;
  projectedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
}

export interface Task {
  id: string;
  title: string;
  budgetAllocated?: number;
  progress: number;
  changeStatus?: ChangeStatus;
  subtasks: Subtask[];
}

export interface Scope {
  id: string;
  name: string;
  budgetAllocated?: number;
  description?: string;
  progress: number;
  changeStatus?: ChangeStatus;
  tasks: Task[];
}

export interface StructuredViewProps {
  project: {
    id: string;
    name: string;
    scopes: Scope[];
  };
  compareMode?: boolean;
}
