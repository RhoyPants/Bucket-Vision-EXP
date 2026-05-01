import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import { setUser, setLoading, setError } from "../slices/authSlice";

/**
 * Fetch current user data from backend
 * Called after login to populate user details and permissions
 */
export const fetchCurrentUser = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const res = await axiosApi.get("/auth/me");
      const { user, permissions } = res.data;

      // Get token from localStorage
      const token = localStorage.getItem("token");

      // 🔥 UPDATE REDUX WITH FULL USER DATA
      dispatch(setUser({ user, token: token || "", permissions }));

    } catch (err: any) {
      dispatch(setError("Failed to fetch user data"));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};
