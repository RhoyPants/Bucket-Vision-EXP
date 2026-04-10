import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import { setUser, setLoading, setError } from "../slices/authSlice";

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

      // 🔥 UPDATE REDUX
      dispatch(setUser({ user, token: accessToken }));

    } catch (err: any) {
      dispatch(setError("Login failed"));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};