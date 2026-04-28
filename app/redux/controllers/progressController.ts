import axiosApi from "@/app/lib/axios";
import { AppDispatch } from "../store";
import { setLogs, setLoading } from "../slices/progressSlice";
import dayjs from "dayjs";
import { getSCurve } from "./scurveController";
import { getProjectFull } from "./projectController";
import { loadKanbanByTask } from "./subTaskController";

// ✅ GET LOGS BY SUBTASK
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
export const saveProgressLog = (data: {
  subtaskId: string;
  date: string;
  dailyPercent: number;
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
      formData.append("latitude", String(latitude));
      formData.append("longitude", String(longitude));

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

      // Add photo if provided
      if (data.file) {
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
        // Step 1: Fetch subtask details to get taskId
        const subtaskRes = await axiosApi.get(`/progress/subtask/${data.subtaskId}/details`);
        const subtaskData = subtaskRes.data?.data;
        
        const taskId = subtaskData?.taskId;
        
        // Get projectId from Redux state (more reliable than API response)
        const currentState = getState();
        let projectId = currentState.project?.currentProjectId;
        
        console.log("📊 Task ID:", taskId, "Project ID:", projectId);

        // Step 2: Refresh the task and subtask via kanban (updates subtask progress)
        if (taskId) {
          const kanbanPromise = dispatch(loadKanbanByTask(taskId) as any);
          if (kanbanPromise && typeof kanbanPromise.then === "function") {
            await kanbanPromise;
          }
          console.log("✅ Task refreshed:", taskId);
        }

        // Step 3: Refresh the ENTIRE project to recalculate all progress
        if (projectId) {
          const projectPromise = dispatch(getProjectFull(projectId) as any);
          if (projectPromise && typeof projectPromise.then === "function") {
            await projectPromise;
          }
          console.log("✅ Project data refreshed:", projectId);

          // Step 3b: CRITICAL - Refresh S-Curve with proper await
          const scurvePromise = dispatch(getSCurve(projectId) as any);
          if (scurvePromise && typeof scurvePromise.then === "function") {
            await scurvePromise;
            console.log("✅ S-Curve updated from controller:", projectId);
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
