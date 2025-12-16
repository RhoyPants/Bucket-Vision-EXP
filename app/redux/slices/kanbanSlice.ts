// app/redux/slices/kanbanSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type KanbanStatus = "todo" | "inprogress" | "review" | "completed";

export interface KanbanSubtask {
  id: string;
  projectId: string;
  moduleId?: string; // optional, if you use modules
  parentTaskId: string; // the task/milestone id
  title: string;
  description?: string;
  assignee?: string;
  priority?: "High" | "Medium" | "Low";
  dueDate?: string;
  progress?: number;
  status: KanbanStatus;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: any;
}

export interface KanbanTask {
  id: string;
  projectId: string;
  title: string;      // tab label
  meta?: { approved?: boolean; progress?: number; [k: string]: any };
  module?: string;
}

export interface KanbanModule {
  id: string;
  projectId: string;
  title: string;
}

export interface KanbanState {
  modules: KanbanModule[];
  tasks: KanbanTask[]; // top-level tasks (tabs)
  subtasks: KanbanSubtask[];
}

const initialState: KanbanState = {
  modules: [],
  tasks: [],
  subtasks: [],
};

const kanbanSlice = createSlice({
  name: "kanban",
  initialState,
  reducers: {
    setModules(state, action: PayloadAction<KanbanModule[]>) {
      state.modules = action.payload;
    },
    setTasks(state, action: PayloadAction<KanbanTask[]>) {
      state.tasks = action.payload;
    },
    setSubtasks(state, action: PayloadAction<KanbanSubtask[]>) {
      state.subtasks = action.payload;
    },
    addSubtask(state, action: PayloadAction<KanbanSubtask>) {
      state.subtasks.push(action.payload);
    },
    updateSubtask(state, action: PayloadAction<Partial<KanbanSubtask> & { id: string }>) {
      const idx = state.subtasks.findIndex((s) => s.id === action.payload.id);
      if (idx >= 0) state.subtasks[idx] = { ...state.subtasks[idx], ...action.payload };
    },
    updateSubtaskStatus(state, action: PayloadAction<{ id: string; status: KanbanStatus }>) {
      const t = state.subtasks.find((s) => s.id === action.payload.id);
      if (t) t.status = action.payload.status;
    },
    reorderSubtasksForParent(state, action: PayloadAction<{ parentTaskId: string; orderedIds: string[] }>) {
      const { parentTaskId, orderedIds } = action.payload;
      const parent = state.subtasks.filter((s) => s.parentTaskId === parentTaskId);
      const others = state.subtasks.filter((s) => s.parentTaskId !== parentTaskId);
      const sorted = orderedIds.map((id) => parent.find((p) => p.id === id)!).filter(Boolean);
      state.subtasks = [...others, ...sorted];
    },
    addTask(state, action: PayloadAction<KanbanTask>) {
      state.tasks.push(action.payload);
    },
    addModule(state, action: PayloadAction<KanbanModule>) {
      state.modules.push(action.payload);
    },
  },
});

export const {
  setModules,
  setTasks,
  setSubtasks,
  addSubtask,
  updateSubtask,
  updateSubtaskStatus,
  reorderSubtasksForParent,
  addTask,
  addModule,
} = kanbanSlice.actions;

export default kanbanSlice.reducer;
