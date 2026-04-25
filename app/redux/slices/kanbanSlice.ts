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

  budgetAllocated?: number | null;
  budgetPercent?: number | null;

  status: number; // 0 = Pending, 1 = Ongoing, 2 = Done
  parentTaskId: string;

  order: number;

  priority?: string;
  progress?: number;

  assignee?: string | null;
  assignees?: any[]; // Support both assignee and assignees array
  userIds?: string[]; // User IDs for assignments

  startDate?: string;
  endDate?: string;
  projectedStartDate?: string; // Projected start date
  projectedEndDate?: string; // Projected end date
  remarks?: string; // Additional remarks
  
  checklists?: KanbanChecklist[];
}

// 🔥 BOARD FILTER DATA
export interface BoardFilterItem {
  id: string;
  name?: string;
  title?: string;
}

export interface BoardFiltersState {
  projects: BoardFilterItem[];
  categories: BoardFilterItem[];
  tasks: BoardFilterItem[];
}

interface KanbanState {
  subtasks: KanbanSubtask[];
  loading: boolean;
  boardFilters: BoardFiltersState;
}

const initialState: KanbanState = {
  subtasks: [],
  loading: false,
  boardFilters: {
    projects: [],
    categories: [],
    tasks: [],
  },
};

// 🔥 STATUS COMPUTATION
const computeStatus = (progress?: number) => {
  if (!progress || progress <= 0) return 0;
  if (progress < 100) return 1;
  return 2;
};

// 🔥 PROGRESS FROM CHECKLISTS
const computeChecklistProgress = (checklists?: KanbanChecklist[]) => {
  if (!checklists || checklists.length === 0) return 0;

  const done = checklists.filter((c) => c.isCompleted).length;
  return Math.round((done / checklists.length) * 100);
};

const kanbanSlice = createSlice({
  name: "kanban",
  initialState,
  reducers: {
    // ========================================
    // SET ALL SUBTASKS
    // ========================================
    setSubtasks(state, action: PayloadAction<KanbanSubtask[]>) {
      state.subtasks = action.payload;
    },

    // ========================================
    // 🔥 CLEAR (VERY IMPORTANT)
    // ========================================
    clearSubtasks(state) {
      state.subtasks = [];
    },

    // ========================================
    // 🔥 REAL-TIME UPDATE
    // ========================================
    updateSubtaskLocal(
      state,
      action: PayloadAction<{
        id: string;
        progress?: number;
        status?: number;
      }>,
    ) {
      const { id, progress, status } = action.payload;

      const sub = state.subtasks.find((s) => s.id === id);
      if (!sub) return;

      if (progress !== undefined) {
        sub.progress = progress;
        sub.status = computeStatus(progress);
      }

      if (status !== undefined) {
        sub.status = status;
      }
    },

    // ========================================
    // 🔥 REORDER (FIXED)
    // ========================================
    reorderSubtasksForParent(
      state,
      action: PayloadAction<{
        parentTaskId: string;
        orderedIds: string[];
      }>,
    ) {
      const { parentTaskId, orderedIds } = action.payload;

      const filtered = state.subtasks.filter(
        (s) => s.parentTaskId === parentTaskId,
      );

      orderedIds.forEach((id, index) => {
        const subtask = filtered.find((s) => s.id === id);
        if (subtask) {
          subtask.order = index;
        }
      });
    },

    // ========================================
    // ADD SUBTASK
    // ========================================
    addSubtask(state, action: PayloadAction<KanbanSubtask>) {
      state.subtasks.push(action.payload);
    },

    // ========================================
    // LOADING
    // ========================================
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    // ========================================
    // 🔥 CHECKLIST TOGGLE
    // ========================================
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

          const progress = computeChecklistProgress(subtask.checklists);

          subtask.progress = progress;
          subtask.status = computeStatus(progress);
        }
      });
    },
    removeSubtask(state, action: PayloadAction<string>) {
      state.subtasks = state.subtasks.filter((s) => s.id !== action.payload);
    },

    // ========================================
    // 🔥 BOARD FILTERS
    // ========================================
    setBoardFilters(
      state,
      action: PayloadAction<BoardFiltersState>,
    ) {
      state.boardFilters = action.payload;
    },

    setTasksForBoard(
      state,
      action: PayloadAction<BoardFilterItem[]>,
    ) {
      state.boardFilters.tasks = action.payload;
    },
  },
});

export const {
  setSubtasks,
  clearSubtasks,
  updateSubtaskLocal,
  reorderSubtasksForParent,
  addSubtask,
  setLoading,
  toggleChecklistLocal,
  removeSubtask,
  setBoardFilters,
  setTasksForBoard,
} = kanbanSlice.actions;

export default kanbanSlice.reducer;
