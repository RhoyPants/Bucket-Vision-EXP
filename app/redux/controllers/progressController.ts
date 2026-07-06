import axiosApi from "@/app/lib/axios";
import { AppDispatch } from "../store";
import { setLogs, setLoading } from "../slices/progressSlice";
import dayjs from "dayjs";
import { getSCurve } from "./scurveController";
import { getProjectFull } from "./projectController";
import { loadKanbanByTask } from "./subTaskController";

export interface CanAddProgressResponse {
  success: boolean;
  canAdd: boolean;
  reason: string | null;
  message: string;
  data?: {
    subtaskId: string;
    date: string;
    existingLog?: any | null;
    viewUrl?: string | null;
  };
}

// ✅ GET LOGS BY SUBTASK
const refreshProgressDependencies = async (
  dispatch: AppDispatch,
  getState: any,
  subtaskId: string,
) => {
  try {
    const currentState = getState();
    const taskId = currentState.task?.currentTaskId;
    const projectId = currentState.project?.currentProjectId;

    if (taskId) {
      const kanbanPromise = dispatch(loadKanbanByTask(taskId) as any);
      if (kanbanPromise && typeof kanbanPromise.then === "function") {
        await kanbanPromise;
      }
    }

    if (projectId) {
      const projectPromise = dispatch(getProjectFull(projectId) as any);
      if (projectPromise && typeof projectPromise.then === "function") {
        await projectPromise;
      }

      const scurvePromise = dispatch(getSCurve(projectId) as any);
      if (scurvePromise && typeof scurvePromise.then === "function") {
        await scurvePromise;
      }
    } else {
      console.warn("No projectId available in Redux state");
    }
  } catch (refreshErr) {
    console.warn("Warning refreshing data after progress mutation:", refreshErr);
  }

  dispatch(getProgressLogs(subtaskId));
};

