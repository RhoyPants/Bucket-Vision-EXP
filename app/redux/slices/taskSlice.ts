import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Task {
  name: string;
  id: string;
  title: string;
  description?: string;
  budgetAllocated?: number;
  scopeId: string; // 🔥 FIX (was projectId ❌)
  order?: number;

  createdAt?: string;
  progress?: number;
}

interface TaskState {
  tasks: Task[];
  currentTaskId: string | null;
  loading: boolean;
}

const initialState: TaskState = {
  tasks: [],
  currentTaskId: null,
  loading: false,
};

const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    // ✅ SET ALL
    setTasks(state, action: PayloadAction<Task[]>) {
      // Sort by order field (ascending)
      const sortedTasks = [...action.payload].sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderA - orderB;
      });
      state.tasks = sortedTasks;

      if (!state.currentTaskId && sortedTasks.length > 0) {
        state.currentTaskId = sortedTasks[0].id;
      }
    },

    // ✅ CURRENT
    setCurrentTask(state, action: PayloadAction<string | null>) {
      state.currentTaskId = action.payload;
    },

    // ✅ ADD
    addTask(state, action: PayloadAction<Task>) {
      state.tasks.push(action.payload);
      // Sort by order field after adding
      state.tasks.sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderA - orderB;
      });
    },

    // ✅ UPDATE (RENAMED to avoid conflict)
    updateTaskLocal(state, action: PayloadAction<Task>) {
      const index = state.tasks.findIndex(
        (t) => t.id === action.payload.id
      );

      if (index !== -1) {
        state.tasks[index] = action.payload;
        // Sort after update to maintain order
        state.tasks.sort((a, b) => {
          const orderA = a.order ?? 0;
          const orderB = b.order ?? 0;
          return orderA - orderB;
        });
      }
    },

    // ✅ DELETE (RENAMED to avoid conflict)
    deleteTaskLocal(state, action: PayloadAction<string>) {
      state.tasks = state.tasks.filter(
        (t) => t.id !== action.payload
      );

      if (state.currentTaskId === action.payload) {
        state.currentTaskId =
          state.tasks.length > 0 ? state.tasks[0].id : null;
      }
    },

    // ✅ LOADING
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    // ✅ PROGRESS UPDATE
    updateTaskProgress(
      state,
      action: PayloadAction<{ taskId: string; progress: number }>
    ) {
      const { taskId, progress } = action.payload;

      const task = state.tasks.find((t) => t.id === taskId);

      if (task) {
        task.progress = progress;
      }
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTaskLocal,
  deleteTaskLocal,
  setCurrentTask,
  setLoading,
  updateTaskProgress,
} = taskSlice.actions;

export default taskSlice.reducer;