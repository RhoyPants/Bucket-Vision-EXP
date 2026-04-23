import axiosApi from "@/app/lib/axios";

// 🔹 GET ALL ROLES
export const getRoles = async () => {
  const res = await axiosApi.get("/roles");
  return res.data;
};

// 🔹 GET ROLE PERMISSIONS
export const getRolePermissions = async (roleId: string) => {
  const res = await axiosApi.get(`/roles/${roleId}/permissions`);
  return res.data;
};

// 🔹 UPDATE ROLE PERMISSIONS
export const updateRolePermissions = async (
  roleId: string,
  permissions: any[]
) => {
  const res = await axiosApi.put(`/roles/${roleId}/permissions`, {
    permissions,
  });
  return res.data;
};

// 🔹 CREATE ROLE
export const createRole = async (data: {
  name: string;
  permissions: any[];
}) => {
  const res = await axiosApi.post("/roles", data);
  return res.data;
};