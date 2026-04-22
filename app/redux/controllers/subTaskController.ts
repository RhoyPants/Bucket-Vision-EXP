"use client";

import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";

import {
  setSubtasks,
  reorderSubtasksForParent,
  toggleChecklistLocal,
  removeSubtask,
} from "../slices/kanbanSlice";

import { mapTaskToKanban } from "@/app/utils/kanbanAdapter";
import { updateTaskProgress } from "../slices/taskSlice";
import { getSCurve } from "./scurveController";

// ========================================
// LOAD FULL TASK (KANBAN)
// ========================================
export const loadKanbanByTask = (taskId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.get(`/tasks/${taskId}`);

      const { columns, subtasks } = mapTaskToKanban(res.data);

      // ✅ update parent task progress
      dispatch(
        updateTaskProgress({
          taskId,
          progress: res.data.progress,
        }),
      );

      // ✅ set subtasks
      dispatch(setSubtasks(subtasks));

      return { columns, subtasks };
    } catch (err) {
      console.error("❌ Error loading kanban:", err);
      throw err;
    }
  };
};

// ========================================
// CREATE SUBTASK
// ========================================
export const createSubtask = (data: any, taskId: string) => {
  return async (dispatch: AppDispatch, getState: any) => {
    try {
      const res = await axiosApi.post("/subtasks", data);

      // 🔥 reload (SAFE for now)
      dispatch(
        updateTaskProgress({
          taskId,
          progress: res.data.progress,
        }),
      );
      const state = getState();
      const projectId = state.project?.currentProjectId;
      if (projectId) {
        dispatch(getSCurve(projectId));
      }

      await dispatch(loadKanbanByTask(data.taskId));

      return res.data;
    } catch (err) {
      console.error("❌ Error creating subtask:", err);
      throw err;
    }
  };
};

// ========================================
// UPDATE SUBTASK
// ========================================
export const updateSubtask = (id: string, data: any) => {
  return async () => {
    try {
      const res = await axiosApi.put(`/subtasks/${id}`, data);
      return res.data;
    } catch (err) {
      console.error("❌ Error updating subtask:", err);
      throw err;
    }
  };
};

// ========================================
// DELETE SUBTASK
// ========================================
export const deleteSubtask = (id: string, taskId: string) => {
  return async (dispatch: AppDispatch, getState: any) => {
    try {
      const res = await axiosApi.delete(`/subtasks/${id}`);

      // 🔥 optional reload if taskId provided
      dispatch(removeSubtask(id));
      dispatch(
        updateTaskProgress({
          taskId,
          progress: res.data.progress,
        }),
      );
      await dispatch(loadKanbanByTask(taskId));
      const state = getState();
      const projectId = state.project?.currentProjectId;
      if (projectId) {
        dispatch(getSCurve(projectId));
      }
    } catch (err) {
      console.error("❌ Error deleting subtask:", err);
      throw err;
    }
  };
};

// ========================================
// 🔥 DRAG MOVE (OPTIMISTIC)
// ========================================
export const moveSubtask = (params: {
  id: string;
  order: number;
  parentTaskId: string;
  orderedIds: string[];
}) => {
  return async (dispatch: AppDispatch) => {
    const { id, order, parentTaskId, orderedIds } = params;

    try {
      // ✅ optimistic reorder
      dispatch(
        reorderSubtasksForParent({
          parentTaskId,
          orderedIds,
        }),
      );

      // ✅ backend update
      await axiosApi.patch(`/subtasks/${id}/move`, {
        newOrder: order,
      });
    } catch (err) {
      console.error("❌ Error moving subtask:", err);
      throw err;
    }
  };
};

// ========================================
// 🔥 CHECKLIST TOGGLE (REAL-TIME)
// ========================================
export const toggleChecklist = (checklistId: string, taskId?: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      await axiosApi.patch(`/subtasks/checklists/${checklistId}/toggle`);

      // ✅ instant UI update
      dispatch(toggleChecklistLocal({ checklistId }));

      // 🔁 optional sync
      if (taskId) {
        await dispatch(loadKanbanByTask(taskId));
      }
    } catch (err) {
      console.error("❌ Error toggling checklist:", err);
      throw err;
    }
  };
};

// ========================================
// ADD CHECKLIST
// ========================================
export const addChecklist = (data: { subtaskId: string; title: string }) => {
  return async () => {
    try {
      const res = await axiosApi.post("/subtasks/checklists", data);
      return res.data;
    } catch (err) {
      console.error("❌ Error adding checklist:", err);
      throw err;
    }
  };
};

// ========================================
// DELETE CHECKLIST
// ========================================
export const deleteChecklist = (checklistId: string) => {
  return async () => {
    try {
      await axiosApi.delete(`/subtasks/checklists/${checklistId}`);
    } catch (err) {
      console.error("❌ Error deleting checklist:", err);
      throw err;
    }
  };
};
