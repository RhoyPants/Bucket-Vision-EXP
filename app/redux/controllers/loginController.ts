import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import { setUser, setLoading, setError } from "../slices/authSlice";
import { fetchCurrentUser } from "./authController";

export const login = (email: string, password: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const res = await axiosApi.post("/auth/login", {
        email,
        password,
      });

      const { accessToken, user, permissions, pagePermissions } = res.data;

      localStorage.setItem("token", accessToken);
      dispatch(setUser({ user, token: accessToken, permissions, pagePermissions }));

      await fetchCurrentUser()(dispatch);
    } catch (err: unknown) {
      dispatch(setError("Login failed"));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};
