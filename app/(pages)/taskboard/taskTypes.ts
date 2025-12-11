// app/taskboard/taskTypes.ts
export type TaskStatus = "todo" | "inprogress" | "review" | "completed";

export interface TaskData {
  id: number;
  title: string;
  priority: "High" | "Medium" | "Low";
  developer: string;
  dueDate: string;
  description: string;
  progress?: number;
  status: TaskStatus;
  overlay?: any;
}
