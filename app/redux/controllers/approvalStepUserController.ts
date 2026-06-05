import { AppDispatch } from "../store";
import {
  getUsersByRole,
  getApprovalStepUsers,
  assignUsersToApprovalStep,
  addUserToApprovalStep,
  removeUserFromApprovalStep,
  clearApprovalStepUsers,
} from "@/app/api-service/approvalStepUserService";
import {
  setUsersByRole,
  setStepAssignments,
  addStepAssignment,
  removeStepAssignment,
  clearStepAssignments,
  setLoading,
  setError,
} from "../slices/approvalStepUserSlice";

export const fetchUsersByRole = (roleId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getUsersByRole(roleId);

      if (response.success) {
        dispatch(setUsersByRole({ role: roleId, users: response.data }));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to fetch users by role");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error fetching users by role";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching users by role:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const fetchStepAssignments = (stepId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getApprovalStepUsers(stepId);

      if (response.success) {
        dispatch(setStepAssignments({ stepId, users: response.data }));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to fetch step assignments");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error fetching step assignments";
      dispatch(setError(errorMsg));
      console.error("❌ Error fetching step assignments:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const assignUsers = (stepId: string, userIds: string[]) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await assignUsersToApprovalStep(stepId, { userIds });

      if (response.success) {
        const assignedUsers = response.data?.assignedUsers || [];
        dispatch(setStepAssignments({ stepId, users: assignedUsers }));
        return assignedUsers;
      } else {
        throw new Error(response.error?.message || "Failed to assign users");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error assigning users to step";
      dispatch(setError(errorMsg));
      console.error("❌ Error assigning users:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const addUserToStep = (stepId: string, userId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await addUserToApprovalStep(stepId, { userId });

      if (response.success) {
        const assignedUser = response.data?.user;
        if (assignedUser) {
          dispatch(addStepAssignment({ stepId, user: assignedUser }));
        }
        return assignedUser;
      } else {
        throw new Error(response.error?.message || "Failed to add user to step");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error adding user to step";
      dispatch(setError(errorMsg));
      console.error("❌ Error adding user to step:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const removeUserFromStep = (stepId: string, userId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await removeUserFromApprovalStep(stepId, userId);

      if (response.success) {
        dispatch(removeStepAssignment({ stepId, userId }));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to remove user from step");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error removing user from step";
      dispatch(setError(errorMsg));
      console.error("❌ Error removing user from step:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const clearUserAssignments = (stepId: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await clearApprovalStepUsers(stepId);

      if (response.success) {
        dispatch(clearStepAssignments(stepId));
        return response.data;
      } else {
        throw new Error(response.error?.message || "Failed to clear assignments");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message || "Error clearing user assignments";
      dispatch(setError(errorMsg));
      console.error("❌ Error clearing assignments:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};
