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

export const createUser = async (data: unknown) => {
  const res = await axiosApi.post("/users", data);
  return res.data;
};

export const updateUser = async (id: string, data: unknown) => {
  const res = await axiosApi.put(`/users/${id}`, data);
  return res.data;
};

export const updateUserStatus = async (userId: string, isActive: boolean) => {
  const res = await axiosApi.patch(`/users/${userId}/status`, { isActive });
  return res.data;
};

export const deleteUser = async (userId: string) => {
  const res = await axiosApi.delete(`/users/${userId}`);
  return res.data;
};
