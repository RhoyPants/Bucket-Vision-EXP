import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import {
  setTasks,
  addTask,
  updateTaskLocal,
  deleteTaskLocal,
} from "../slices/taskSlice";

// ✅ GET TASKS BY CATEGORY (MAIN USE)
export const getTasksByCategory = (categoryId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.get(`/tasks/category/${categoryId}`);

      dispatch(setTasks(res.data));

      return res.data;
    } catch (err) {
      console.error("❌ Error fetching tasks:", err);
      return [];
    }
  };
};


export const getTasksByProject = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.get(`/tasks/project/${projectId}`);
      dispatch(setTasks(res.data));
      return res.data;
    } catch (err) {
      console.error("❌ Error fetching tasks:", err);
      throw err;
    }
  };
};


// ✅ GET SINGLE TASK
export const getTaskById = (taskId: string) => {
  return async () => {
    try {
      const res = await axiosApi.get(`/tasks/${taskId}`);
      return res.data;
    } catch (err) {
      console.error("❌ Error fetching task:", err);
      throw err;
    }
  };
};

// ✅ CREATE TASK
export const createTask = (data: any) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.post("/tasks", data);

      // local update (optional but useful)
      dispatch(addTask(res.data));

      return res.data;
    } catch (err) {
      console.error("❌ Error creating task:", err);
      throw err;
    }
  };
};

// ✅ UPDATE TASK
export const updateTask = (taskId: string, data: any) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.put(`/tasks/${taskId}`, data);

      dispatch(updateTaskLocal(res.data));

      return res.data;
    } catch (err) {
      console.error("❌ Error updating task:", err);
      throw err;
    }
  };
};

// ✅ DELETE TASK
export const deleteTask = (taskId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      await axiosApi.delete(`/tasks/${taskId}`);

      dispatch(deleteTaskLocal(taskId));
    } catch (err) {
      console.error("❌ Error deleting task:", err);
      throw err;
    }
  };
};