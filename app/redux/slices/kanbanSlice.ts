import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type KanbanStatus = "todo" | "inprogress" | "review" | "completed";

export interface KanbanSubtask {
  id: string; // backend subtask_id → string
  parentTaskId: number; // always number
  projectId: number | null;

  title: string;
  description: string;

  status: KanbanStatus;
  priority: string | null;
  assignee: string | null;
  assignedBy?: string | null;

  startDate?: string | null;
  endDate?: string | null;

  progress?: number;
  order: number; // ordering index
}

interface KanbanState {
  modules: any[];
  tasks: any[];
  subtasks: KanbanSubtask[];
}

const initialState: KanbanState = {
  modules: [],
  tasks: [],
  subtasks: [],
};

export const kanbanSlice = createSlice({
  name: "kanban",
  initialState,
  reducers: {
    // --------------------------------------------------------
    // 1. SET SUBTASKS (on page load)
    // --------------------------------------------------------
    setSubtasks(state, action: PayloadAction<KanbanSubtask[]>) {
      state.subtasks = action.payload;
    },

    // --------------------------------------------------------
    // 2. UPDATE STATUS ONLY (UI instant update)
    // --------------------------------------------------------
    updateSubtaskStatus(
      state,
      action: PayloadAction<{ id: string; status: KanbanStatus }>
    ) {
      const { id, status } = action.payload;

      state.subtasks = state.subtasks.map((s) =>
        s.id === id ? { ...s, status } : s
      );
    },

    // --------------------------------------------------------
    // 3. UPDATE FULL SUBTASK (used after successful backend save)
    // --------------------------------------------------------
    updateSubtask(state, action: PayloadAction<KanbanSubtask>) {
      const updated = action.payload;

      state.subtasks = state.subtasks.map((s) =>
        s.id === updated.id ? updated : s
      );
    },
    addSubtask(state, action: PayloadAction<KanbanSubtask>) {
      state.subtasks.push(action.payload);
    },

    // --------------------------------------------------------
    // 4. REORDER SUBTASKS WITHIN SAME PARENT TASK
    // (MAIN BUGFIX: always compare numbers!)
    // --------------------------------------------------------
    reorderSubtasksForParent(
      state,
      action: PayloadAction<{ parentTaskId: number; orderedIds: string[] }>
    ) {
      const { parentTaskId, orderedIds } = action.payload;

      // Normalize parent task ID
      const pid = Number(parentTaskId);

      // Build quick lookup table for ordering
      const orderMap = new Map(orderedIds.map((id, index) => [id, index]));

      // Only update matching rows — DO NOT re-create arrays
      state.subtasks = state.subtasks.map((s) => {
        if (Number(s.parentTaskId) === pid) {
          return {
            ...s,
            order: orderMap.get(s.id) ?? s.order, // keep safely
          };
        }
        return s;
      });

      // Finally, ensure stable sorted output
      state.subtasks.sort((a, b) => {
        if (Number(a.parentTaskId) !== pid) return 0;
        if (Number(b.parentTaskId) !== pid) return 0;
        return (a.order ?? 0) - (b.order ?? 0);
      });
    },
  },
});

export const {
  setSubtasks,
  updateSubtaskStatus,
  updateSubtask,
  addSubtask,
  reorderSubtasksForParent,
} = kanbanSlice.actions;

export default kanbanSlice.reducer;
