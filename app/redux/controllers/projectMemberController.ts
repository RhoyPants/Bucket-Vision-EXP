import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import {
  setProjectMembers,
  setEngagedUsers,
  addProjectMember,
  removeProjectMember as removeProjectMemberAction,
  setLoading,
  setError,
} from "../slices/projectMemberSlice";

// ✅ GET PROJECT MEMBERS
export const getProjectMembers = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const res = await axiosApi.get(`/projects/${projectId}/members`);
      dispatch(setProjectMembers(res.data?.data || {}));

      return res.data?.data;
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || "Failed to load project members";
      dispatch(setError(errorMsg));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ✅ GET ENGAGED USERS
export const getEngagedUsers = (projectId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const res = await axiosApi.get(
        `/projects/${projectId}/engaged-users`
      );

      dispatch(setEngagedUsers(res.data?.data || []));
      return res.data?.data;
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        "Failed to load engaged users";
      dispatch(setError(errorMsg));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// 🔥 NEW: BATCH ASSIGN
export const assignProjectMembers = (
  projectId: string,
  userIds: string[],
  role: "OWNER" | "SUB_OWNER" | "MEMBER"
) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const res = await axiosApi.post(
        `/projects/${projectId}/assign-member`,
        {
          userIds,
          role,
        }
      );

      const newMembers = res.data?.data || [];

      // ✅ instant UI update
      newMembers.forEach((m: any) => {
        dispatch(addProjectMember(m));
      });

      dispatch(getEngagedUsers(projectId) as any);
      dispatch(setProjectMembers(res.data?.data || {}));

      return newMembers;
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        "Failed to assign members";
      dispatch(setError(errorMsg));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ✅ REMOVE MEMBER(S)
export const removeProjectMember = (
  projectId: string,
  userIds: string | string[]
) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      // Normalize to array
      const ids = Array.isArray(userIds) ? userIds : [userIds];

      const res = await axiosApi.post(
        `/projects/${projectId}/remove-member`,
        { userIds: ids }
      );

      // Remove each user from state
      ids.forEach((userId: string) => {
        dispatch(removeProjectMemberAction(userId));
      });

      dispatch(getEngagedUsers(projectId) as any);

      return true;
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        "Failed to remove member";
      dispatch(setError(errorMsg));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};