import axiosApi from "@/app/lib/axios";

/**
 * Business Unit API Service
 * Handles all business unit operations
 */

// ===== GET ENDPOINTS =====

/**
 * Get all business units with optional filters
 * @param entity - Optional: "GVI|GVE|HULMA"
 * @param isActive - Optional: true|false
 */
export async function getAllBusinessUnits(entity?: string, isActive?: boolean) {
  const params = new URLSearchParams();
  if (entity) params.append("entity", entity);
  if (isActive !== undefined) params.append("isActive", String(isActive));

  const response = await axiosApi.get(`/business-units?${params}`);
  return response.data?.data || [];
}

/**
 * Get all business units for dropdown (public endpoint, no auth required)
 */
export async function getBusinessUnitsDropdown() {
  const response = await axiosApi.get("/business-units/dropdown");
  return response.data?.data || [];
}

/**
 * Get business units for dropdown filtered by entity (public endpoint, no auth required)
 * @param entity - "GVI"|"GVE"|"HULMA"
 */
export async function getBusinessUnitsDropdownByEntity(entity: string) {
  const response = await axiosApi.get(`/business-units/dropdown/${entity}`);
  return response.data?.data || [];
}

/**
 * Get business unit by ID
 * @param id - Business Unit ID (UUID)
 */
export async function getBusinessUnitById(id: string) {
  const response = await axiosApi.get(`/business-units/${id}`);
  return response.data?.data;
}

/**
 * Get business unit by code
 * @param code - Business Unit code (e.g., "EMO")
 */
export async function getBusinessUnitByCode(code: string) {
  const response = await axiosApi.get(`/business-units/code/${code}`);
  return response.data?.data;
}

// ===== POST ENDPOINTS =====

/**
 * Create new business unit
 * @param data - Business unit creation data
 */
export async function createBusinessUnit(data: {
  code: string;
  name: string;
  entity: string;
  buHeadUserId?: string | null;
  assistantHeadUserId?: string | null;
}) {
  const response = await axiosApi.post("/business-units", data);
  return response.data?.data;
}

// ===== PUT ENDPOINTS =====

/**
 * Update business unit
 * @param id - Business Unit ID
 * @param data - Fields to update
 */
export async function updateBusinessUnit(
  id: string,
  data: Partial<{
    name: string;
    entity: string;
    buHeadUserId: string | null;
    assistantHeadUserId: string | null;
    isActive: boolean;
  }>
) {
  const response = await axiosApi.put(`/business-units/${id}`, data);
  return response.data?.data;
}

/**
 * @deprecated Use updateBusinessUnit with buHeadUserId.
 */
export async function assignBUHead(id: string, buHeadUserId: string | null) {
  const response = await axiosApi.put(`/business-units/${id}`, { buHeadUserId });
  return response.data?.data;
}

/**
 * @deprecated Use updateBusinessUnit with assistantHeadUserId.
 */
export async function assignAssistantBUHead(
  id: string,
  assistantHeadUserId: string | null
) {
  const response = await axiosApi.put(`/business-units/${id}`, {
    assistantHeadUserId,
  });
  return response.data?.data;
}

// ===== DELETE ENDPOINTS =====

/**
 * Delete business unit
 * @param id - Business Unit ID
 */
export async function deleteBusinessUnit(id: string) {
  const response = await axiosApi.delete(`/business-units/${id}`);
  return response.data?.data;
}
