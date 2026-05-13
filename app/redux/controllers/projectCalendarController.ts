"use client";

import axiosApi from "@/app/lib/axios";
import { AppDispatch } from "../store";
import {
  setSubtasks,
  setScopes,
  setLoading,
  setError,
  SubtaskBarData,
} from "../slices/projectCalendarSlice";

// ✅ Normalize raw subtask from API to SubtaskBarData
const normalizeSubtask = (raw: any, scopeId?: string, scopeName?: string): SubtaskBarData => ({
  id: raw.id,
  title: raw.title || "Untitled",
  progress: raw.progress ?? 0,
  startDate: raw.projectedStartDate || raw.startDate || "",
  endDate: raw.projectedEndDate || raw.endDate || "",
  scopeId: scopeId || raw.scope?.id || raw.scopeId || undefined,
  scopeName: scopeName || raw.scope?.name || raw.scopeName || undefined,
});

// ✅ FETCH SCOPES — /scopes/project/{projectId} (direct array response)
export const fetchCalendarScopes = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.get(`/scopes/project/${projectId}`);
      const scopes = (res.data || []).map((s: any) => ({
        id: s.id,
        name: s.name || s.title || "Unnamed",
      }));
      dispatch(setScopes(scopes));
      return scopes;
    } catch (err) {
      console.error("❌ Error fetching calendar scopes:", err);
      return [];
    }
  };
};

// ✅ FETCH ALL PROJECT SUBTASKS via scope → tasks → subtasks chain.
// Fetches ALL subtasks in the project (not just "my board").
// The year/month params are kept for API compatibility — filtering to the
// visible month is now done in the CalendarGrid component via calendarUtils.
export const fetchCalendarMonth = (
  projectId: string,
  year: number,
  month: number,
  scopeId?: string
) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      // Step 1: Get all scopes for the project
      const scopesRes = await axiosApi.get(`/scopes/project/${projectId}`);
      const allScopes: any[] = scopesRes.data || [];

      const scopesToQuery = scopeId
        ? allScopes.filter((s) => s.id === scopeId)
        : allScopes;

      if (scopesToQuery.length === 0) {
        dispatch(setSubtasks([]));
        return { subtasks: [] };
      }

      // Step 2: Get tasks for each scope in parallel
      const scopeTaskResults = await Promise.all(
        scopesToQuery.map((scope) =>
          axiosApi
            .get(`/tasks/scope/${scope.id}`)
            .then((r) => ({ tasks: r.data || [], scopeId: scope.id, scopeName: scope.name }))
            .catch(() => ({ tasks: [], scopeId: scope.id, scopeName: scope.name }))
        )
      );

      const taskRefs: { taskId: string; scopeId: string; scopeName: string }[] = [];
      scopeTaskResults.forEach(({ tasks, scopeId: sId, scopeName: sName }) => {
        tasks.forEach((task: any) => taskRefs.push({ taskId: task.id, scopeId: sId, scopeName: sName }));
      });

      if (taskRefs.length === 0) {
        dispatch(setSubtasks([]));
        return { subtasks: [] };
      }

      // Step 3: Get full task data (includes subtasks[]) for each task in parallel
      const fullTaskResults = await Promise.all(
        taskRefs.map(({ taskId, scopeId: sId, scopeName: sName }) =>
          axiosApi
            .get(`/tasks/${taskId}`)
            .then((r) => ({ task: r.data, scopeId: sId, scopeName: sName }))
            .catch(() => ({ task: null, scopeId: sId, scopeName: sName }))
        )
      );

      // Step 4: Extract and normalize all subtasks
      const allSubtasks: SubtaskBarData[] = [];
      fullTaskResults.forEach(({ task, scopeId: sId, scopeName: sName }) => {
        if (!task) return;
        (task.subtasks || []).forEach((s: any) => {
          allSubtasks.push(normalizeSubtask(s, sId, sName));
        });
      });

      dispatch(setSubtasks(allSubtasks));
      return { subtasks: allSubtasks };
    } catch (err) {
      console.error("❌ Error fetching calendar data:", err);
      dispatch(setError("Failed to load calendar"));
      return { subtasks: [] };
    } finally {
      dispatch(setLoading(false));
    }
  };
};
