import axiosApi from "./axios";

export const getUsers = async () => {
  const res = await axiosApi.get("/users");
  return res.data;
};

export const getUserById = async (userId: string) => {
  const res = await axiosApi.get(`/users/${userId}`);
  const payload = res.data;

  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }

  return payload;
};

export const createUser = async (data: any) => {
  const res = await axiosApi.post("/users", data);
  return res.data;
};

export const updateUser = async (id: string, data: any) => {
  const res = await axiosApi.put(`/users/${id}`, data);
  return res.data;
};

export const updateUserStatus = async (userId: string, isActive: boolean) => {
  const res = await axiosApi.patch(`/users/${userId}/status`, { isActive });
  return res.data;
};

export const deleteUser = async (userId: string) => {
  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("token");

  const res = await fetch(`${baseURL}/users/${userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const payload = await res.json().catch(() => null);

  if (payload) {
    return payload;
  }

  return {
    success: res.ok,
    message: res.ok ? "User deleted successfully" : "Failed to delete user",
    error: res.ok ? null : "DELETE_FAILED",
    data: null,
  };
};