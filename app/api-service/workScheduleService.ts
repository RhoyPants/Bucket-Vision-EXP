import axiosApi from "@/app/lib/axios";

// ============ WORK SCHEDULE TYPES ============
export interface WorkScheduleData {
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
}

export interface WorkScheduleUpdateData {
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

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

// ============ WORK SCHEDULE API ============

// 🔹 GET ALL WORK SCHEDULES
export const getWorkSchedules = async (onlyActive?: boolean) => {
  const url = onlyActive ? "/admin/work-schedules?onlyActive=true" : "/admin/work-schedules";
  const res = await axiosApi.get(url);
  return res.data;
};

// 🔹 GET WORK SCHEDULE BY ID
export const getWorkScheduleById = async (scheduleId: string) => {
  const res = await axiosApi.get(`/admin/work-schedules/${scheduleId}`);
  return res.data;
};

// 🔹 GET DEFAULT WORK SCHEDULE
export const getDefaultWorkSchedule = async () => {
  const res = await axiosApi.get("/admin/work-schedules/default");
  return res.data;
};

// 🔹 CREATE WORK SCHEDULE
export const createWorkSchedule = async (data: WorkScheduleData) => {
  const res = await axiosApi.post("/admin/work-schedules", data);
  return res.data;
};

// 🔹 UPDATE WORK SCHEDULE
export const updateWorkSchedule = async (
  scheduleId: string,
  data: WorkScheduleUpdateData
) => {
  const res = await axiosApi.patch(`/admin/work-schedules/${scheduleId}`, data);
  return res.data;
};

// 🔹 SET AS DEFAULT WORK SCHEDULE
export const setDefaultWorkSchedule = async (scheduleId: string) => {
  const res = await axiosApi.patch(`/admin/work-schedules/${scheduleId}/set-default`, {});
  return res.data;
};

// 🔹 ADD HOLIDAY TO SCHEDULE
export const addHolidayToSchedule = async (
  scheduleId: string,
  data: {
    date: string;
    name: string;
  }
) => {
  const res = await axiosApi.post(`/admin/work-schedules/${scheduleId}/holidays`, data);
  return res.data;
};

// 🔹 REMOVE HOLIDAY FROM SCHEDULE
export const removeHolidayFromSchedule = async (holidayId: string) => {
  const res = await axiosApi.delete(`/admin/work-schedules/holidays/${holidayId}`);
  return res.data;
};

// 🔹 DELETE WORK SCHEDULE
export const deleteWorkSchedule = async (scheduleId: string) => {
  const res = await axiosApi.delete(`/admin/work-schedules/${scheduleId}`);
  return res.data;
};
