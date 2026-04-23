import axiosApi from "./axios";

/**
 * =========================================
 * GET BOTH (MANAGERS + MEMBERS)
 * =========================================
 */
export const getUserRelations = async (userId?: string) => {
  try {
    const managersUrl = userId
      ? `/users/${userId}/managers`
      : `/users/my-managers`;

    const membersUrl = userId
      ? `/users/${userId}/members`
      : `/users/my-members`;

    const [managersRes, membersRes] = await Promise.all([
      axiosApi.get(managersUrl),
      axiosApi.get(membersUrl),
    ]);

    return {
      managers: managersRes.data?.data || [],
      members: membersRes.data?.data || [],
    };
  } catch (err) {
    console.error("Error loading relations:", err);
    return {
      managers: [],
      members: [],
    };
  }
};

/**
 * =========================================
 * GET MANAGERS
 * =========================================
 */
export const getUserManagers = async (userId?: string) => {
  try {
    const url = userId
      ? `/users/${userId}/managers`
      : `/users/my-managers`;

    const res = await axiosApi.get(url);
    return res.data?.data || [];
  } catch (err) {
    console.error("Error fetching managers:", err);
    return [];
  }
};

/**
 * =========================================
 * GET MEMBERS
 * =========================================
 */
export const getUserMembers = async (userId?: string) => {
  try {
    const url = userId
      ? `/users/${userId}/members`
      : `/users/my-members`;

    const res = await axiosApi.get(url);
    return res.data?.data || [];
  } catch (err) {
    console.error("Error fetching members:", err);
    return [];
  }
};

/**
 * =========================================
 * ASSIGN MANAGER
 * =========================================
 */
export const assignManager = async (data: {
  userId: string;
  managerId: string;
}) => {
  const res = await axiosApi.post("/users/assign-manager", data);
  return res.data;
};

/**
 * =========================================
 * REMOVE MANAGER
 * =========================================
 */
export const removeRelation = async (data: {
  userId: string;
  managerId: string;
}) => {
  const res = await axiosApi.post("/users/remove-manager", data);
  return res.data;
};

/**
 * =========================================
 * GET ORG CHART
 * =========================================
 */
export const getOrgChart = async (userId: string) => {
  const res = await axiosApi.get(`/users/org-chart/${userId}`);
  return res.data?.data;
};

/**
 * =========================================
 * BULK ASSIGN MANAGERS
 * =========================================
 */
export const bulkAssignManagers = async (data: {
  userId: string;
  managerIds: string[];
}) => {
  const results = await Promise.all(
    data.managerIds.map((managerId) =>
      assignManager({ userId: data.userId, managerId })
    )
  );

  return results;
};