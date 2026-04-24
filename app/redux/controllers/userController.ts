import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import { setMembers, setUsers, setLoading } from "../slices/userSlice";

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

// ✅ GET ALL USERS
export const getUsers = () => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));

      const res = await axiosApi.get("/users");

      dispatch(setUsers(res.data.data || res.data));

      return res.data.data || res.data;
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  };
};