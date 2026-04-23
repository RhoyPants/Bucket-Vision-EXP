import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import { setMembers, setLoading } from "../slices/userSlice";

// ✅ GET MY MEMBERS
export const getMyMembers = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const res = await axiosApi.get("/users/my-members");

      dispatch(setMembers(res.data.data || res.data));

      return res.data;
    } catch (err) {
      console.error("❌ Error fetching members:", err);
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  };
};