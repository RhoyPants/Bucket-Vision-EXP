import axiosApi from "@/app/lib/axios";

export type ProjectPhase = {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  order: number;
  scopes?: Array<Record<string, unknown>>;
};

export const getProjectPhases = async (projectId: string): Promise<ProjectPhase[]> => {
  const response = await axiosApi.get(`/phases/project/${projectId}`);
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

export const createPhase = async (data: Pick<ProjectPhase, "projectId" | "name"> & Partial<Pick<ProjectPhase, "description" | "order">>) => {
  const response = await axiosApi.post("/phases", data);
  return response.data?.data ?? response.data;
};

export const updatePhase = async (phaseId: string, data: Partial<Pick<ProjectPhase, "name" | "description" | "order">>) => {
  const response = await axiosApi.put(`/phases/${phaseId}`, data);
  return response.data?.data ?? response.data;
};

export const deletePhase = async (phaseId: string) => {
  const response = await axiosApi.delete(`/phases/${phaseId}`);
  return response.data;
};
