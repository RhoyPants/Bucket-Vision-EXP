export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface Subtask {
  id: string;
  title: string;
  priority?: Priority;
  progress: number;
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
  subtasks: Subtask[];
}

export interface Scope {
  id: string;
  name: string;
  budgetAllocated?: number;
  description?: string;
  progress: number;
  tasks: Task[];
}

export interface StructuredViewProps {
  project: {
    id: string;
    name: string;
    scopes: Scope[];
  };
}
