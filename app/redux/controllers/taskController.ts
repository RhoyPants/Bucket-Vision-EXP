import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import { setTasks } from "../slices/taskSlice";

// ✅ GET TASKS BY PROJECT
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

      // optional: refresh list
      if (data.projectId) {
        await dispatch(getTasksByProject(data.projectId));
      }

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

      return res.data;
    } catch (err) {
      console.error("❌ Error updating task:", err);
      throw err;
    }
  };
};

// ✅ DELETE TASK
export const deleteTask = (taskId: string, projectId?: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      await axiosApi.delete(`/tasks/${taskId}`);

      // optional refresh
      if (projectId) {
        await dispatch(getTasksByProject(projectId));
      }
    } catch (err) {
      console.error("❌ Error deleting task:", err);
      throw err;
    }
  };
};