export const getProgressLogs = (subtaskId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const res = await axiosApi.get(`/progress/subtask/${subtaskId}`);

      const logs = res.data.data || [];

      dispatch(setLogs({ subtaskId, logs }));

      return logs;
    } catch (err) {
      console.error("❌ Error fetching progress logs:", err);
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ✅ CREATE / UPDATE LOG WITH ALL FIELDS (SMART + FULL SUPPORT 🔥)
export const canAddProgress = async (
  subtaskId: string,
  date: string,
): Promise<CanAddProgressResponse> => {
  const res = await axiosApi.get("/progress/can-add", {
    params: { subtaskId, date },
  });

  return res.data;
};

export const saveProgressLog = (data: {
  subtaskId: string;
  date: string;
  dailyPercent: number;
  files?: File[];
  file?: File;
  remarks?: string;
  location?: string;
  dayNumber?: number;
}) => {
  return async (dispatch: AppDispatch, getState: any) => {
    try {
      dispatch(setLoading(true));

      const state = getState();
      const logs = state.progress.logsBySubtask[data.subtaskId] || [];

      // 🔥 NORMALIZE DATE (VERY IMPORTANT)
      const targetDate = dayjs(data.date).format("YYYY-MM-DD");

      const existing = logs.find(
        (l: any) => dayjs(l.date).format("YYYY-MM-DD") === targetDate,
      );

      // 📍 GEO LOCATION - Get user's GPS coordinates
      let latitude = 0;
      let longitude = 0;

      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          },
        );
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (geoErr) {
        console.warn("⚠️ Geolocation not available:", geoErr);
        // Continue without GPS - it's optional
      }

      // 📦 USE FORMDATA FOR MULTIPART (CREATE + UPDATE)
      const formData = new FormData();

      formData.append("subtaskId", data.subtaskId);
      formData.append("date", targetDate);
      formData.append("dailyPercent", String(data.dailyPercent));
      formData.append("lat", String(latitude));
      formData.append("lng", String(longitude));

      // Add optional fields
      if (data.remarks) {
        formData.append("remarks", data.remarks);
      }

      if (data.location) {
        formData.append("location", data.location);
      }

      if (data.dayNumber) {
        formData.append("dayNumber", String(data.dayNumber));
      }

      const uniqueFiles = data.files?.filter(
        (file, index, list) =>
          list.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified,
          ) === index,
      );

      // Preferred multi-upload contract
      if (uniqueFiles?.length) {
        uniqueFiles.forEach((f) => formData.append("attachments", f));
      }

      // Legacy single-photo support. Avoid sending the same file twice when
      // multi-attachment upload is already being used.
      if (!uniqueFiles?.length && data.file) {
        formData.append("photo", data.file);
      }

      // 🔥 UPSERT: Backend determines CREATE vs UPDATE based on date
      const response = await axiosApi.post("/progress", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // 🔥 REFRESH EVERYTHING AFTER SAVE - PROPER AWAIT CHAIN
      try {
        // Step 1: Get task/project ids from Redux state.
        // The backend does not expose /progress/subtask/:id/details.
        const currentState = getState();
        const taskId = currentState.task?.currentTaskId;
        const projectId = currentState.project?.currentProjectId;
        

        // Step 2: Refresh the task and subtask via kanban (updates subtask progress)
        if (taskId) {
          const kanbanPromise = dispatch(loadKanbanByTask(taskId) as any);
          if (kanbanPromise && typeof kanbanPromise.then === "function") {
            await kanbanPromise;
          }
        }

        // Step 3: Refresh the ENTIRE project to recalculate all progress
        if (projectId) {
          const projectPromise = dispatch(getProjectFull(projectId) as any);
          if (projectPromise && typeof projectPromise.then === "function") {
            await projectPromise;
          }

          // Step 3b: CRITICAL - Refresh S-Curve with proper await
          const scurvePromise = dispatch(getSCurve(projectId) as any);
          if (scurvePromise && typeof scurvePromise.then === "function") {
            await scurvePromise;
          }
        } else {
          console.warn("⚠️ No projectId available in Redux state");
        }
      } catch (refreshErr) {
        console.warn("⚠️ Warning refreshing data after save:", refreshErr);
        // Continue anyway - progress was saved even if refresh failed
      }

      // Step 4: Refresh progress logs for this subtask (no need to await)
      dispatch(getProgressLogs(data.subtaskId));

      return response.data;
    } catch (err: any) {
      console.error("❌ Error saving progress log:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateProgressLog = (
  progressLogId: string,
  data: {
    subtaskId: string;
    dailyPercent: number;
    remarks?: string;
    files?: File[];
    removeAttachmentIds?: string[];
    attachmentUpdates?: Array<{
      id: string;
      name?: string;
      sortOrder?: number;
    }>;
  },
) => {
  return async (dispatch: AppDispatch, getState: any) => {
    try {
      dispatch(setLoading(true));

      const formData = new FormData();
      formData.append("dailyPercent", String(data.dailyPercent));
      formData.append("remarks", data.remarks ?? "");

      if (data.removeAttachmentIds?.length) {
        formData.append("removeAttachmentIds", JSON.stringify(data.removeAttachmentIds));
      }

      if (data.attachmentUpdates?.length) {
        formData.append("attachmentUpdates", JSON.stringify(data.attachmentUpdates));
      }

      const uniqueFiles = data.files?.filter(
        (file, index, list) =>
          list.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified,
          ) === index,
      );

      uniqueFiles?.forEach((file) => formData.append("attachments", file));

      const response = await axiosApi.put(`/progress/${progressLogId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await refreshProgressDependencies(dispatch, getState, data.subtaskId);

      return response.data;
    } catch (err: any) {
      console.error("❌ Error updating progress log:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const deleteProgressLog = (progressLogId: string, subtaskId: string) => {
  return async (dispatch: AppDispatch, getState: any) => {
    try {
      dispatch(setLoading(true));

      await axiosApi.delete(`/progress/${progressLogId}`);
      await refreshProgressDependencies(dispatch, getState, subtaskId);

      return true;
    } catch (err: any) {
      console.error("❌ Error deleting progress log:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};
