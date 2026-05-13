import axiosApi from "@/app/lib/axios";

// ============ APPROVAL STEP USER TYPES ============
export interface ApprovalStepUserData {
  userId: string;
}

export interface ApprovalStepUsersData {
  userIds: string[];
}

// ============ APPROVAL STEP USER API ============

// 🔹 GET USERS BY ROLE
export const getUsersByRole = async (roleId: string) => {
  const res = await axiosApi.get(`/admin/approval/steps/roles/${roleId}/users`);
  return res.data;
};

// 🔹 GET ASSIGNED USERS FOR APPROVAL STEP
export const getApprovalStepUsers = async (stepId: string) => {
  const res = await axiosApi.get(`/admin/approval/steps/${stepId}/users`);
  return res.data;
};

// 🔹 ASSIGN USERS TO APPROVAL STEP
export const assignUsersToApprovalStep = async (
  stepId: string,
  data: ApprovalStepUsersData
) => {
  const res = await axiosApi.post(`/admin/approval/steps/${stepId}/users`, data);
  return res.data;
};

// 🔹 ADD SINGLE USER TO APPROVAL STEP
export const addUserToApprovalStep = async (
  stepId: string,
  data: ApprovalStepUserData
) => {
  const res = await axiosApi.post(`/admin/approval/steps/${stepId}/users/add`, data);
  return res.data;
};

// 🔹 REMOVE USER FROM APPROVAL STEP
export const removeUserFromApprovalStep = async (
  stepId: string,
  userId: string
) => {
  const res = await axiosApi.delete(`/admin/approval/steps/${stepId}/users/${userId}`);
  return res.data;
};

// 🔹 CLEAR ALL USER ASSIGNMENTS (REVERT TO ROLE-BASED)
export const clearApprovalStepUsers = async (stepId: string) => {
  const res = await axiosApi.delete(`/admin/approval/steps/${stepId}/users`);
  return res.data;
};
