import { getMyPagePermissions } from "@/app/api-service/authService";
import axiosApi from "@/app/lib/axios";
import { AppDispatch } from "../store";
import {
  setError,
  setLoading,
  setPagePermissions,
  setUser,
} from "../slices/authSlice";

export const fetchCurrentUser = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const res = await axiosApi.get("/auth/me");
      const { user, permissions, pagePermissions } = res.data;
      const token = localStorage.getItem("token");

      dispatch(setUser({ user, token: token || "", permissions, pagePermissions }));

      const permissionRes = await getMyPagePermissions();
      dispatch(
        setPagePermissions({
          role: permissionRes.data?.role,
          pages: permissionRes.data?.pages || [],
        })
      );
    } catch (err: unknown) {
      dispatch(setPagePermissions({ role: null, pages: [] }));
      dispatch(setError("Failed to fetch user data"));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};
