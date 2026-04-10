import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface KanbanChecklist {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
}
export interface KanbanSubtask {
  id: string;
  title: string;
  description?: string;

  statusId: string; // NOW = statusId (UUID)
  parentTaskId: string;

  order: number;

  priority?: string;
  progress?: number;

  assignee?: string | null;

  startDate?: string;
  endDate?: string;
  checklists?: KanbanChecklist[];
}

interface KanbanState {
  subtasks: KanbanSubtask[];
  loading: boolean;
}

const initialState: KanbanState = {
  subtasks: [],
  loading: false,
};

const kanbanSlice = createSlice({
  name: "kanban",
  initialState,
  reducers: {
    // SET ALL SUBTASKS (from API)
    setSubtasks(state, action: PayloadAction<KanbanSubtask[]>) {
      state.subtasks = action.payload;
    },

    // UPDATE STATUS (DRAG DROP)
    updateSubtaskStatus(
      state,
      action: PayloadAction<{ id: string; statusId: string }>,
    ) {
      const subtask = state.subtasks.find((s) => s.id === action.payload.id);

      if (subtask) {
        subtask.statusId = action.payload.statusId; // ✅ FIX
      }
    },

    // REORDER WITHIN SAME COLUMN
    reorderSubtasksForParent(
      state,
      action: PayloadAction<{
        parentTaskId: string;
        orderedIds: string[];
      }>,
    ) {
      const { orderedIds } = action.payload;

      orderedIds.forEach((id, index) => {
        const subtask = state.subtasks.find((s) => s.id === id);
        if (subtask) {
          subtask.order = index;
        }
      });
    },

    // ADD NEW SUBTASK
    addSubtask(state, action: PayloadAction<KanbanSubtask>) {
      state.subtasks.push(action.payload);
    },

    // OPTIONAL: LOADING STATE
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    toggleChecklistLocal(
      state,
      action: PayloadAction<{ checklistId: string }>,
    ) {
      state.subtasks.forEach((subtask) => {
        const checklist = subtask.checklists?.find(
          (c) => c.id === action.payload.checklistId,
        );

        if (checklist) {
          checklist.isCompleted = !checklist.isCompleted;
        }
      });
    },
  },
});

export const {
  setSubtasks,
  updateSubtaskStatus,
  reorderSubtasksForParent,
  addSubtask,
  setLoading,
  toggleChecklistLocal,
} = kanbanSlice.actions;

export default kanbanSlice.reducer;
