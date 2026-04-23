import axiosApi from "./axios";

export const getUsers = async () => {
  const res = await axiosApi.get("/users");
  return res.data;
};

export const createUser = async (data: any) => {
  const res = await axiosApi.post("/users", data);
  return res.data;
};

export const updateUser = async (id: string, data: any) => {
  const res = await axiosApi.put(`/users/${id}`, data);
  return res.data;
};