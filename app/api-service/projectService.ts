import axiosApi from "@/app/lib/axios";

/**
 * Project API Service
 * Handles project-related API operations including project filtering
 */

/**
 * Get projects where the current user has pending approvals
 * Returns projects in approval queue that need user's review
 */
export type ProjectListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  businessUnitId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

const cleanParams = (params?: ProjectListQuery) => {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "" && value !== "ALL"),
  );
};

export async function getMyApprovals(params?: ProjectListQuery) {
  const response = await axiosApi.get("/projects/my-approvals", {
    params: cleanParams(params),
  });
  return response.data || { data: [] };
}

/**
 * Get projects owned by current user with non-DRAFT status
 * Returns submitted projects in various stages of approval/completion
 */
export async function getMyRequests(params?: ProjectListQuery) {
  const response = await axiosApi.get("/projects/my-requests", {
    params: cleanParams(params),
  });
  return response.data || { data: [] };
}

/**
 * Get draft projects owned by current user
 * Returns projects with status === DRAFT
 */
export async function getMyDrafts(params?: ProjectListQuery) {
  const response = await axiosApi.get("/projects/my-drafts", {
    params: cleanParams(params),
  });
  return response.data || { data: [] };
}

/**
 * Get projects with view filter
 * Alternative to dedicated endpoints - supports view parameter
 * @param view - "my-approval" | "my-request" | "my-draft"
 */
export async function getProjectsByView(view: "my-approval" | "my-request" | "my-draft") {
  const response = await axiosApi.get(`/projects?view=${view}`);
  return response.data?.data || response.data || [];
}

export async function getProjectsByStatus(status: string) {
  const response = await axiosApi.get(`/projects/status/${status}`);
  return response.data?.data || response.data || [];
}

export async function getActiveProjectDropdown() {
  const response = await axiosApi.get("/projects/active/dropdown");
  return response.data?.data || response.data || [];
}
