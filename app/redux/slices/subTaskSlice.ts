import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Subtask {
  subtask_id: number;
  task_name: string;
  description: string;
  start_date: string;
  end_date: string;
  duration: number;
  assigned_to: string[];
  assigned_by: string;
  priority: string;
  progress: number;
  status: "todo" | "inprogress" | "review" | "completed"; // from backend
}

interface SubtaskState {
  subtasks: Subtask[];
}

const initialState: SubtaskState = {
  subtasks: [],
};

const subtaskSlice = createSlice({
  name: "subtask",
  initialState,
  reducers: {
    setSubtasks(state, action: PayloadAction<Subtask[]>) {
      state.subtasks = action.payload;
    },
  },
});

export const { setSubtasks } = subtaskSlice.actions;
export default subtaskSlice.reducer;
