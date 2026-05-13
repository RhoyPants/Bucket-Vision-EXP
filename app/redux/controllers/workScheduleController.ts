import { AppDispatch } from "../store";
import {
  getWorkSchedules,
  getWorkScheduleById,
  getDefaultWorkSchedule,
  createWorkSchedule,
  updateWorkSchedule,
  setDefaultWorkSchedule as setDefaultWorkScheduleAPI,
  addHolidayToSchedule,
  removeHolidayFromSchedule,
  deleteWorkSchedule,
} from "@/app/api-service/workScheduleService";
import {
  setSchedules,
  addSchedule,
  updateScheduleLocal,
  deleteScheduleLocal,
  setSelectedSchedule,
  setDefaultScheduleLocal,
  setLoading,
  setError,
  WorkSchedule,
} from "../slices/workScheduleSlice";

export const getAllWorkSchedules = (onlyActive?: boolean) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getWorkSchedules(onlyActive);

      if (response.success) {
        dispatch(setSchedules(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to fetch schedules");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error fetching work schedules";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching schedules:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const getScheduleById = (scheduleId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getWorkScheduleById(scheduleId);

      if (response.success) {
        dispatch(setSelectedSchedule(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to fetch schedule");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error fetching schedule";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching schedule:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const getDefaultSchedule = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getDefaultWorkSchedule();

      if (response.success) {
        dispatch(setDefaultSchedule(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to fetch default schedule");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error fetching default schedule";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching default schedule:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const createSchedule = (data: {
  name: string;
  description?: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  includeHolidays: boolean;
  isDefault?: boolean;
}) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await createWorkSchedule(data);

      if (response.success) {
        dispatch(addSchedule(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to create schedule");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error creating work schedule";
      dispatch(setError(errorMsg));
      console.error("❌ Error creating schedule:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateSchedule = (
  scheduleId: string,
  data: {
    name?: string;
    description?: string;
    monday?: boolean;
    tuesday?: boolean;
    wednesday?: boolean;
    thursday?: boolean;
    friday?: boolean;
    saturday?: boolean;
    sunday?: boolean;
    includeHolidays?: boolean;
    isDefault?: boolean;
    isActive?: boolean;
  }
) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await updateWorkSchedule(scheduleId, data);

      if (response.success) {
        dispatch(updateScheduleLocal(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to update schedule");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error updating work schedule";
      dispatch(setError(errorMsg));
      console.error("❌ Error updating schedule:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const setDefaultSchedule = (scheduleId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await setDefaultWorkScheduleAPI(scheduleId);

      if (response.success) {
        dispatch(setDefaultScheduleLocal(response.data));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to set default schedule");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error setting default schedule";
      dispatch(setError(errorMsg));
      console.error("❌ Error setting default schedule:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const addHoliday = (
  scheduleId: string,
  data: {
    date: string;
    name: string;
  }
) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await addHolidayToSchedule(scheduleId, data);

      if (response.success) {
        // Re-fetch the updated schedule
        const scheduleResponse = await getWorkScheduleById(scheduleId);
        if (scheduleResponse.success) {
          dispatch(updateScheduleLocal(scheduleResponse.data));
        }
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to add holiday");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error adding holiday";
      dispatch(setError(errorMsg));
      console.error("❌ Error adding holiday:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const removeHoliday = (holidayId: string, scheduleId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await removeHolidayFromSchedule(holidayId);

      if (response.success) {
        // Re-fetch the updated schedule
        const scheduleResponse = await getWorkScheduleById(scheduleId);
        if (scheduleResponse.success) {
          dispatch(updateScheduleLocal(scheduleResponse.data));
        }
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to remove holiday");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error removing holiday";
      dispatch(setError(errorMsg));
      console.error("❌ Error removing holiday:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const deleteSchedule = (scheduleId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await deleteWorkSchedule(scheduleId);

      if (response.success) {
        dispatch(deleteScheduleLocal(scheduleId));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to delete schedule");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error deleting work schedule";
      dispatch(setError(errorMsg));
      console.error("❌ Error deleting schedule:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};
