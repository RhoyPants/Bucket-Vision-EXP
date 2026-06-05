import axiosApi from "@/app/lib/axios";

/**
 * Project API Service
 * Handles project-related API operations including project filtering
 */

/**
 * Get projects where the current user has pending approvals
 * Returns projects in approval queue that need user's review
 */
export async function getMyApprovals() {
  const response = await axiosApi.get("/projects/my-approvals");
  return response.data?.data || response.data || [];
}

/**
 * Get projects owned by current user with non-DRAFT status
 * Returns submitted projects in various stages of approval/completion
 */
export async function getMyRequests() {
  const response = await axiosApi.get("/projects/my-requests");
  return response.data?.data || response.data || [];
}

/**
 * Get draft projects owned by current user
 * Returns projects with status === DRAFT
 */
export async function getMyDrafts() {
  const response = await axiosApi.get("/projects/my-drafts");
  return response.data?.data || response.data || [];
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
