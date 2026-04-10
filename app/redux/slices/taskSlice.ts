import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  createdAt?: string;
  progress?: number;
}

interface TaskState {
  tasks: Task[];
  currentTaskId: string | null; // 🔥 NEW
  loading: boolean; // 🔥 NEW
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
    // SET ALL TASKS
    setTasks(state, action: PayloadAction<Task[]>) {
      state.tasks = action.payload;

      // auto select first task
      if (!state.currentTaskId && action.payload.length > 0) {
        state.currentTaskId = action.payload[0].id;
      }
    },

    // SET CURRENT TASK
    setCurrentTask(state, action: PayloadAction<string | null>) {
      state.currentTaskId = action.payload;
    },

    // ADD ONE TASK
    addTask(state, action: PayloadAction<Task>) {
      state.tasks.push(action.payload);
    },

    // UPDATE TASK
    updateTask(state, action: PayloadAction<Task>) {
      const index = state.tasks.findIndex((t) => t.id === action.payload.id);

      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },

    // DELETE TASK
    deleteTask(state, action: PayloadAction<string>) {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);

      // 🔥 reset current if deleted
      if (state.currentTaskId === action.payload) {
        state.currentTaskId = state.tasks.length > 0 ? state.tasks[0].id : null;
      }
    },

    // LOADING STATE (OPTIONAL)
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    updateTaskProgress: (
      state,
      action: PayloadAction<{ taskId: string; progress: number }>,
    ) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);

      if (task) {
        task.progress = action.payload.progress;
      }
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  setCurrentTask,
  setLoading,
  updateTaskProgress,
} = taskSlice.actions;

export default taskSlice.reducer;
