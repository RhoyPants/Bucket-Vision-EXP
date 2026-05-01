import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import {
  setTasks,
  addTask,
  updateTaskLocal,
  deleteTaskLocal,
} from "../slices/taskSlice";

// Ã¢Å“â€¦ GET TASKS BY Scope (MAIN USE)
export const getTasksByScope = (scopeId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.get(`/tasks/scope/${scopeId}`);

      dispatch(setTasks(res.data));

      return res.data;
    } catch (err) {
      console.error("Ã¢ÂÅ’ Error fetching tasks:", err);
      return [];
    }
  };
};

// Ã¢ÂÅ’ REMOVE /tasks/project Ã¢â‚¬â€ NOT IN BACKEND
// (we keep your function but comment for safety)
/*
export const getTasksByProject = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.get(`/tasks/project/${projectId}`);
      dispatch(setTasks(res.data));
      return res.data;
    } catch (err) {
      console.error("Ã¢ÂÅ’ Error fetching tasks:", err);
      throw err;
    }
  };
};
*/

// Ã¢Å“â€¦ GET SINGLE TASK
export const getTaskById = (taskId: string) => {
  return async () => {
    try {
      const res = await axiosApi.get(`/tasks/${taskId}`);
      return res.data;
    } catch (err) {
      console.error("Ã¢ÂÅ’ Error fetching task:", err);
      throw err;
    }
  };
};

// Ã¢Å“â€¦ CREATE TASK
export const createTask = (data: any) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.post("/tasks", data);

      // local update (optional but useful)
      dispatch(addTask(res.data));

      return res.data;
    } catch (err) {
      console.error("Ã¢ÂÅ’ Error creating task:", err);
      throw err;
    }
  };
};

// Ã¢Å“â€¦ UPDATE TASK
export const updateTask = (taskId: string, data: any) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.put(`/tasks/${taskId}`, data);

      dispatch(updateTaskLocal(res.data));

      return res.data;
    } catch (err) {
      console.error("Ã¢ÂÅ’ Error updating task:", err);
      throw err;
    }
  };
};

// Ã¢Å“â€¦ DELETE TASK
export const deleteTask = (taskId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      await axiosApi.delete(`/tasks/${taskId}`);

      dispatch(deleteTaskLocal(taskId));
    } catch (err) {
      console.error("Ã¢ÂÅ’ Error deleting task:", err);
      throw err;
    }
  };
};