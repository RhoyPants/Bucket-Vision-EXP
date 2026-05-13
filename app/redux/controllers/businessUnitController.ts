import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import {
  setBusinessUnits,
  setSelectedBusinessUnit,
  addBusinessUnit,
  updateBusinessUnitLocal,
  deleteBusinessUnitLocal,
  setLoading,
  setError,
  clearError,
} from "../slices/businessUnitSlice";

// ✅ GET ALL BUSINESS UNITS
export const getAllBusinessUnits = (entity?: string, isActive?: boolean) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      let url = "/business-units";
      const params = new URLSearchParams();
      if (entity) params.append("entity", entity);
      if (isActive !== undefined) params.append("isActive", String(isActive));
      if (params.toString()) url += `?${params}`;

      const res = await axiosApi.get(url);

      dispatch(setBusinessUnits(res.data?.data || res.data));

      return res.data?.data || res.data;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || "Failed to fetch business units";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching business units:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ✅ GET BUSINESS UNIT BY ID
export const getBusinessUnitById = (id: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const res = await axiosApi.get(`/business-units/${id}`);

      dispatch(setSelectedBusinessUnit(res.data?.data));

      return res.data?.data;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || "Failed to fetch business unit";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching business unit:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ✅ CREATE BUSINESS UNIT
export const createBusinessUnit = (data: {
  code: string;
  name: string;
  entity: string;
  buHead?: string | null;
  assistantHead?: string | null;
}) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const res = await axiosApi.post("/business-units", data);

      const newBU = res.data?.data;
      dispatch(addBusinessUnit(newBU));

      return newBU;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || "Failed to create business unit";
      dispatch(setError(errorMsg));
      console.error("❌ Error creating business unit:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ✅ UPDATE BUSINESS UNIT
export const updateBusinessUnit = (
  id: string,
  data: Partial<{
    name: string;
    entity: string;
    buHead: string | null;
    assistantHead: string | null;
    isActive: boolean;
  }>
) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const res = await axiosApi.put(`/business-units/${id}`, data);

      const updated = res.data?.data;
      dispatch(updateBusinessUnitLocal(updated));

      return updated;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || "Failed to update business unit";
      dispatch(setError(errorMsg));
      console.error("❌ Error updating business unit:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ✅ ASSIGN BU HEAD
export const assignBUHead = (id: string, buHead: string | null) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const res = await axiosApi.put(`/business-units/${id}/bu-head`, { buHead });

      const updated = res.data?.data;
      dispatch(updateBusinessUnitLocal(updated));

      return updated;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || "Failed to assign BU Head";
      dispatch(setError(errorMsg));
      console.error("❌ Error assigning BU Head:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ✅ ASSIGN ASSISTANT BU HEAD
export const assignAssistantBUHead = (id: string, assistantHead: string | null) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const res = await axiosApi.put(`/business-units/${id}/assistant-bu-head`, {
        assistantHead,
      });

      const updated = res.data?.data;
      dispatch(updateBusinessUnitLocal(updated));

      return updated;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || "Failed to assign Assistant BU Head";
      dispatch(setError(errorMsg));
      console.error("❌ Error assigning Assistant BU Head:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ✅ DELETE BUSINESS UNIT
export const deleteBusinessUnit = (id: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      await axiosApi.delete(`/business-units/${id}`);

      dispatch(deleteBusinessUnitLocal(id));

      return true;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || "Failed to delete business unit";
      dispatch(setError(errorMsg));
      console.error("❌ Error deleting business unit:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};
