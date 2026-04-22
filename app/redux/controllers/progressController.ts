import axiosApi from "@/app/lib/axios";
import { AppDispatch } from "../store";
import { setLogs, setLoading } from "../slices/progressSlice";
import dayjs from "dayjs";
import { getSCurve } from "./scurveController";

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

// ✅ CREATE / UPDATE LOG (SMART + FULL SUPPORT 🔥)
export const saveProgressLog = (data: {
  subtaskId: string;
  date: string;
  dailyPercent: number;
  file?: File;
  remarks?: string;
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

      // 📍 GEO LOCATION
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        },
      );

      // 📦 ALWAYS USE FORMDATA (CREATE + UPDATE)
      const formData = new FormData();

      formData.append("subtaskId", data.subtaskId);
      formData.append("date", targetDate);
      formData.append("dailyPercent", String(data.dailyPercent));

      formData.append("lat", String(position.coords.latitude));
      formData.append("lng", String(position.coords.longitude));

      formData.append("remarks", data.remarks || "");

      if (data.file) {
        formData.append("photo", data.file);
      }
      // 🔥 ALWAYS UPSERT (NO MORE PUT)
      await axiosApi.post("/progress", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // 🔥 ALWAYS REFRESH STATE
      const projectId =state.project?.currentProjectId;
      if (projectId) {
        dispatch(getSCurve(projectId));
      }
      dispatch(getProgressLogs(data.subtaskId));
    } catch (err) {
      console.error("❌ Error saving progress log:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};
