import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type KanbanStatus = "todo" | "inprogress" | "review" | "completed";

export interface KanbanSubtask {
  id: string;
  parentTaskId: number;
  projectId: number | null;

  title: string;
  description: string;

  status: KanbanStatus;
  priority: string | null;
  assignee: string | null;
  assigneeName?: string | null;
  assignedBy?: string | null;

  startDate?: string | null;
  endDate?: string | null;

  progress?: number;
  order: number;
}

interface KanbanState {
  modules: any[];
  tasks: any[];
  subtasks: KanbanSubtask[];
  loading: boolean; // 🔥 NEW
}

const initialState: KanbanState = {
  modules: [],
  tasks: [],
  subtasks: [],
  loading: false, // 🔥 NEW
};

export const kanbanSlice = createSlice({
  name: "kanban",
  initialState,
  reducers: {
    // --------------------------------------------------------
    // 0. SET LOADING
    // --------------------------------------------------------
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    // --------------------------------------------------------
    // 1. SET SUBTASKS
    // --------------------------------------------------------
    setSubtasks(state, action: PayloadAction<KanbanSubtask[]>) {
      state.subtasks = action.payload;
      state.loading = false; // 🔥 auto-stop loading
    },

    // --------------------------------------------------------
    // 2. UPDATE STATUS ONLY (drag/drop)
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
    // 3. UPDATE FULL SUBTASK (edit modal)
    // --------------------------------------------------------
    updateSubtask(state, action: PayloadAction<KanbanSubtask>) {
      const updated = action.payload;

      state.subtasks = state.subtasks.map((s) =>
        s.id === updated.id ? updated : s
      );
    },

    // --------------------------------------------------------
    // 4. ADD NEW SUBTASK
    // --------------------------------------------------------
    addSubtask(state, action: PayloadAction<KanbanSubtask>) {
      state.subtasks.push(action.payload);
    },

    // --------------------------------------------------------
    // 5. REORDER SUBTASKS WITHIN SAME PARENT
    // --------------------------------------------------------
    reorderSubtasksForParent(
      state,
      action: PayloadAction<{ parentTaskId: number; orderedIds: string[] }>
    ) {
      const { parentTaskId, orderedIds } = action.payload;
      const pid = Number(parentTaskId);

      const orderMap = new Map(orderedIds.map((id, index) => [id, index]));

      state.subtasks = state.subtasks.map((s) => {
        if (Number(s.parentTaskId) === pid) {
          return {
            ...s,
            order: orderMap.get(s.id) ?? s.order,
          };
        }
        return s;
      });

      state.subtasks.sort((a, b) => {
        if (Number(a.parentTaskId) !== pid) return 0;
        if (Number(b.parentTaskId) !== pid) return 0;
        return (a.order ?? 0) - (b.order ?? 0);
      });
    },
  },
});

export const {
  setLoading,
  setSubtasks,
  updateSubtaskStatus,
  updateSubtask,
  addSubtask,
  reorderSubtasksForParent,
} = kanbanSlice.actions;

export default kanbanSlice.reducer;
