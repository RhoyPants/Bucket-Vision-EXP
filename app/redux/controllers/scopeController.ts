import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import {
  setScopes,
  addScope,
  updateScopeLocal,
  deleteScopeLocal,
} from "../slices/scopeSlice";

// ✅ GET SCOPES BY PROJECT
export const getScopesByProject =
  (projectId: string) => async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.get(`/scopes/project/${projectId}`);

      const scopes = res.data || [];

      dispatch(setScopes(scopes));

      return scopes;
    } catch (error) {
      console.error("❌ Error fetching scopes:", error);
      return [];
    }
  };

// ✅ GET SINGLE SCOPE
export const getScopeById = (scopeId: string) => {
  return async () => {
    try {
      const res = await axiosApi.get(`/scopes/${scopeId}`);
      return res.data;
    } catch (err) {
      console.error("❌ Error fetching scope:", err);
      throw err;
    }
  };
};

// ✅ CREATE SCOPE
export const createScope = (data: any) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.post("/scopes", data);

      // optional local update (safe for future)
      dispatch(addScope(res.data));

      return res.data;
    } catch (err) {
      console.error("❌ Error creating scope:", err);
      throw err;
    }
  };
};

// ✅ UPDATE SCOPE
export const updateScope = (scopeId: string, data: any) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.put(`/scopes/${scopeId}`, data);

      dispatch(updateScopeLocal(res.data));

      return res.data;
    } catch (err) {
      console.error("❌ Error updating scope:", err);
      throw err;
    }
  };
};

// ✅ DELETE SCOPE
export const deleteScope = (scopeId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      await axiosApi.delete(`/scopes/${scopeId}`);

      dispatch(deleteScopeLocal(scopeId));
    } catch (err) {
      console.error("❌ Error deleting scope:", err);
      throw err;
    }
  };
};