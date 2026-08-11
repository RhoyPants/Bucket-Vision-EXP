import axiosApi from "@/app/lib/axios";
import type { AxiosRequestConfig } from "axios";

export interface Holiday {
  id: string;
  date: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HolidayPayload {
  date?: string;
  name?: string;
  description?: string;
}

type AuthAwareRequestConfig = AxiosRequestConfig & {
  skipAuthRedirect: boolean;
};

// A holiday-route 401 must not invalidate an otherwise valid browser session.
const holidayRequestConfig: AuthAwareRequestConfig = {
  skipAuthRedirect: true,
};

const unwrap = <T,>(response: { data?: { data?: T } | T }): T => {
  const body = response.data;
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
};

export const getHolidays = async (): Promise<Holiday[]> => {
  const response = await axiosApi.get("/admin/holidays", holidayRequestConfig);
  return unwrap<Holiday[]>(response) || [];
};

export const createHoliday = async (payload: Required<Pick<HolidayPayload, "date" | "name">> & HolidayPayload) => {
  const response = await axiosApi.post("/admin/holidays", payload, holidayRequestConfig);
  return unwrap<Holiday>(response);
};

export const updateHoliday = async (id: string, payload: HolidayPayload) => {
  const response = await axiosApi.put(`/admin/holidays/${id}`, payload, holidayRequestConfig);
  return unwrap<Holiday>(response);
};

export const deleteHoliday = async (id: string) => {
  const response = await axiosApi.delete(`/admin/holidays/${id}`, holidayRequestConfig);
  return unwrap<Holiday>(response);
};
