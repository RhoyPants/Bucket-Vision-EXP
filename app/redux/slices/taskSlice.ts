import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Task {
  task_id: number;
  task_name: string;
  description: string;
  start_date: string;
  end_date: string;
  duration: number;
  assigned_to: string[];
  assigned_by: string;
  priority: string;
  progress: number;
}

interface TaskState {
  tasks: Task[];
}

const initialState: TaskState = {
  tasks: [],
};

const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    // FIXED: PayloadAction MUST be Task[]
    setTasks(state, action: PayloadAction<Task[]>) {
      state.tasks = action.payload;
    },
  },
});

export const { setTasks } = taskSlice.actions;
export default taskSlice.reducer;
