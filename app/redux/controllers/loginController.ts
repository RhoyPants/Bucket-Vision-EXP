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

      const { accessToken, user } = res.data;

      // 🔥 SAVE TOKEN
      localStorage.setItem("token", accessToken);

      // 🔥 UPDATE REDUX WITH LOGIN RESPONSE
      dispatch(setUser({ user, token: accessToken }));

      // 🔥 FETCH FULL USER DATA WITH PERMISSIONS
      await dispatch(fetchCurrentUser() as any);

    } catch (err: any) {
      dispatch(setError("Login failed"));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};