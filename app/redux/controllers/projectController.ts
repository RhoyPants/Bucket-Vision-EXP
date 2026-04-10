import { AppDispatch } from "../store";
import axiosApi from "@/app/lib/axios";
import { setProjects } from "../slices/projectSlice";

export const getProjects = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axiosApi.get("/projects");

      dispatch(setProjects(res.data));

      return res.data;
    } catch (err) {
      console.error("❌ Error fetching projects:", err);
      throw err;
    }
  };
};