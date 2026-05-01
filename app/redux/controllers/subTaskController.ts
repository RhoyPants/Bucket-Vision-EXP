"use client";

import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";

import {
  setSubtasks,
  reorderSubtasksForParent,
  toggleChecklistLocal,
  removeSubtask,
  setBoardFilters,
  setTasksForBoard,
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
      const res = await axiosApi.post("/subtasks", {
        ...data,
        taskId,  // 🔥 ADD taskId to the request payload
      });

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

      await dispatch(loadKanbanByTask(taskId));  // 🔥 Use taskId parameter, not data.taskId

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
export const updateSubtask = (id: string, data: any, taskId?: string) => {
  return async (dispatch: AppDispatch, getState: any) => {
    try {
      const res = await axiosApi.put(`/subtasks/${id}`, data);

      // 🔥 Reload Kanban if taskId is provided
      if (taskId) {
        await dispatch(loadKanbanByTask(taskId));
      }

      // 🔥 Update task progress if response includes it
      if (res.data?.progress && taskId) {
        dispatch(
          updateTaskProgress({
            taskId,
            progress: res.data.progress,
          })
        );
      }

      // 🔥 Update S-Curve if project available
      const state = getState();
      const projectId = state.project?.currentProjectId;
      if (projectId) {
        dispatch(getSCurve(projectId));
      }

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

// ========================================
// 🔥 LOAD MY BOARD (Task Board)
// ========================================
export const loadMyBoard = (filters?: {
  projectId?: string;
  categoryId?: string;
  taskId?: string;
  search?: string;
}) => {
  return async (dispatch: AppDispatch) => {
    try {
      // ✅ Build query params
      const params = new URLSearchParams();
      if (filters?.projectId) params.append("projectId", filters.projectId);
      if (filters?.categoryId) params.append("categoryId", filters.categoryId);
      if (filters?.taskId) params.append("taskId", filters.taskId);
      if (filters?.search) params.append("search", filters.search);

      const queryString = params.toString();
      const url = queryString
        ? `/subtasks/board/my?${queryString}`
        : "/subtasks/board/my";

      const res = await axiosApi.get(url);

      // ✅ Set subtasks to Redux
      dispatch(setSubtasks(res.data.data || []));

      return res.data;
    } catch (err) {
      console.error("❌ Error loading my board:", err);
      throw err;
    }
  };
};

// ========================================
// 🔥 LOAD BOARD FILTERS DATA
// ========================================
export const loadBoardFilterData = () => {
  return async (dispatch: AppDispatch) => {
    try {
      // ✅ Fetch projects with full=true parameter
      const projectsRes = await axiosApi.get("/projects?full=true");

      // ✅ Map projects to have { id, name } structure (FilterItem format)
      const formattedProjects = (projectsRes.data || []).map((project: any) => ({
        id: project.id,
        name: project.name || project.title || "Unnamed Project",
      }));

      dispatch(
        setBoardFilters({
          projects: formattedProjects,
          categories: [],
          tasks: [],
        }),
      );

      return {
        projects: formattedProjects,
      };
    } catch (err) {
      console.error("❌ Error loading board filters:", err);
      throw err;
    }
  };
};

// ========================================
// 🔥 LOAD CATEGORIES FOR PROJECT
// ========================================
export const loadCategoriesForProject = (projectId: string) => {
  return async (dispatch: AppDispatch, getState: any) => {
    try {
      const res = await axiosApi.get(`/categories/project/${projectId}`);
      
      // ✅ Get existing state to preserve projects
      const currentState = getState();
      const currentProjects = currentState?.kanban?.boardFilters?.projects || [];

      // ✅ Map categories to have { id, name } structure
      const formattedCategories = (res.data || []).map((category: any) => ({
        id: category.id,
        name: category.name || category.title || "Unnamed Category",
      }));

      dispatch(
        setTasksForBoard([]), // ✅ Clear tasks when category changes
      );

      // 🔥 Preserve projects, update categories and clear tasks
      dispatch(
        setBoardFilters({
          projects: currentProjects, // ✅ PRESERVE existing projects
          categories: formattedCategories,
          tasks: [],
        }),
      );

      return formattedCategories;
    } catch (err) {
      console.error("❌ Error loading categories:", err);
      throw err;
    }
  };
};

// ========================================
// 🔥 LOAD TASKS FOR CATEGORY
// ========================================
export const loadTasksForCategory = (categoryId: string) => {
  return async (dispatch: AppDispatch, getState: any) => {
    try {
      const res = await axiosApi.get(`/tasks/category/${categoryId}`);
      
      // ✅ Get existing state to preserve projects and categories
      const currentState = getState();
      const currentProjects = currentState?.kanban?.boardFilters?.projects || [];
      const currentCategories = currentState?.kanban?.boardFilters?.categories || [];

      // ✅ Map tasks to have { id, name } structure
      const formattedTasks = (res.data || []).map((task: any) => ({
        id: task.id,
        name: task.name || task.title || "Unnamed Task",
      }));

      dispatch(setTasksForBoard(formattedTasks));
      
      // 🔥 Also update board filters to preserve projects and categories
      dispatch(
        setBoardFilters({
          projects: currentProjects, // ✅ PRESERVE existing projects
          categories: currentCategories, // ✅ PRESERVE existing categories
          tasks: formattedTasks,
        }),
      );

      return formattedTasks;
    } catch (err) {
      console.error("❌ Error loading tasks:", err);
      throw err;
    }
  };
};
